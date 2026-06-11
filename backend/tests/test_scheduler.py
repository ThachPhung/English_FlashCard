from datetime import datetime, timedelta, timezone

from app.models.progress import CardStatus, Rating, UserCardProgress
from app.services.scheduler_service import apply_rating, MASTERED_THRESHOLD_DAYS


def test_new_card_good():
    progress = UserCardProgress(user_id=1, card_id=1, status=CardStatus.NEW)
    now = datetime.now(timezone.utc)
    apply_rating(progress, Rating.GOOD, now)
    assert progress.status == CardStatus.REVIEW
    assert progress.interval_days == 1
    assert progress.due_at == now + timedelta(days=1)


def test_new_card_easy():
    progress = UserCardProgress(user_id=1, card_id=1, status=CardStatus.NEW)
    now = datetime.now(timezone.utc)
    apply_rating(progress, Rating.EASY, now)
    assert progress.status == CardStatus.REVIEW
    assert progress.interval_days == 4


def test_review_card_good():
    progress = UserCardProgress(
        user_id=1, card_id=1, status=CardStatus.REVIEW, interval_days=10
    )
    now = datetime.now(timezone.utc)
    progress.due_at = now
    apply_rating(progress, Rating.GOOD, now)
    assert progress.interval_days == 25


def test_review_card_hard():
    progress = UserCardProgress(
        user_id=1, card_id=1, status=CardStatus.REVIEW, interval_days=10
    )
    now = datetime.now(timezone.utc)
    apply_rating(progress, Rating.HARD, now)
    assert progress.interval_days == 12


def test_mastered_threshold():
    progress = UserCardProgress(
        user_id=1, card_id=1, status=CardStatus.REVIEW, interval_days=30
    )
    now = datetime.now(timezone.utc)
    apply_rating(progress, Rating.GOOD, now)
    assert progress.status == CardStatus.MASTERED
    assert progress.interval_days >= MASTERED_THRESHOLD_DAYS
