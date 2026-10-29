from typing import Dict, Any, List

# Baseline Carbon Footprints in kg CO2e per garment category
# Sources: Life Cycle Assessment (LCA) apparel studies (WRAP, Ellen MacArthur Foundation, Mistra Future Fashion)
GARMENT_BASELINES: Dict[str, float] = {
    "t-shirt": 5.0,
    "jeans": 10.0,
    "jacket": 15.0,
    "shoes": 8.0,
    "hoodie": 8.5,
    "dress": 11.0,
    "sweater": 9.0,
    "shorts": 4.0,
    "skirt": 5.5,
    "coat": 18.0,
    "trousers": 7.5,
    "shirt": 6.5,
    "blazer": 13.0,
    "cardigan": 7.5,
    "activewear": 4.5,
    "cap": 1.5,
    "scarf": 2.0,
    "socks": 1.0,
    "other": 6.0,
}

# Strict whitelist of valid wearable apparel & footwear categories
VALID_GARMENT_CATEGORIES: set = {
    "t-shirt",
    "jeans",
    "jacket",
    "shoes",
    "hoodie",
    "dress",
    "sweater",
    "shorts",
    "skirt",
    "coat",
    "trousers",
    "shirt",
    "blazer",
    "cardigan",
    "activewear",
    "cap",
    "scarf",
    "socks",
}

# Non-apparel keywords to immediately reject or filter out false detections
NON_APPAREL_KEYWORDS: set = {
    "car",
    "vehicle",
    "automobile",
    "truck",
    "motorcycle",
    "bike",
    "bicycle",
    "dog",
    "cat",
    "pet",
    "animal",
    "bird",
    "fish",
    "food",
    "meal",
    "beverage",
    "drink",
    "coffee",
    "fruit",
    "vegetable",
    "phone",
    "smartphone",
    "laptop",
    "computer",
    "tablet",
    "screen",
    "electronics",
    "furniture",
    "table",
    "chair",
    "desk",
    "couch",
    "sofa",
    "bed",
    "wall",
    "room",
    "house",
    "building",
    "landscape",
    "mountain",
    "tree",
    "plant",
    "flower",
    "sky",
    "document",
    "paper",
    "receipt",
    "text",
    "meme",
    "diagram",
    "watch",
    "jewelry",
    "necklace",
    "ring",
    "bracelet",
    "earring",
    "bag",
    "handbag",
    "backpack",
    "wallet",
    "bottle",
    "mug",
    "cup",
    "plate",
}

# Material lifecycle impact adjustment multipliers
MATERIAL_MULTIPLIERS: Dict[str, float] = {
    "synthetic": 1.25,        # Virgin polyester, nylon, acrylic (petroleum-based)
    "polyester": 1.25,
    "nylon": 1.30,
    "acrylic": 1.35,
    "conventional cotton": 1.00,
    "cotton": 1.00,
    "denim": 1.00,
    "linen": 0.70,            # Low water & pesticide requirements
    "hemp": 0.65,
    "organic cotton": 0.70,   # Avoids synthetic fertilizers & toxic pesticides
    "organic": 0.70,
    "recycled": 0.50,         # Diverts waste, substantially avoids raw processing
    "recycled polyester": 0.50,
    "recycled cotton": 0.45,
    "wool": 1.40,             # High methane emissions from livestock & scouring
    "leather": 1.50,          # High livestock footprint and intensive tanning
    "cashmere": 1.60,
    "thrifted": 0.30,         # Second-hand / circular garment avoids virgin production
    "second-hand": 0.30,
    "vintage": 0.30,
    "upcycled": 0.30,
    "default": 1.00,
}

# Conventional fast-fashion benchmark factor relative to baseline
# Standard mass-produced apparel with virgin petroleum or non-organic farming
BENCHMARK_MULTIPLIER = 1.25

# Eco-Reward Point Engine parameters
BASE_SCAN_POINTS = 10               # Guaranteed conscious logging reward
POINTS_PER_KG_SAVED = 20            # 20 points per 1 kg CO2 avoided
LOW_IMPACT_THRESHOLD_KG = 6.0       # Scans with average CO2 <= 6.0 kg get bonus
LOW_IMPACT_BONUS_POINTS = 15        # Low carbon efficiency bonus

# Equivalency metrics for intuitive user understanding
# 1 kg CO2 ~= 2.5 miles driven by an average gasoline passenger car
# 1 kg CO2 ~= 120 smartphone charges
# 1 kg CO2 ~= 0.05 tree seedlings grown for 10 years
CAR_MILES_PER_KG_CO2 = 2.48
PHONE_CHARGES_PER_KG_CO2 = 121.6
TREES_PLANTED_PER_KG_CO2 = 0.045

# Initial catalog of redeemable partner offers
INITIAL_OFFERS: List[Dict[str, Any]] = [
    {
        "id": "patagonia-worn-wear-10",
        "brand": "Patagonia Worn Wear",
        "title": "10% Off Recycled & Repaired Gear",
        "description": "Save 10% on your next repair, trade-in, or certified pre-owned purchase at Patagonia Worn Wear.",
        "points_cost": 50,
        "category": "Circular Fashion",
        "badge": "Popular",
        "code_prefix": "PAT-WORN-",
        "partner_url": "https://wornwear.patagonia.com",
    },
    {
        "id": "guppyfriend-wash-bag",
        "brand": "Guppyfriend",
        "title": "Free Microfiber Washing Bag",
        "description": "Protect your synthetic clothes from shedding microplastics into waterways with every laundry wash.",
        "points_cost": 100,
        "category": "Care & Longevity",
        "badge": "Essential",
        "code_prefix": "GUPPY-CLEAN-",
        "partner_url": "https://guppyfriend.com",
    },
    {
        "id": "veja-footwear-15",
        "brand": "VEJA",
        "title": "£15 Off Wild Amazonian Rubber Sneakers",
        "description": "Voucher redeemable on Veja sneakers made with fair-trade organic cotton and wild rubber soles.",
        "points_cost": 150,
        "category": "Sustainable Footwear",
        "badge": "Eco Choice",
        "code_prefix": "VEJA-BIO-",
        "partner_url": "https://veja-store.com",
    },
    {
        "id": "reformation-20",
        "brand": "Reformation",
        "title": "20% Off Climate Positive Collection",
        "description": "Enjoy 20% off Reformation's sustainably sourced dresses, tops, and circular denim collection.",
        "points_cost": 200,
        "category": "Eco Apparel",
        "badge": "Top Brand",
        "code_prefix": "REF-GREEN-",
        "partner_url": "https://thereformation.com",
    },
    {
        "id": "plant-a-tree-scotland",
        "brand": "Trees for Life",
        "title": "Plant a Native Tree in the Caledonian Forest",
        "description": "Dedicate a native tree (Scots Pine or Birch) to help rewild the Scottish Highlands and capture carbon.",
        "points_cost": 250,
        "category": "Carbon Removal",
        "badge": "Impact",
        "code_prefix": "TREE-REWILD-",
        "partner_url": "https://treesforlife.org.uk",
    },
    {
        "id": "organic-basics-30",
        "brand": "Organic Basics",
        "title": "£30 Voucher on GOTS-Certified Essentials",
        "description": "Get £30 off GOTS-certified organic cotton, Tencel, and recycled silver-treated basics.",
        "points_cost": 350,
        "category": "Basics & Underwear",
        "badge": "Premium",
        "code_prefix": "OB-NATURAL-",
        "partner_url": "https://organicbasics.com",
    },
]
