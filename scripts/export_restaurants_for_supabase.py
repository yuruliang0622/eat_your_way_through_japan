#!/usr/bin/env python3

import csv
import json
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parents[1]
SOURCE_JSON = WEB_DIR / "src" / "data" / "restaurants.generated.json"
OUTPUT_CSV = WEB_DIR / "supabase" / "restaurants_import.csv"

FIELDNAMES = [
    "id",
    "slug",
    "name",
    "prefecture",
    "official_city",
    "address",
    "google_maps_url",
    "place_id",
    "raw_place_type",
    "grouped_cuisine_type",
    "rating",
    "review_count",
    "price_level",
    "has_google_photo",
    "review_needed",
]


def main():
    with SOURCE_JSON.open("r", encoding="utf-8") as infile:
        payload = json.load(infile)

    restaurants = payload.get("restaurants", [])
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_CSV.open("w", encoding="utf-8", newline="") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=FIELDNAMES)
        writer.writeheader()

        for item in restaurants:
            writer.writerow(
                {
                    "id": item.get("id", ""),
                    "slug": item.get("slug", ""),
                    "name": item.get("name", ""),
                    "prefecture": item.get("prefecture", ""),
                    "official_city": item.get("officialCity", ""),
                    "address": item.get("address", ""),
                    "google_maps_url": item.get("googleMapsUrl", ""),
                    "place_id": item.get("placeId", ""),
                    "raw_place_type": item.get("rawPlaceType", ""),
                    "grouped_cuisine_type": item.get("groupedCuisineType", ""),
                    "rating": item.get("rating", ""),
                    "review_count": item.get("reviewCount", ""),
                    "price_level": item.get("priceLevel", ""),
                    "has_google_photo": item.get("hasGooglePhoto", False),
                    "review_needed": item.get("reviewNeeded", False),
                }
            )

    print(f"Wrote {len(restaurants)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
