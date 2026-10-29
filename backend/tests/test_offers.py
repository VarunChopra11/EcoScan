import pytest
from app.storage.memory_store import InMemoryStore


@pytest.fixture
def store():
    # Fresh in-memory store for isolated tests
    s = InMemoryStore()
    return s


def test_initial_offers_and_unlock_state(store):
    offers = store.get_offers()
    assert len(offers) > 0

    # With default 0 welcome points:
    # All offers (Patagonia 50 pt, Guppyfriend 100 pt, etc.) should be locked
    patagonia = next(o for o in offers if o.id == "patagonia-worn-wear-10")
    assert patagonia.is_unlocked is False
    assert patagonia.progress_percent == 0.0

    guppy = next(o for o in offers if o.id == "guppyfriend-wash-bag")
    assert guppy.is_unlocked is False
    assert guppy.progress_percent == 0.0


def test_redeem_offer_success(store):
    # Simulate user earning points via garment scanning
    store._current_points = 50
    store._lifetime_points_earned = 50

    redemption = store.redeem_offer("patagonia-worn-wear-10")
    assert redemption.offer_id == "patagonia-worn-wear-10"
    assert redemption.points_spent == 50
    assert redemption.remaining_points == 0
    assert redemption.code.startswith("PAT-WORN-")

    stats = store.get_stats()
    assert stats.current_points == 0
    assert stats.total_points_spent == 50

    # Check offer is marked as redeemed
    updated_offers = store.get_offers()
    patagonia = next(o for o in updated_offers if o.id == "patagonia-worn-wear-10")
    assert patagonia.is_redeemed is True
    assert patagonia.redemption_code == redemption.code


def test_redeem_insufficient_points(store):
    # Guppyfriend requires 100 pts, user starts with 0 pts
    with pytest.raises(ValueError) as exc:
        store.redeem_offer("guppyfriend-wash-bag")
    assert "Insufficient EcoPoints" in str(exc.value)


def test_redeem_nonexistent_offer(store):
    with pytest.raises(ValueError) as exc:
        store.redeem_offer("non-existent-id")
    assert "not found" in str(exc.value)


def test_duplicate_redemption_prevented(store):
    # Provide enough points for one redemption
    store._current_points = 100
    store.redeem_offer("patagonia-worn-wear-10")
    with pytest.raises(ValueError) as exc:
        store.redeem_offer("patagonia-worn-wear-10")
    assert "already been redeemed" in str(exc.value)

