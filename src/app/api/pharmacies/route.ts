import { NextRequest, NextResponse } from "next/server";

interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  opening_hours?: { open_now: boolean };
}

interface GooglePlaceDetailsResult {
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    formatted_address?: string;
    business_status?: string;
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: { open_now?: boolean };
  };
  status?: string;
  error_message?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "5000";

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Google Places API request failed" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ""}` },
        { status: 502 }
      );
    }

    const pharmacies = (data.results || []).map((p: GooglePlaceResult) => ({
      id: p.place_id,
      name: p.name,
      address: p.vicinity || "",
      area: "",
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      isOpen24h: false,
      openHours: p.opening_hours
        ? p.opening_hours.open_now
          ? "Open now"
          : "Closed now"
        : "",
      phone: "",
      rating: p.rating || 0,
      userRatingsTotal: p.user_ratings_total || 0,
      businessStatus: p.business_status || "",
    }));

    const withDetails = await Promise.all(
      pharmacies.map(async (pharmacy: (typeof pharmacies)[number]) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pharmacy.id}&fields=formatted_phone_number,international_phone_number,website,formatted_address,business_status,rating,user_ratings_total,opening_hours&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(10000) });
          if (!detailsRes.ok) return pharmacy;

          const details = (await detailsRes.json()) as GooglePlaceDetailsResult;
          if (details.status !== "OK" || !details.result) return pharmacy;

          return {
            ...pharmacy,
            address: details.result.formatted_address || pharmacy.address,
            phone: details.result.formatted_phone_number || details.result.international_phone_number || "",
            website: details.result.website || "",
            businessStatus: details.result.business_status || pharmacy.businessStatus,
            rating: details.result.rating || pharmacy.rating,
            userRatingsTotal: details.result.user_ratings_total || pharmacy.userRatingsTotal,
            isOpen24h: details.result.opening_hours?.open_now ?? pharmacy.isOpen24h,
            openHours: details.result.opening_hours?.open_now === true
              ? "Open now"
              : details.result.opening_hours?.open_now === false
                ? "Closed now"
                : pharmacy.openHours,
          };
        } catch {
          return pharmacy;
        }
      })
    );

    const seen = new Set<string>();
    const unique = withDetails.filter((p: { name: string }) => {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json(unique);
  } catch (error) {
    return NextResponse.json(
      { error: "Places API request failed" },
      { status: 502 }
    );
  }
}
