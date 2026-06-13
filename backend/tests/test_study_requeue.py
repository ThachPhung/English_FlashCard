import json

from app.models.card import Card
from app.models.deck import Deck, DeckVisibility
from app.models.progress import CardStatus, UserCardProgress
from app.models.user import User
from app.services.study_service import (
    AGAIN_REQUEUE_COUNT,
    HARD_REQUEUE_COUNT,
    _load_requeue_pending,
    answer_card,
    create_session,
    get_new_cards_queue,
    get_session_next,
    undo_last_answer,
)


def _create_deck_with_cards(db_session, user, count: int) -> Deck:
    deck = Deck(
        owner_id=user.id,
        name="Test Deck",
        visibility=DeckVisibility.private,
        new_cards_per_day=count,
        review_limit_per_day=count,
    )
    db_session.add(deck)
    db_session.flush()
    for i in range(count):
        db_session.add(Card(deck_id=deck.id, front=f"front-{i}", back=f"back-{i}"))
    db_session.commit()
    return deck


def test_again_schedules_requeue(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 2)
    session = create_session(db_session, user, deck.id)
    assert session.total_cards == 2

    first = get_session_next(db_session, session, user)
    assert first is not None
    card, _ = first

    result = answer_card(db_session, session, user, card.id, "AGAIN")
    assert result["session"]["remaining_cards"] == 1 + AGAIN_REQUEUE_COUNT
    assert session.total_cards == 2 + AGAIN_REQUEUE_COUNT
    assert _load_requeue_pending(session)[card.id] == AGAIN_REQUEUE_COUNT


def test_hard_schedules_requeue(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 1)
    session = create_session(db_session, user, deck.id)
    card, _ = get_session_next(db_session, session, user)

    answer_card(db_session, session, user, card.id, "HARD")
    assert _load_requeue_pending(session)[card.id] == HARD_REQUEUE_COUNT
    assert session.total_cards == 1 + HARD_REQUEUE_COUNT


def test_good_clears_requeue(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 1)
    session = create_session(db_session, user, deck.id)
    card, _ = get_session_next(db_session, session, user)

    answer_card(db_session, session, user, card.id, "AGAIN")
    answer_card(db_session, session, user, card.id, "GOOD")
    assert _load_requeue_pending(session) == {}
    assert get_session_next(db_session, session, user) is None


def test_requeued_card_can_be_answered_again(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 1)
    session = create_session(db_session, user, deck.id)
    card, _ = get_session_next(db_session, session, user)

    answer_card(db_session, session, user, card.id, "AGAIN")

    session.requeue_pending = json.dumps({card.id: 1})
    db_session.commit()

    next_item = get_session_next(db_session, session, user)
    assert next_item is not None
    assert next_item[0].id == card.id
    assert _load_requeue_pending(session)[card.id] == 0

    answer_card(db_session, session, user, card.id, "GOOD")
    assert card.id not in _load_requeue_pending(session)


def test_session_continues_after_requeue_exhausted_without_good(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 1)
    session = create_session(db_session, user, deck.id)
    card, _ = get_session_next(db_session, session, user)

    answer_card(db_session, session, user, card.id, "AGAIN")
    session.requeue_pending = json.dumps({card.id: 0})
    db_session.commit()

    next_item = get_session_next(db_session, session, user)
    assert next_item is not None
    assert next_item[0].id == card.id


def test_session_shows_all_snapshotted_cards_even_after_daily_limit_hit(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 4)
    deck.new_cards_per_day = 4
    db_session.commit()

    session = create_session(db_session, user, deck.id)
    assert session.total_cards == 4

    for _ in range(4):
        next_item = get_session_next(db_session, session, user)
        assert next_item is not None
        answer_card(db_session, session, user, next_item[0].id, "AGAIN")

    next_item = get_session_next(db_session, session, user)
    assert next_item is not None


def test_undo_restores_requeue_state(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 1)
    session = create_session(db_session, user, deck.id)
    card, _ = get_session_next(db_session, session, user)

    answer_card(db_session, session, user, card.id, "AGAIN")
    assert session.total_cards == 1 + AGAIN_REQUEUE_COUNT

    undo_last_answer(db_session, session, user)
    db_session.refresh(session)
    assert _load_requeue_pending(session) == {}
    assert session.total_cards == 1


def test_new_only_session_excludes_review_cards(db_session):
    user = db_session.query(User).first()
    deck = _create_deck_with_cards(db_session, user, 3)
    cards = db_session.query(Card).filter(Card.deck_id == deck.id).order_by(Card.id).all()

    reviewed = UserCardProgress(
        user_id=user.id,
        card_id=cards[0].id,
        status=CardStatus.REVIEW,
        interval_days=1,
    )
    db_session.add(reviewed)
    db_session.commit()

    new_queue = get_new_cards_queue(db_session, user, deck.id)
    assert len(new_queue) == 2
    assert all(p.status == CardStatus.NEW for _, p in new_queue)

    session = create_session(db_session, user, deck.id, mode="new_only")
    assert session.total_cards == 2
    assert session.study_mode == "new_only"
