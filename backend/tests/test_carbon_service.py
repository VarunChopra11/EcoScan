from app.services.carbon_service import carbon_service
from app.core.constants import GARMENT_BASELINES


def test_baseline_scores():
    """Verify standard required baselines and extensions."""
    # Assignment specifications
    assert GARMENT_BASELINES["t-shirt"] == 5.0
    assert GARMENT_BASELINES["jeans"] == 10.0
    assert GARMENT_BASELINES["jacket"] == 15.0
    assert GARMENT_BASELINES["shoes"] == 8.0

    # Extended items
    assert GARMENT_BASELINES["hoodie"] == 8.5
    assert GARMENT_BASELINES["dress"] == 11.0
    assert GARMENT_BASELINES["sweater"] == 9.0
    assert GARMENT_BASELINES["coat"] == 18.0


def test_normalize_category():
    """Verify alias normalization to canonical categories."""
    assert carbon_service.normalize_category("Vintage Denim Jeans") == "jeans"
    assert carbon_service.normalize_category("Graphic Tee") == "t-shirt"
    assert carbon_service.normalize_category("Running Sneakers") == "shoes"
    assert carbon_service.normalize_category("Winter Trench Parka") == "coat"
    assert carbon_service.normalize_category("Yoga Leggings") == "activewear"
    assert carbon_service.normalize_category("Mysterious Artifact") == "other"


def test_material_multipliers():
    """Verify impact adjustments based on fabric type."""
    # Synthetic has a penalty (1.25x)
    mat_syn, mult_syn = carbon_service.normalize_material("100% Polyester")
    assert mult_syn == 1.25

    # Conventional cotton is neutral (1.0x)
    mat_cot, mult_cot = carbon_service.normalize_material("Conventional Cotton")
    assert mult_cot == 1.0

    # Organic cotton has savings (0.70x)
    mat_org, mult_org = carbon_service.normalize_material("GOTS Organic Cotton")
    assert mult_org == 0.70

    # Recycled has strong savings (0.50x)
    mat_rec, mult_rec = carbon_service.normalize_material("Recycled Polyester")
    assert mult_rec == 0.50

    # Thrifted/vintage has major circular savings (0.30x)
    mat_thrift, mult_thrift = carbon_service.normalize_material("Thrifted Vintage")
    assert mult_thrift == 0.30


def test_calculate_item_footprint():
    """Verify accurate calculation of footprint, benchmark, and savings."""
    # T-Shirt in organic cotton: baseline = 5.0, mult = 0.7 -> 3.5 kg CO2
    # Benchmark: 5.0 * 1.25 = 6.25 kg CO2
    # Savings: 6.25 - 3.5 = 2.75 kg CO2
    res = carbon_service.calculate_item_footprint("t-shirt", "organic cotton")
    assert res["actual_co2_kg"] == 3.5
    assert res["benchmark_co2_kg"] == 6.25
    assert res["co2_saved_kg"] == 2.75
    assert res["eco_rating"] == "A+"
    assert "Line dry" in res["care_tip"]


def test_eco_ratings():
    """Verify letter grade classification boundaries."""
    assert carbon_service.get_eco_rating(2.5) == "A+"
    assert carbon_service.get_eco_rating(5.0) == "A"
    assert carbon_service.get_eco_rating(8.0) == "B"
    assert carbon_service.get_eco_rating(12.5) == "C"
    assert carbon_service.get_eco_rating(18.0) == "D"
    assert carbon_service.get_eco_rating(26.0) == "E"


def test_calculate_equivalents():
    """Verify real-world environmental equivalence calculation."""
    eq = carbon_service.calculate_equivalents(10.0)
    assert eq.car_miles > 0
    assert eq.phone_charges > 0
    assert eq.trees_planted > 0
