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
    return null;
  }

  const details = (await detailsResponse.json()) as {
    photos?: Array<{ name?: string }>;
  };
  const photoName = details.photos?.[0]?.name;
  if (!photoName) {
    return null;
  }

  const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  mediaUrl.searchParams.set("key", apiKey);
  mediaUrl.searchParams.set("maxWidthPx", "900");
  mediaUrl.searchParams.set("skipHttpRedirect", "true");

  const mediaResponse = await fetch(mediaUrl, {
    cache: "no-store",
  });

  if (!mediaResponse.ok) {
    return null;
  }

  const media = (await mediaResponse.json()) as { photoUri?: string };
  return media.photoUri ?? null;
}

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  const apiKey = getGoogleMapsApiKey();

  if (!placeId || !apiKey) {
    return new NextResponse(null, { status: 404 });
  }

  const photoUri = await getPlacePhoto(placeId, apiKey);
  if (!photoUri) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.redirect(photoUri);
}
