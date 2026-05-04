"use client";

import { useState } from "react";

type RestaurantCardImageProps = {
  placeId: string;
  name: string;
  fallbackLabel: string;
};

export function RestaurantCardImage({ placeId, name, fallbackLabel }: RestaurantCardImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!placeId || hasError) {
    return (
      <div className="card-image-wrap card-image-fallback">
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <div className="card-image-wrap">
      <img
        alt={name}
        className="card-image"
        loading="lazy"
        onError={() => setHasError(true)}
        src={`/api/place-photo?placeId=${encodeURIComponent(placeId)}`}
      />
    </div>
  );
}
