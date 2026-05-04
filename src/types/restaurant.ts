export type RestaurantRecord = {
  id: string;
  slug: string;
  name: string;
  prefecture: string;
  officialCity: string;
  address: string;
  googleMapsUrl: string;
  placeId: string;
  rawPlaceType: string;
  groupedCuisineType: string;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: string;
  hasGooglePhoto: boolean;
  reviewNeeded: boolean;
};

export type RestaurantDataset = {
  generatedAt: string;
  sourceFile: string;
  restaurantCount: number;
  restaurants: RestaurantRecord[];
};
