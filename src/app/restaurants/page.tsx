import { RestaurantResults } from "@/components/restaurant-results";
import { getRestaurantDataset } from "@/lib/restaurants";

type RestaurantsPageProps = {
  searchParams: Promise<{
    cuisine?: string;
    prefecture?: string;
  }>;
};

export default async function RestaurantsPage({ searchParams }: RestaurantsPageProps) {
  const params = await searchParams;
  const restaurantDataset = await getRestaurantDataset();

  return (
    <main className="page-shell">
      <RestaurantResults
        initialCuisine={params.cuisine}
        initialPrefecture={params.prefecture}
        restaurants={restaurantDataset.restaurants}
      />
    </main>
  );
}
