from datetime import datetime, timezone

from sqlalchemy import or_

from app.core.datetime_utils import ensure_utc, utc_now
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.deck import Deck, DeckVisibility
from app.models.progress import CardStatus, Rating, UserCardProgress
from app.models.review_log import ReviewLog
from app.models.session import SessionStatus, StudySession
from app.models.user import User, UserSettings
from app.services.scheduler_service import apply_rating


def _get_or_create_progress(db: Session, user_id: int, card_id: int) -> UserCardProgress:
    progress = (
        db.query(UserCardProgress)
        .filter(UserCardProgress.user_id == user_id, UserCardProgress.card_id == card_id)
        .first()
    )
    if not progress:
        progress = UserCardProgress(user_id=user_id, card_id=card_id, status=CardStatus.NEW)
        db.add(progress)
        db.flush()
    return progress


def _accessible_deck_ids(db: Session, user: User) -> list[int]:
    return [
        d.id
        for d in db.query(Deck)
        .filter(
            Deck.is_deleted == False,
            or_(Deck.owner_id == user.id, Deck.visibility == DeckVisibility.shared),
        )
        .all()
    ]


def _count_today_new(db: Session, user_id: int) -> int:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(ReviewLog)
        .join(UserCardProgress, ReviewLog.card_id == UserCardProgress.card_id)
        .filter(
            ReviewLog.user_id == user_id,
            ReviewLog.is_undone == False,
            ReviewLog.reviewed_at >= today_start,
            UserCardProgress.status != CardStatus.NEW,
        )
        .count()
    )


def _count_today_reviews(db: Session, user_id: int) -> int:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(ReviewLog)
        .filter(
            ReviewLog.user_id == user_id,
            ReviewLog.is_undone == False,
            ReviewLog.reviewed_at >= today_start,
        )
        .count()
    )


def get_study_queue(
    db: Session, user: User, deck_id: int | None = None, exclude_card_ids: set[int] | None = None
) -> list[tuple[Card, UserCardProgress]]:
    now = utc_now()
    exclude = exclude_card_ids or set()
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    daily_new_limit = settings.daily_new_limit if settings else 20
    daily_review_limit = settings.daily_review_limit if settings else 100

    deck_ids = [deck_id] if deck_id else _accessible_deck_ids(db, user)
    if not deck_ids:
        return []

    deck = db.query(Deck).filter(Deck.id == deck_id).first() if deck_id else None
    if deck:
        daily_new_limit = deck.new_cards_per_day
        daily_review_limit = deck.review_limit_per_day

    today_new_done = _count_today_new(db, user.id)
    today_reviews_done = _count_today_reviews(db, user.id)
    new_remaining = max(0, daily_new_limit - today_new_done)
    review_remaining = max(0, daily_review_limit - today_reviews_done)

    cards = db.query(Card).filter(Card.deck_id.in_(deck_ids), Card.is_deleted == False).all()

    due_cards: list[tuple[Card, UserCardProgress, int]] = []
    learning_cards: list[tuple[Card, UserCardProgress, int]] = []
    new_cards: list[tuple[Card, UserCardProgress, int]] = []

    for card in cards:
        if card.id in exclude:
            continue
        progress = _get_or_create_progress(db, user.id, card.id)
        if progress.status == CardStatus.SUSPENDED:
            continue

        if progress.status == CardStatus.NEW:
            new_cards.append((card, progress, 3))
        elif progress.status == CardStatus.LEARNING:
            if progress.due_at and ensure_utc(progress.due_at) <= now:
                learning_cards.append((card, progress, 2))
        elif progress.due_at and ensure_utc(progress.due_at) <= now:
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            priority = 0 if ensure_utc(progress.due_at) < today_start else 1
            due_cards.append((card, progress, priority))

    due_cards.sort(key=lambda x: (x[2], x[1].due_at or now))
    learning_cards.sort(key=lambda x: x[1].due_at or now)
    new_cards.sort(key=lambda x: x[0].id)

    queue: list[tuple[Card, UserCardProgress]] = []
    queue.extend([(c, p) for c, p, _ in due_cards[:review_remaining]])
    used = len(queue)
    queue.extend([(c, p) for c, p, _ in learning_cards[: max(0, review_remaining - used)]])
    queue.extend([(c, p) for c, p, _ in new_cards[:new_remaining]])

    db.commit()
    return queue


def _session_done_card_ids(db: Session, session_id: int) -> set[int]:
    logs = (
        db.query(ReviewLog)
        .filter(ReviewLog.session_id == session_id, ReviewLog.is_undone == False)
        .all()
    )
    return {log.card_id for log in logs}


