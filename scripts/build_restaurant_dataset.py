#!/usr/bin/env python3

import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib import error, request

ROOT_DIR = Path(__file__).resolve().parents[2]
WEB_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "geo_master.csv"
OUTPUT_JSON = WEB_DIR / "src" / "data" / "restaurants.generated.json"
CACHE_JSON = WEB_DIR / ".cache" / "google-place-enrichment.json"
PLACES_URL_TEMPLATE = "https://places.googleapis.com/v1/places/{place_id}"
FIELD_MASK = ",".join(
    [
        "id",
        "displayName",
        "primaryType",
        "types",
        "rating",
        "userRatingCount",
        "priceLevel",
        "googleMapsUri",
        "formattedAddress",
        "photos",
    ]
)
def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "restaurant"


def classify_single_type(value):
    if not value:
        return ""

    if value in {"sushi_restaurant"}:
        return "Sushi"
    if value in {"ramen_restaurant"}:
        return "Ramen"
    if value in {"japanese_izakaya_restaurant", "bar", "oyster_bar_restaurant"}:
        return "Izakaya"
    if value in {"cafe", "coffee_shop", "tea_store"}:
        return "Cafe"
    if value in {"dessert_shop", "dessert_restaurant", "pastry_shop"}:
        return "Dessert"
    if value in {"yakiniku_restaurant", "korean_restaurant", "halal_restaurant", "asian_restaurant"}:
        return "Specialty"
    if value in {
        "japanese_restaurant",
        "family_restaurant",
        "meal_takeaway",
        "restaurant",
        "snack_bar",
        "deli",
        "fast_food_restaurant",
    }:
        return "Japanese"
    return ""


def map_cuisine_type(raw_type, types):
    primary_group = classify_single_type(raw_type)
    if primary_group:
        return primary_group

    for value in types or []:
        derived = classify_single_type(value)
        if derived:
            return derived

    return "Other"


def format_price_level(price_level):
    mapping = {
        "PRICE_LEVEL_FREE": "Free",
        "PRICE_LEVEL_INEXPENSIVE": "$",
        "PRICE_LEVEL_MODERATE": "$$",
        "PRICE_LEVEL_EXPENSIVE": "$$$",
        "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
    }
    return mapping.get(price_level or "", "")


def load_cache():
    if not CACHE_JSON.exists():
        return {}
    with CACHE_JSON.open("r", encoding="utf-8") as infile:
        return json.load(infile)


def save_cache(cache):
    CACHE_JSON.parent.mkdir(parents=True, exist_ok=True)
    with CACHE_JSON.open("w", encoding="utf-8") as outfile:
        json.dump(cache, outfile, ensure_ascii=False, indent=2)


def fetch_place(api_key, place_id):
    req = request.Request(
        PLACES_URL_TEMPLATE.format(place_id=place_id),
        method="GET",
        headers={
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    with request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def enrichment_is_complete(enrichment):
    if not enrichment or enrichment.get("fetchError"):
        return False

    required_fields = ["rating", "userRatingCount", "priceLevel", "photos", "primaryType", "types", "googleMapsUri"]
    return all(field in enrichment for field in required_fields)


def build_restaurant_record(row, enrichment):
    raw_type = enrichment.get("primaryType") or row.get("best_place_type") or ""
    types = enrichment.get("types") or []
    prefecture = row.get("prefecture") or "Unknown"
    city = row.get("official_city") or "Unknown"
    name = (enrichment.get("displayName") or {}).get("text") or row.get("location_name") or "Unnamed restaurant"
    place_id = row.get("location_place_id") or ""
    slug = slugify(f"{prefecture}-{city}-{name}-{row.get('cluster_id', '')}")

    return {
        "id": row.get("cluster_id") or slug,
        "slug": slug,
        "name": name,
        "prefecture": prefecture,
        "officialCity": city,
        "address": enrichment.get("formattedAddress") or row.get("location_address") or "",
        "googleMapsUrl": enrichment.get("googleMapsUri") or row.get("google_maps_url") or row.get("google_search_url") or "",
        "placeId": place_id,
        "rawPlaceType": raw_type,
        "groupedCuisineType": map_cuisine_type(raw_type, types),
        "rating": enrichment.get("rating"),
        "reviewCount": enrichment.get("userRatingCount"),
        "priceLevel": format_price_level(enrichment.get("priceLevel")),
        "hasGooglePhoto": bool(enrichment.get("photos")),
        "reviewNeeded": row.get("review_needed") == "yes",
    }


def main():
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    cache = load_cache()

    with SOURCE_CSV.open("r", encoding="utf-8", newline="") as infile:
        rows = list(csv.DictReader(infile))

    restaurant_rows = [row for row in rows if row.get("category") == "restaurant"]
    records = []

    for row in restaurant_rows:
        place_id = row.get("location_place_id") or ""
        cached_enrichment = cache.get(place_id, {}) if place_id else {}
        enrichment = cached_enrichment

        if place_id and api_key and not enrichment_is_complete(enrichment):
            try:
                enrichment = fetch_place(api_key, place_id)
                cache[place_id] = enrichment
                time.sleep(0.08)
            except error.HTTPError as exc:
                enrichment = cached_enrichment or {
                    "fetchError": f"HTTP {exc.code}",
                }
            except Exception as exc:  # pragma: no cover - network failures vary.
                enrichment = cached_enrichment or {
                    "fetchError": str(exc),
                }

        records.append(build_restaurant_record(row, enrichment))

    records.sort(key=lambda item: (item["prefecture"], item["officialCity"], item["groupedCuisineType"], item["name"]))
    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sourceFile": str(SOURCE_CSV.name),
        "restaurantCount": len(records),
        "restaurants": records,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as outfile:
        json.dump(payload, outfile, ensure_ascii=False, indent=2)

    save_cache(cache)
    print(f"Wrote {len(records)} restaurants to {OUTPUT_JSON}")


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
