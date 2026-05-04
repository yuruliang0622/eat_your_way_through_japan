"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cuisineMeta, cuisineOrder, getSortedPrefectures } from "@/lib/restaurant-browser";
import type { RestaurantRecord } from "@/types/restaurant";

type HomeBrowserProps = {
  initialPrefecture?: string;
  restaurants: RestaurantRecord[];
};

export function HomeBrowser({ initialPrefecture, restaurants }: HomeBrowserProps) {
  const prefectures = useMemo(() => getSortedPrefectures(restaurants), [restaurants]);
  const safeInitialPrefecture =
    initialPrefecture && prefectures.includes(initialPrefecture) ? initialPrefecture : prefectures[0] ?? "";
  const [activePrefecture, setActivePrefecture] = useState(safeInitialPrefecture);

  const prefectureRestaurants = useMemo(
    () => restaurants.filter((item) => item.prefecture === activePrefecture),
    [activePrefecture, restaurants],
  );

  const cravings = cuisineOrder
    .map((group) => ({
      group,
      count: prefectureRestaurants.filter((item) => item.groupedCuisineType === group).length,
      ...cuisineMeta[group],
    }))
    .filter((item) => item.count > 0);

  return (
    <section className="directory-panel">
      <div className="controls-row home-controls">
        <div className="bento-panel bento-tabs">
          <p className="panel-kicker">Choose a prefecture</p>
          <div className="tab-strip" aria-label="Prefecture tabs">
            {prefectures.map((prefecture) => (
              <button
                key={prefecture}
                className={prefecture === activePrefecture ? "tab-button active" : "tab-button"}
                onClick={() => setActivePrefecture(prefecture)}
                type="button"
              >
                {prefecture}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="craving-block bento-panel">
        <div className="craving-heading">
          <h2>Browse by craving</h2>
          <p>Select a food mood in {activePrefecture}, then jump into the full restaurant page.</p>
        </div>

        <div className="craving-grid">
          {cravings.map((item) => (
            <Link
              key={item.group}
              className="craving-card craving-link"
              href={`/restaurants?prefecture=${encodeURIComponent(activePrefecture)}&cuisine=${encodeURIComponent(item.group)}`}
            >
              <span className="craving-emoji">{item.emoji}</span>
              <span className="craving-ja">{item.japanese}</span>
              <strong>{item.group}</strong>
              <span className="craving-count">{item.count} spots</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
