from app.services.reward_service import reward_service
from app.models.schemas import GarmentItem


def create_test_item(name="Test Item", category="t-shirt", co2=5.0, saved=1.5, material="cotton"):
    return GarmentItem(
        name=name,
        category=category,
        material=material,
        confidence=0.95,
        estimated_co2_kg=co2,
        baseline_co2_kg=5.0,
        benchmark_co2_kg=6.25,
        co2_saved_kg=saved,
        eco_rating="A",
        care_recommendation="Wash cold.",
    )


def test_reward_points_empty_items():
    pts, breakdown = reward_service.calculate_points([])
    assert pts == 0
    assert breakdown.total == 0


def test_reward_points_with_savings_and_bonus():
    # Item with 5.0 kg CO2 (<= 6.0kg threshold -> gets +15 low impact bonus)
    # Savings = 2.0 kg CO2 -> floor(2.0 * 20) = 40 pts
    # Base scan = 10 pts
    # Total = 10 + 40 + 15 = 65 pts
    item = create_test_item(co2=5.0, saved=2.0)
    pts, breakdown = reward_service.calculate_points([item])

    assert breakdown.base_scan == 10
    assert breakdown.eco_savings == 40
    assert breakdown.low_impact_bonus == 15
    assert pts == 65
    assert breakdown.total == 65


def test_reward_points_high_impact_no_bonus():
    # Item with 15.0 kg CO2 (> 6.0kg threshold -> 0 bonus)
    # Savings = 0.0 kg CO2 -> 0 savings pts
    # Base = 10 pts
    # Total = 10 pts
    item = create_test_item(name="Heavy Coat", category="coat", co2=15.0, saved=0.0)
    pts, breakdown = reward_service.calculate_points([item])

    assert breakdown.base_scan == 10
    assert breakdown.eco_savings == 0
    assert breakdown.low_impact_bonus == 0
    assert pts == 10


def test_summary_tip_generation():
    thrift_item = create_test_item(material="thrifted vintage")
    tip = reward_service.generate_summary_tip([thrift_item], "A+")
    assert "circular" in tip.lower() or "second-hand" in tip.lower()

    synthetic_item = create_test_item(material="recycled polyester")
    tip_syn = reward_service.generate_summary_tip([synthetic_item], "A")
    assert len(tip_syn) > 0
