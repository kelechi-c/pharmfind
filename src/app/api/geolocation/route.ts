import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://ip-api.com/json/?fields=status,lat,lon,city,regionName", {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "IP geolocation failed" }, { status: 502 });
    }

    const data = await res.json();

    if (data.status !== "success") {
      return NextResponse.json({ error: "IP geolocation lookup unsuccessful" }, { status: 502 });
    }

    return NextResponse.json({
      lat: data.lat,
      lng: data.lon,
      city: data.city,
      region: data.regionName,
    });
  } catch {
    return NextResponse.json({ error: "IP geolocation request failed" }, { status: 502 });
  }
}