def create_session(db: Session, user: User, deck_id: int | None = None) -> StudySession:
    active = (
        db.query(StudySession)
        .filter(StudySession.user_id == user.id, StudySession.status == SessionStatus.active)
        .first()
    )
    if active:
        active.status = SessionStatus.abandoned
        active.ended_at = datetime.now(timezone.utc)

    queue = get_study_queue(db, user, deck_id)
    session = StudySession(
        user_id=user.id,
        deck_id=deck_id,
        total_cards=len(queue),
        completed_cards=0,
        status=SessionStatus.active,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_next(db: Session, session: StudySession, user: User) -> tuple[Card, UserCardProgress] | None:
    done_ids = _session_done_card_ids(db, session.id)
    queue = get_study_queue(db, user, session.deck_id, exclude_card_ids=done_ids)
    if not queue:
        return None
    return queue[0]


def answer_card(
    db: Session,
    session: StudySession,
    user: User,
    card_id: int,
    rating_str: str,
    response_time_ms: int | None = None,
) -> dict:
    rating = Rating(rating_str)
    card = db.query(Card).filter(Card.id == card_id, Card.is_deleted == False).first()
    if not card:
        raise ValueError("Thẻ không tồn tại")

    existing = (
        db.query(ReviewLog)
        .filter(
            ReviewLog.session_id == session.id,
            ReviewLog.card_id == card_id,
            ReviewLog.is_undone == False,
        )
        .first()
    )
    if existing:
        raise ValueError("Thẻ này đã được trả lời trong phiên học")

    progress = _get_or_create_progress(db, user.id, card_id)
    old_interval = progress.interval_days
    old_due_at = progress.due_at
    old_status = progress.status

    apply_rating(progress, rating)

    log = ReviewLog(
        session_id=session.id,
        user_id=user.id,
        card_id=card_id,
        rating=rating,
        old_interval=old_interval,
        new_interval=progress.interval_days,
        old_due_at=old_due_at,
        new_due_at=progress.due_at,
        response_time_ms=response_time_ms,
    )
    db.add(log)
    session.completed_cards += 1
    db.commit()

    done_ids = _session_done_card_ids(db, session.id)
    remaining_queue = get_study_queue(db, user, session.deck_id, exclude_card_ids=done_ids)
    remaining = len(remaining_queue)

    return {
        "progress": {
            "status": progress.status.value,
            "interval_days": progress.interval_days,
            "due_at": progress.due_at.isoformat() if progress.due_at else None,
        },
        "session": {
            "completed_cards": session.completed_cards,
            "remaining_cards": remaining,
        },
    }


def undo_last_answer(db: Session, session: StudySession, user: User) -> bool:
    log = (
        db.query(ReviewLog)
        .filter(
            ReviewLog.session_id == session.id,
            ReviewLog.user_id == user.id,
            ReviewLog.is_undone == False,
        )
        .order_by(ReviewLog.reviewed_at.desc())
        .first()
    )
    if not log:
        return False

    progress = _get_or_create_progress(db, user.id, log.card_id)
    progress.interval_days = log.old_interval
    progress.due_at = log.old_due_at
    if log.old_interval == 0 and log.old_due_at is None:
        progress.status = CardStatus.NEW
        progress.repetitions = max(0, progress.repetitions - 1)
    else:
        progress.status = CardStatus.LEARNING if log.rating == Rating.AGAIN else CardStatus.REVIEW
        if log.old_interval >= 30:
            progress.status = CardStatus.MASTERED

    log.is_undone = True
    session.completed_cards = max(0, session.completed_cards - 1)
    db.commit()
    return True


def finish_session(db: Session, session: StudySession) -> dict:
    if session.status != SessionStatus.completed:
        session.status = SessionStatus.completed
        session.ended_at = utc_now()
    elif not session.ended_at:
        session.ended_at = utc_now()
    started = ensure_utc(session.started_at) or utc_now()
    ended = ensure_utc(session.ended_at) or utc_now()
    session.duration_seconds = max(0, int((ended - started).total_seconds()))

    logs = (
        db.query(ReviewLog)
        .filter(ReviewLog.session_id == session.id, ReviewLog.is_undone == False)
        .all()
    )
    ratings = {"AGAIN": 0, "HARD": 0, "GOOD": 0, "EASY": 0}
    for log in logs:
        ratings[log.rating.value] += 1

    total = sum(ratings.values())
    remember_rate = (ratings["GOOD"] + ratings["EASY"]) / total * 100 if total else 0

    db.commit()
    return {
        "id": session.id,
        "total_cards": session.total_cards,
        "completed_cards": session.completed_cards,
        "duration_seconds": session.duration_seconds,
        "ratings": ratings,
        "remember_rate": round(remember_rate, 1),
    }


def suspend_card(db: Session, user_id: int, card_id: int) -> None:
    progress = _get_or_create_progress(db, user_id, card_id)
    progress.status = CardStatus.SUSPENDED
    db.commit()
