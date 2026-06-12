"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Pill, Building2, X, ArrowLeft, MapPin, Navigation, Loader } from "lucide-react";
import { computeDistance, generateInventory, searchPharmacies, type DrugCategory, searchDrugs, type Pharmacy, DRUGS } from "./components/mockData";
import PharmacyCard from "./components/PharmacyCard";
import PharmacistPanel from "./components/PharmacistPanel";

const MapCanvas = dynamic(() => import("./components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [searchMode, setSearchMode] = useState<"medication" | "pharmacy">("medication");
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [activePharmacyId, setActivePharmacyId] = useState<string | null>(null);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPharmacistView, setIsPharmacistView] = useState(false);
  const [medQuery, setMedQuery] = useState("");
  const [pharmQuery, setPharmQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DrugCategory | null>(null);
  const [stockOverride, setStockOverride] = useState<Record<string, boolean>>({});
  const [mobilePanel, setMobilePanel] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAsked, setLocationAsked] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      setLocationLoading(false);
      setLocationAsked(true);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        setLocationAsked(true);
      },
      (err) => {
        setLocationError(err.message);
        setLocationLoading(false);
        setLocationAsked(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      setLocationLoading(false);
      return;
    }
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!userLocation) return;
    setFetchError(null);
    fetch(`/api/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch nearby pharmacies");
        }
        return data;
      })
      .then(data => {
        const withInventory = data.map((p: Omit<Pharmacy, "inventory">) => ({
          ...p,
          inventory: generateInventory(),
        }));
        setAllPharmacies(withInventory);
        setFilteredPharmacies(withInventory);
      })
      .catch(err => {
        setFetchError(err.message);
        setAllPharmacies([]);
        setFilteredPharmacies([]);
    });
  }, [userLocation]);

  const sortedPharmacies = useMemo(() => {
    if (!userLocation) return filteredPharmacies;
    return [...filteredPharmacies].sort((a, b) => {
      const dA = computeDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const dB = computeDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return dA - dB;
    });
  }, [filteredPharmacies, userLocation]);

  const visiblePharmacies = useMemo(() => searchPharmacies(sortedPharmacies, pharmQuery), [sortedPharmacies, pharmQuery]);

  const drugResults = useMemo(() => {
    let results = searchDrugs(medQuery);
    if (selectedCategory) {
      results = results.filter(d => d.category === selectedCategory);
    }
    return results;
  }, [medQuery, selectedCategory]);

  const handleDrugSelect = useCallback((drugId: string) => {
    const newId = selectedDrug === drugId ? null : drugId;
    setSelectedDrug(newId);
    if (newId) {
      const pharmaciesWithDrug = allPharmacies.filter(p => {
        const entry = p.inventory.find(i => i.drugId === newId);
        const overridden = stockOverride[`${p.id}-${newId}`];
        const baseStock = entry?.inStock ?? false;
        return overridden !== undefined ? overridden : baseStock;
      });
      setFilteredPharmacies(pharmaciesWithDrug);
    } else {
      setFilteredPharmacies(allPharmacies);
    }
    setActivePharmacyId(null);
  }, [selectedDrug, stockOverride]);

  const handleStockChange = useCallback((drugId: string, inStock: boolean) => {
    const key = `stock-${drugId}`;
    setStockOverride(prev => ({
      ...prev,
      [drugId]: inStock,
    }));

    allPharmacies.forEach(p => {
      const entry = p.inventory.find(i => i.drugId === drugId);
      if (entry) {
        const overrideKey = `${p.id}-${drugId}`;
        setStockOverride(prev => ({
          ...prev,
          [overrideKey]: inStock,
        }));
      }
    });

    if (selectedDrug === drugId) {
      const pharmaciesWithDrug = allPharmacies.filter(p => {
        const entry = p.inventory.find(i => i.drugId === drugId);
        const baseStock = entry?.inStock ?? false;
        return inStock && baseStock;
      });
      setFilteredPharmacies(pharmaciesWithDrug);
    }
  }, [selectedDrug]);

  const handleClearFilters = useCallback(() => {
    setSelectedDrug(null);
    setMedQuery("");
    setPharmQuery("");
    setSelectedCategory(null);
    setFilteredPharmacies(allPharmacies);
    setActivePharmacyId(null);
  }, [allPharmacies]);

  const handleMarkerClick = useCallback((id: string) => {
    setActivePharmacyId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="h-dvh flex flex-col bg-slate-100">
      {isPharmacistView ? (
        <>
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setIsPharmacistView(false)}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Customer View
            </button>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Pharmacist mode
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <PharmacistPanel
              onStockChange={handleStockChange}
              currentStock={stockOverride}
              pharmacyCount={allPharmacies.length}
            />
          </div>
        </>
      ) : (
        <>
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Pill size={18} className="text-emerald-700" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">NearPharm</h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  {locationLoading ? (
                    <><Loader size={10} className="animate-spin" /> Locating…</>
                  ) : userLocation ? (
                    <><Navigation size={10} className="text-emerald-600" /> Using your location</>
                  ) : (
                    <>
                      <MapPin size={10} />
                      {locationError || "Location unavailable"}
                      {locationAsked && (
                        <button
                          onClick={() => requestLocation()}
                          className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPharmacistView(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
            >
              <Building2 size={14} />
              Pharmacist View
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="hidden md:flex md:w-[400px] lg:w-[440px] flex-col border-r border-slate-200 bg-white">
              <MobileSearchPanel
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                medQuery={medQuery}
                setMedQuery={setMedQuery}
                pharmQuery={pharmQuery}
                setPharmQuery={setPharmQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                drugResults={drugResults}
                selectedDrug={selectedDrug}
                handleDrugSelect={handleDrugSelect}
                filteredPharmacies={visiblePharmacies}
                activePharmacyId={activePharmacyId}
                setActivePharmacyId={setActivePharmacyId}
                handleClearFilters={handleClearFilters}
                userLocation={userLocation}
              />
            </div>

            <div className="flex-1 relative">
              <MapCanvas
                activePharmacyId={activePharmacyId}
                selectedDrug={selectedDrug}
                onMarkerClick={handleMarkerClick}
                userLocation={userLocation}
                pharmacies={sortedPharmacies}
              />
            </div>
          </div>

          <div className="md:hidden flex border-t border-slate-200 bg-white">
            <button
              onClick={() => setMobilePanel("list")}
              className={`flex-1 py-3 text-xs font-medium text-center ${
                mobilePanel === "list"
                  ? "text-emerald-700 border-t-2 border-emerald-500 bg-emerald-50/50"
                  : "text-slate-500"
              }`}
            >
              Search & List
            </button>
            <button
              onClick={() => setMobilePanel("map")}
              className={`flex-1 py-3 text-xs font-medium text-center ${
                mobilePanel === "map"
                  ? "text-emerald-700 border-t-2 border-emerald-500 bg-emerald-50/50"
                  : "text-slate-500"
              }`}
            >
              Map View
            </button>
          </div>

          {mobilePanel === "list" && (
            <div className="md:hidden fixed inset-x-0 top-[52px] bottom-[45px] bg-white z-40 overflow-y-auto">
              <MobileSearchPanel
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                medQuery={medQuery}
                setMedQuery={setMedQuery}
                pharmQuery={pharmQuery}
                setPharmQuery={setPharmQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                drugResults={drugResults}
                selectedDrug={selectedDrug}
                handleDrugSelect={handleDrugSelect}
                filteredPharmacies={visiblePharmacies}
                activePharmacyId={activePharmacyId}
                setActivePharmacyId={setActivePharmacyId}
                handleClearFilters={handleClearFilters}
                userLocation={userLocation}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MobileSearchPanel({
  searchMode, setSearchMode, medQuery, setMedQuery, pharmQuery, setPharmQuery,
  selectedCategory, setSelectedCategory, drugResults, selectedDrug, handleDrugSelect,
  filteredPharmacies, activePharmacyId, setActivePharmacyId, handleClearFilters, userLocation,
}: {
  searchMode: "medication" | "pharmacy";
  setSearchMode: (m: "medication" | "pharmacy") => void;
  medQuery: string;
  setMedQuery: (v: string) => void;
  pharmQuery: string;
  setPharmQuery: (v: string) => void;
  selectedCategory: DrugCategory | null;
  setSelectedCategory: (c: DrugCategory | null) => void;
  drugResults: typeof DRUGS;
  selectedDrug: string | null;
  handleDrugSelect: (id: string) => void;
  filteredPharmacies: Pharmacy[];
  activePharmacyId: string | null;
  setActivePharmacyId: (id: string | null) => void;
  handleClearFilters: () => void;
  userLocation: { lat: number; lng: number } | null;
}) {
  const CATEGORIES: DrugCategory[] = [
    "Antimalarials", "Antibiotics", "Painkillers", "Supplements",
    "Cardiovascular", "GI", "Steroids", "Respiratory", "Other"
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setSearchMode("medication"); handleClearFilters(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
            searchMode === "medication"
              ? "text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50"
              : "text-slate-500"
          }`}
        >
          <Pill size={16} />
          Find Medication
        </button>
        <button
          onClick={() => { setSearchMode("pharmacy"); handleClearFilters(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
            searchMode === "pharmacy"
              ? "text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50"
              : "text-slate-500"
          }`}
        >
          <Building2 size={16} />
          Find Pharmacy
        </button>
      </div>

      <div className="p-4 pb-2">
        {searchMode === "medication" ? (
          <>
            <div className="relative">
              <Pill size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search medications…"
                value={medQuery}
                onChange={e => setMedQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 bg-slate-50"
              />
              {medQuery && (
                <button onClick={() => setMedQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {selectedDrug && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-medium text-emerald-800">
                  Showing: <strong>{DRUGS.find(d => d.id === selectedDrug)?.name}</strong>
                </span>
                <button onClick={handleClearFilters} className="ml-auto text-emerald-600">
                  <X size={15} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pharmacy name or area…"
              value={pharmQuery}
              onChange={e => setPharmQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 bg-slate-50"
            />
            {pharmQuery && (
              <button onClick={() => setPharmQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {searchMode === "medication" && !selectedDrug && drugResults.length > 0 && (
          <div className="mb-2">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
              Medications ({drugResults.length})
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {drugResults.map(drug => (
                <button
                  key={drug.id}
                  onClick={() => handleDrugSelect(drug.id)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 text-xs"
                >
                  <span className="font-medium text-slate-800">{drug.name}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{drug.generic}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
            {searchMode === "medication"
              ? selectedDrug ? "Pharmacies with stock" : "Nearby pharmacies"
              : `Pharmacies (${filteredPharmacies.length})`}
          </p>
          {filteredPharmacies.length > 0 ? (
            filteredPharmacies.map(p => (
              <div key={p.id} className="mb-2.5">
                <PharmacyCard
                  pharmacy={p}
                  selectedDrugId={selectedDrug ?? undefined}
                  active={activePharmacyId === p.id}
                  onSelect={setActivePharmacyId}
                  userLocation={userLocation}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Building2 size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No pharmacies found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
