"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { RestaurantCardImage } from "@/components/restaurant-card-image";
import { cuisineMeta, cuisineOrder, getSortedPrefectures, sortRestaurants } from "@/lib/restaurant-browser";
import type { RestaurantRecord } from "@/types/restaurant";

type RestaurantResultsProps = {
  restaurants: RestaurantRecord[];
  initialCuisine?: string;
  initialPrefecture?: string;
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

export function RestaurantResults({ restaurants, initialCuisine, initialPrefecture }: RestaurantResultsProps) {
  const prefectures = useMemo(() => getSortedPrefectures(restaurants), [restaurants]);
  const safeInitialPrefecture = initialPrefecture && prefectures.includes(initialPrefecture) ? initialPrefecture : prefectures[0] ?? "";
  const safeInitialCuisine = initialCuisine && cuisineOrder.includes(initialCuisine) ? initialCuisine : "All cravings";

  const activePrefecture = safeInitialPrefecture;
  const selectedCuisine = safeInitialCuisine;
  const [selectedPrice, setSelectedPrice] = useState("All prices");
  const [selectedRating, setSelectedRating] = useState("All ratings");
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
  const deferredPrice = useDeferredValue(selectedPrice);
  const deferredRating = useDeferredValue(selectedRating);

  const prefectureRestaurants = restaurants.filter((item) => item.prefecture === activePrefecture).sort(sortRestaurants);
  const filteredRestaurants =
    selectedCuisine === "All cravings"
      ? prefectureRestaurants
      : prefectureRestaurants.filter((item) => item.groupedCuisineType === selectedCuisine);
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
  const cuisineBadge = selectedCuisine === "All cravings" ? null : cuisineMeta[selectedCuisine];

  return (
    <section className="directory-panel">
      <div className="results-head">
        <Link className="back-link" href={`/?prefecture=${encodeURIComponent(activePrefecture)}`}>
          ← Back to main page
        </Link>
        <div className="results-intro">
          <p className="panel-kicker">Restaurant picks</p>
          {cuisineBadge ? (
            <span className="results-cuisine-pill">
              <span aria-hidden="true">{cuisineBadge.emoji}</span>
              {cuisineBadge.japanese}
            </span>
          ) : null}
        </div>
      </div>

      <div className="filter-row results-filter-row">
        <label className="city-filter results-filter-card">
          <span>Price</span>
          <select value={selectedPrice} onChange={(event) => setSelectedPrice(event.target.value)}>
            <option>All prices</option>
            <option>$</option>
            <option>$$</option>
            <option>$$$</option>
            <option>$$$$</option>
          </select>
        </label>

        <label className="city-filter results-filter-card">
          <span>Rating</span>
          <select value={selectedRating} onChange={(event) => setSelectedRating(event.target.value)}>
            <option>All ratings</option>
            <option>4.5+</option>
            <option>4.0+</option>
            <option>3.5+</option>
          </select>
        </label>
      </div>

      <div className="summary-row results-summary-row bento-summary">
        <p>
          Showing <strong>{ratingFilteredRestaurants.length}</strong> restaurants in <strong>{activePrefecture}</strong>
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
          {selectedCuisine !== "All cravings" ? (
            <>
              {" "}
              under <strong>{selectedCuisine}</strong>
            </>
          ) : null}
          .
        </p>
      </div>

      {ratingFilteredRestaurants.length === 0 ? (
        <div className="empty-state">
          <h2>No restaurants match this filter set.</h2>
          <p>Try a different price or rating filter to widen the list again.</p>
        </div>
      ) : (
        <div className="card-grid results-card-grid">
          {ratingFilteredRestaurants.map((restaurant) => (
            <article key={restaurant.id} className="restaurant-card">
              <button
                aria-expanded={expandedRestaurantId === restaurant.id}
                className="card-toggle"
                onClick={() => setExpandedRestaurantId((current) => (current === restaurant.id ? null : restaurant.id))}
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
                    <span className="expand-pill">{expandedRestaurantId === restaurant.id ? "Hide" : "Open"}</span>
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
      )}
    </section>
  );
}
