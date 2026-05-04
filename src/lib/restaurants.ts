import { cache } from "react";
import dataset from "@/data/restaurants.generated.json";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { RestaurantDataset, RestaurantRecord } from "@/types/restaurant";

const generatedDataset = dataset as RestaurantDataset;

type SupabaseRestaurantRow = {
  id: string;
  slug: string;
  name: string;
  prefecture: string;
  official_city: string | null;
  address: string | null;
  google_maps_url: string | null;
  place_id: string | null;
  raw_place_type: string | null;
  grouped_cuisine_type: string | null;
  rating: number | null;
  review_count: number | null;
  price_level: string | null;
  has_google_photo: boolean | null;
  review_needed: boolean | null;
};

function mapSupabaseRow(row: SupabaseRestaurantRow): RestaurantRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    prefecture: row.prefecture,
    officialCity: row.official_city ?? "Unknown",
    address: row.address ?? "",
    googleMapsUrl: row.google_maps_url ?? "",
    placeId: row.place_id ?? "",
    rawPlaceType: row.raw_place_type ?? "",
    groupedCuisineType: row.grouped_cuisine_type ?? "Other",
    rating: row.rating,
    reviewCount: row.review_count,
    priceLevel: row.price_level ?? "",
    hasGooglePhoto: row.has_google_photo ?? false,
    reviewNeeded: row.review_needed ?? false,
  };
}

export const getRestaurantDataset = cache(async (): Promise<RestaurantDataset> => {
  if (!hasSupabaseEnv()) {
    return generatedDataset;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        "id, slug, name, prefecture, official_city, address, google_maps_url, place_id, raw_place_type, grouped_cuisine_type, rating, review_count, price_level, has_google_photo, review_needed",
      )
      .order("prefecture")
      .order("official_city")
      .order("grouped_cuisine_type")
      .order("name");

    if (error || !data) {
      console.warn("Supabase restaurants fallback:", error?.message ?? "No data returned");
      return generatedDataset;
    }

    return {
      generatedAt: new Date().toISOString(),
      sourceFile: "supabase.restaurants",
      restaurantCount: data.length,
      restaurants: (data as SupabaseRestaurantRow[]).map(mapSupabaseRow),
    };
  } catch (error) {
    console.warn("Supabase restaurants fallback:", error);
    return generatedDataset;
  }
});
