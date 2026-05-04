"use client";

import { useDeferredValue, useState } from "react";
import { RestaurantCardImage } from "@/components/restaurant-card-image";
import type { RestaurantRecord } from "@/types/restaurant";

type RestaurantDirectoryProps = {
  restaurants: RestaurantRecord[];
};

const cuisineOrder = ["Sushi", "Ramen", "Izakaya", "Cafe", "Dessert", "Japanese", "Specialty", "Other"];
const prefectureOrder = ["Tokyo", "Osaka", "Kyoto", "Kanagawa", "Nara"];
const cuisineMeta: Record<string, { emoji: string; japanese: string }> = {
  Sushi: { emoji: "🍣", japanese: "寿司" },
  Ramen: { emoji: "🍜", japanese: "ラーメン" },
  Izakaya: { emoji: "🍶", japanese: "居酒屋" },
  Cafe: { emoji: "☕", japanese: "喫茶" },
  Dessert: { emoji: "🍡", japanese: "甘味" },
  Japanese: { emoji: "🍱", japanese: "和食" },
  Specialty: { emoji: "🔥", japanese: "名物" },
  Other: { emoji: "✨", japanese: "その他" },
};

function formatReviewCount(value: number | null) {
  if (!value) {
    return "";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function renderStars(rating: number | null) {
  if (!rating) {
    return "☆☆☆☆☆";
  }

  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
}

function sortRestaurants(left: RestaurantRecord, right: RestaurantRecord) {
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

export function RestaurantDirectory({ restaurants }: RestaurantDirectoryProps) {
  const prefectures = [...new Set(restaurants.map((item) => item.prefecture))].sort((left, right) => {
    const leftIndex = prefectureOrder.indexOf(left);
    const rightIndex = prefectureOrder.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }

    return left.localeCompare(right);
  });
  const [activePrefecture, setActivePrefecture] = useState(prefectures[0] ?? "");
  const [selectedCity, setSelectedCity] = useState("All cities");
  const [selectedCuisine, setSelectedCuisine] = useState("All cravings");
  const [selectedPrice, setSelectedPrice] = useState("All prices");
  const [selectedRating, setSelectedRating] = useState("All ratings");
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
  const deferredCity = useDeferredValue(selectedCity);
  const deferredCuisine = useDeferredValue(selectedCuisine);
  const deferredPrice = useDeferredValue(selectedPrice);
  const deferredRating = useDeferredValue(selectedRating);

  if (restaurants.length === 0) {
    return (
      <section className="directory-panel">
        <p className="muted">No restaurants were generated yet. Run `npm run data:build` after setting your Google API key.</p>
      </section>
    );
  }

  const prefectureRestaurants = restaurants
    .filter((item) => item.prefecture === activePrefecture)
    .sort(sortRestaurants);
  const cityOptions = [
    "All cities",
    ...[...new Set(prefectureRestaurants.map((item) => item.officialCity).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right),
    ),
  ];
  const filteredRestaurants =
    deferredCity === "All cities"
      ? prefectureRestaurants
      : prefectureRestaurants.filter((item) => item.officialCity === deferredCity);
  const priceFilteredRestaurants =
    deferredPrice === "All prices"
      ? filteredRestaurants
      : filteredRestaurants.filter((item) => item.priceLevel === deferredPrice);
  const ratingFilteredRestaurants =
    deferredRating === "All ratings"
      ? priceFilteredRestaurants
      : priceFilteredRestaurants.filter((item) => {
          if (item.rating === null) {
            return false;
          }

          const threshold = Number.parseFloat(deferredRating.replace("+", ""));
          return item.rating >= threshold;
        });
  const cuisineFilteredRestaurants =
    deferredCuisine === "All cravings"
      ? ratingFilteredRestaurants
      : ratingFilteredRestaurants.filter((item) => item.groupedCuisineType === deferredCuisine);

  const groupedEntries = cuisineOrder
    .map((group) => [group, cuisineFilteredRestaurants.filter((item) => item.groupedCuisineType === group)] as const)
    .filter(([, items]) => items.length > 0);
  const cravingCards = cuisineOrder
    .map((group) => ({
      group,
      count: filteredRestaurants.filter((item) => item.groupedCuisineType === group).length,
      ...cuisineMeta[group],
    }))
    .filter((item) => item.count > 0);

  return (
    <section className="directory-panel">
      <div className="controls-row">
        <div className="bento-panel bento-tabs">
          <p className="panel-kicker">Prefecture</p>
          <div className="tab-strip" aria-label="Prefecture tabs">
            {prefectures.map((prefecture) => (
              <button
                key={prefecture}
                className={prefecture === activePrefecture ? "tab-button active" : "tab-button"}
                onClick={() => {
                  setActivePrefecture(prefecture);
                  setSelectedCity("All cities");
                  setSelectedCuisine("All cravings");
                  setSelectedPrice("All prices");
                  setSelectedRating("All ratings");
                  setExpandedRestaurantId(null);
                }}
                type="button"
              >
                {prefecture}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-row">
        <label className="city-filter bento-panel filter-card">
          <span>Official city</span>
          <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)}>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="city-filter bento-panel filter-card">
          <span>Price</span>
          <select value={selectedPrice} onChange={(event) => setSelectedPrice(event.target.value)}>
            <option>All prices</option>
            <option>$</option>
            <option>$$</option>
            <option>$$$</option>
            <option>$$$$</option>
          </select>
        </label>

        <label className="city-filter bento-panel filter-card">
          <span>Rating</span>
          <select value={selectedRating} onChange={(event) => setSelectedRating(event.target.value)}>
            <option>All ratings</option>
            <option>4.5+</option>
            <option>4.0+</option>
            <option>3.5+</option>
          </select>
        </label>
      </div>

      <section className="craving-block bento-panel">
        <div className="craving-heading">
          <h2>Browse by craving</h2>
          <p>Every flavor of your trip, arranged by mood first.</p>
        </div>

        <div className="craving-grid">
          <button
            className={deferredCuisine === "All cravings" ? "craving-card active" : "craving-card"}
            onClick={() => setSelectedCuisine("All cravings")}
            type="button"
          >
            <span className="craving-emoji">💖</span>
            <span className="craving-ja">すべて</span>
            <strong>All cravings</strong>
          </button>

          {cravingCards.map((item) => (
            <button
              key={item.group}
              className={deferredCuisine === item.group ? "craving-card active" : "craving-card"}
              onClick={() => setSelectedCuisine(item.group)}
              type="button"
            >
              <span className="craving-emoji">{item.emoji}</span>
              <span className="craving-ja">{item.japanese}</span>
              <strong>{item.group}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="summary-row bento-panel bento-summary">
        <p>
          Showing <strong>{cuisineFilteredRestaurants.length}</strong> restaurants in <strong>{activePrefecture}</strong>
          {deferredCity !== "All cities" ? (
            <>
              {" "}
              for <strong>{deferredCity}</strong>
            </>
          ) : null}
          {deferredPrice !== "All prices" ? (
            <>
              {" "}
              at <strong>{deferredPrice}</strong>
            </>
          ) : null}
          {deferredRating !== "All ratings" ? (
            <>
              {" "}
              rated <strong>{deferredRating}</strong>
            </>
          ) : null}
          {deferredCuisine !== "All cravings" ? (
            <>
              {" "}
              under <strong>{deferredCuisine}</strong>
            </>
          ) : null}
          .
        </p>
      </div>

      {groupedEntries.length === 0 ? (
        <div className="empty-state">
          <h2>No restaurants match this city filter.</h2>
          <p>Try switching back to all cities in {activePrefecture} to browse the full set again.</p>
        </div>
      ) : (
        <div className="group-stack">
          {groupedEntries.map(([group, items]) => (
            <section key={group} className="group-block">
              <div className="group-heading">
                <h2>{group}</h2>
                <span>{items.length}</span>
              </div>

              <div className="card-grid">
                {items.map((restaurant) => (
                  <article key={restaurant.id} className="restaurant-card">
                    <button
                      aria-expanded={expandedRestaurantId === restaurant.id}
                      className="card-toggle"
                      onClick={() =>
                        setExpandedRestaurantId((current) => (current === restaurant.id ? null : restaurant.id))
                      }
                      type="button"
                    >
                      <RestaurantCardImage
                        fallbackLabel={restaurant.groupedCuisineType}
                        name={restaurant.name}
                        placeId={restaurant.placeId}
                      />

                      <div className="card-topline">
                        <p className="card-city">{restaurant.officialCity}</p>
                        <div className="card-topline-right">
                          {restaurant.priceLevel ? <span className="price-pill">{restaurant.priceLevel}</span> : null}
                          <span className="expand-pill">
                            {expandedRestaurantId === restaurant.id ? "Hide" : "Open"}
                          </span>
                        </div>
                      </div>

                      <div className="card-body">
                        <h3>{restaurant.name}</h3>
                        <p className="card-type">{restaurant.groupedCuisineType}</p>
                        {restaurant.rating ? (
                          <p className="card-preview-line">
                            <strong>{restaurant.rating.toFixed(1)}</strong>
                            <span className="star-line" aria-hidden="true">
                              {renderStars(restaurant.rating)}
                            </span>
                            <span>({formatReviewCount(restaurant.reviewCount)})</span>
                          </p>
                        ) : (
                          <p className="card-preview-line muted">Tap to view restaurant details</p>
                        )}
                      </div>
                    </button>

                    {expandedRestaurantId === restaurant.id ? (
                      <div className="card-details">
                        <div className="card-meta">
                          {restaurant.rating ? (
                            <div className="rating-stack">
                              <p className="rating-line">
                                <strong>{restaurant.rating.toFixed(1)}</strong>
                                <span className="star-line" aria-hidden="true">
                                  {renderStars(restaurant.rating)}
                                </span>
                                <span>({formatReviewCount(restaurant.reviewCount)})</span>
                                {restaurant.priceLevel ? <span>· {restaurant.priceLevel}</span> : null}
                              </p>
                              <p className="type-line">{restaurant.groupedCuisineType} spot</p>
                            </div>
                          ) : (
                            <div className="rating-stack">
                              <p className="muted">Google rating not available yet</p>
                              <p className="type-line">{restaurant.groupedCuisineType} spot</p>
                            </div>
                          )}

                          <p className="card-address">{restaurant.address}</p>
                          {restaurant.reviewNeeded ? <span className="review-flag">Needs manual review</span> : null}
                        </div>

                        <a className="maps-link" href={restaurant.googleMapsUrl} rel="noreferrer" target="_blank">
                          Open in Google Maps
                        </a>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
