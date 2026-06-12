"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { MAP_CENTER, MAP_ZOOM, getDrugById, computeDistance, type Pharmacy } from "./mockData";
import { Navigation } from "lucide-react";

function createColoredIcon(active: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker ${active ? "active" : ""}" style="border-color: ${active ? "#059669" : "#10b981"}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${active ? "#059669" : "#10b981"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

interface MapMarkerProps {
  pharmacy: Pharmacy;
  active: boolean;
  selectedDrugId?: string | null;
}

interface MapMarkerProps {
  pharmacy: Pharmacy;
  active: boolean;
  selectedDrugId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
}

function MapMarker({ pharmacy, active, selectedDrugId, userLocation }: MapMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const icon = useMemo(() => createColoredIcon(active), [active]);

  useEffect(() => {
    if (active && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [active]);

  const drugEntry = selectedDrugId
    ? pharmacy.inventory.find(i => i.drugId === selectedDrugId)
    : null;

  const drug = selectedDrugId ? getDrugById(selectedDrugId) : null;

  const inStockCount = pharmacy.inventory.filter(i => i.inStock).length;

  const distance = userLocation
    ? computeDistance(userLocation.lat, userLocation.lng, pharmacy.lat, pharmacy.lng)
    : null;

  return (
    <Marker
      ref={markerRef}
      position={[pharmacy.lat, pharmacy.lng]}
      icon={icon}
    >
      <Popup>
        <div className="font-sans min-w-[180px]">
          <h3 className="font-bold text-slate-900 text-sm">{pharmacy.name}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{pharmacy.address}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
            {distance !== null && <span>{distance} km</span>}
            <span>{pharmacy.isOpen24h ? "24/7" : pharmacy.openHours}</span>
          </div>
          {selectedDrugId && drugEntry ? (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-700">{drug?.name}</p>
              {drugEntry.inStock ? (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In Stock — ₦{drugEntry.price.toLocaleString()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">{inStockCount} medications in stock</p>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapController({ activePharmacyId, userLocation, pharmacies }: { activePharmacyId: string | null; userLocation: { lat: number; lng: number } | null | undefined; pharmacies: Pharmacy[] }) {
  const map = useMap();
  const lastLocationKey = useRef<string | null>(null);

  useEffect(() => {
    if (activePharmacyId) {
      const pharm = pharmacies.find(p => p.id === activePharmacyId);
      if (pharm) {
        map.flyTo([pharm.lat, pharm.lng], 15, { duration: 0.8 });
      }
    } else if (userLocation) {
      const key = `${userLocation.lat.toFixed(5)}:${userLocation.lng.toFixed(5)}`;
      if (lastLocationKey.current !== key) {
        map.setView([userLocation.lat, userLocation.lng], 13);
        lastLocationKey.current = key;
      }
    } else {
      map.setView(MAP_CENTER, MAP_ZOOM);
      lastLocationKey.current = null;
    }
  }, [activePharmacyId, userLocation, map, pharmacies]);

  return null;
}

interface Props {
  activePharmacyId: string | null;
  selectedDrug: string | null;
  onMarkerClick: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  pharmacies: Pharmacy[];
}

export default function MapCanvas({ activePharmacyId, selectedDrug, onMarkerClick, userLocation, pharmacies }: Props) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={userLocation ?? MAP_CENTER}
        zoom={userLocation ? 13 : MAP_ZOOM}
        zoomControl={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController activePharmacyId={activePharmacyId} userLocation={userLocation} pharmacies={pharmacies} />

        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="font-sans text-xs">
                  <strong>You are here</strong>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={500}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5, dashArray: '4 4' }}
            />
          </>
        )}

        {pharmacies.map(p => (
          <div key={p.id} onClick={() => onMarkerClick(p.id)}>
            <MapMarker
              pharmacy={p}
              active={activePharmacyId === p.id}
              selectedDrugId={selectedDrug}
              userLocation={userLocation}
            />
          </div>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow text-xs text-slate-500 border border-slate-200">
        <div className="flex items-center gap-2">
          <Navigation size={14} className="text-emerald-600" />
          {pharmacies.length} pharmacies · {userLocation ? "nearby" : "—"}
        </div>
      </div>
    </div>
  );
}
