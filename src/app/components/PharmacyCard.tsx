"use client";

import { Pharmacy, getDrugById, computeDistance } from "./mockData";
import { MapPin, Clock, ShieldCheck, Star, Phone, Navigation, Globe } from "lucide-react";

interface Props {
  pharmacy: Pharmacy;
  selectedDrugId?: string;
  active: boolean;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function PharmacyCard({ pharmacy, selectedDrugId, active, onSelect, userLocation }: Props) {
  const drugEntry = selectedDrugId
    ? pharmacy.inventory.find(i => i.drugId === selectedDrugId)
    : null;

  const drug = selectedDrugId ? getDrugById(selectedDrugId) : null;

  const distance = userLocation
    ? computeDistance(userLocation.lat, userLocation.lng, pharmacy.lat, pharmacy.lng)
    : null;

  return (
    <button
      onClick={() => onSelect(pharmacy.id)}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
        active
          ? "border-emerald-500 bg-emerald-50/60 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">
            {pharmacy.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            {pharmacy.address}
          </p>
        </div>
        {pharmacy.rating > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-slate-700">
              {pharmacy.rating}
              {pharmacy.userRatingsTotal ? ` (${pharmacy.userRatingsTotal})` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Navigation size={13} className="text-emerald-600" />
          {distance !== null ? `${distance} km` : "—"}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} className={pharmacy.isOpen24h ? "text-emerald-600" : "text-slate-400"} />
          {pharmacy.isOpen24h ? (
            <span className="text-emerald-700 font-medium">24/7</span>
          ) : (
            pharmacy.openHours
          )}
        </span>
        <span className="flex items-center gap-1">
          <Phone size={13} className="text-slate-400" />
          {pharmacy.phone ? pharmacy.phone : "Phone unavailable"}
        </span>
        {pharmacy.website && (
          <a
            href={pharmacy.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <Globe size={13} className="text-slate-400" />
            Website
          </a>
        )}
      </div>

      {pharmacy.businessStatus && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
          {pharmacy.businessStatus.toLowerCase().replaceAll("_", " ")}
        </p>
      )}

      {selectedDrugId && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {drugEntry ? (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <ShieldCheck size={14} className="text-emerald-600" />
                {drug?.name ?? selectedDrugId}
              </span>
              {drugEntry.inStock ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In Stock — ₦{drugEntry.price.toLocaleString()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No data for this drug</span>
          )}
        </div>
      )}

      {!selectedDrugId && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
          {pharmacy.inventory
            .filter(i => i.inStock)
            .slice(0, 4)
            .map(entry => (
              <span
                key={entry.drugId}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {getDrugById(entry.drugId)?.name ?? entry.drugId}
              </span>
            ))}
          {pharmacy.inventory.filter(i => i.inStock).length > 4 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{pharmacy.inventory.filter(i => i.inStock).length - 4} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}
