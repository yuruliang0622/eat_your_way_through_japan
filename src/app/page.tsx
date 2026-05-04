import { HomeBrowser } from "@/components/home-browser";
import { getRestaurantDataset } from "@/lib/restaurants";

type HomePageProps = {
  searchParams: Promise<{
    prefecture?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const restaurantDataset = await getRestaurantDataset();

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-brand">Eat Your Way Through Japan</p>
          <p className="hero-subtitle">
            A little collection of the Japanese food spots I loved most, saved here to share with friends.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-glow" />
          <img alt="" className="hero-art-image" src="/header-characters.png" />
        </div>
      </section>

      <HomeBrowser initialPrefecture={params.prefecture} restaurants={restaurantDataset.restaurants} />
    </main>
  );
}
