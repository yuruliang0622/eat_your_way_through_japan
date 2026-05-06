import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/google-maps";

const FIELD_MASK = "photos";

async function getPlacePhoto(placeId: string, apiKey: string) {
  const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    cache: "no-store",
  });

  if (!detailsResponse.ok) {
    return {
      error: "google_details_failed",
      status: detailsResponse.status,
    } as const;
  }

  const details = (await detailsResponse.json()) as {
    photos?: Array<{ name?: string }>;
  };
  const photoName = details.photos?.[0]?.name;
  if (!photoName) {
    return { error: "no_photo" } as const;
  }

  const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  mediaUrl.searchParams.set("key", apiKey);
  mediaUrl.searchParams.set("maxWidthPx", "900");
  mediaUrl.searchParams.set("skipHttpRedirect", "true");

  const mediaResponse = await fetch(mediaUrl, {
    cache: "no-store",
  });

  if (!mediaResponse.ok) {
    return {
      error: "google_media_failed",
      status: mediaResponse.status,
    } as const;
  }

  const media = (await mediaResponse.json()) as { photoUri?: string };
  return media.photoUri ? ({ photoUri: media.photoUri } as const) : ({ error: "no_photo_uri" } as const);
}

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  const apiKey = getGoogleMapsApiKey();

  if (!placeId) {
    return NextResponse.json({ error: "missing_place_id" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "missing_google_maps_api_key" }, { status: 500 });
  }

  const result = await getPlacePhoto(placeId, apiKey);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.redirect(result.photoUri);
}
