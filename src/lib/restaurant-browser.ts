import type { RestaurantRecord } from "@/types/restaurant";

export const cuisineOrder = ["Sushi", "Ramen", "Izakaya", "Cafe", "Dessert", "Japanese", "Specialty", "Other"];
export const prefectureOrder = ["Tokyo", "Osaka", "Kyoto", "Kanagawa", "Nara"];

export const cuisineMeta: Record<string, { emoji: string; japanese: string }> = {
  Sushi: { emoji: "🍣", japanese: "寿司" },
  Ramen: { emoji: "🍜", japanese: "ラーメン" },
  Izakaya: { emoji: "🍶", japanese: "居酒屋" },
  Cafe: { emoji: "☕", japanese: "喫茶" },
  Dessert: { emoji: "🍡", japanese: "甘味" },
  Japanese: { emoji: "🍱", japanese: "和食" },
  Specialty: { emoji: "🔥", japanese: "名物" },
  Other: { emoji: "✨", japanese: "その他" },
};

export function getSortedPrefectures(restaurants: RestaurantRecord[]) {
  return [...new Set(restaurants.map((item) => item.prefecture))].sort((left, right) => {
    const leftIndex = prefectureOrder.indexOf(left);
    const rightIndex = prefectureOrder.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }

    return left.localeCompare(right);
  });
}

export function sortRestaurants(left: RestaurantRecord, right: RestaurantRecord) {
  const leftRating = left.rating ?? -1;
  const rightRating = right.rating ?? -1;
  if (rightRating !== leftRating) {
    return rightRating - leftRating;
  }

  const leftReviews = left.reviewCount ?? -1;
  const rightReviews = right.reviewCount ?? -1;
  if (rightReviews !== leftReviews) {
    return rightReviews - leftReviews;
  }

  return left.name.localeCompare(right.name);
}
