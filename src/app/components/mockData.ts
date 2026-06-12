export type DrugCategory = "Antimalarials" | "Antibiotics" | "Painkillers" | "Supplements" | "Cardiovascular" | "GI" | "Steroids" | "Respiratory" | "Other";

export interface Drug {
  id: string;
  name: string;
  generic: string;
  category: DrugCategory;
}

export interface InventoryEntry {
  drugId: string;
  inStock: boolean;
  price: number;
  quantity: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  area: string;
  lat: number;
  lng: number;
  isOpen24h: boolean;
  openHours: string;
  phone: string;
  website?: string;
  rating: number;
  userRatingsTotal?: number;
  businessStatus?: string;
  inventory: InventoryEntry[];
}

export function computeDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const DRUGS: Drug[] = [
  { id: "d1", name: "Coartem", generic: "Artemether/Lumefantrine", category: "Antimalarials" },
  { id: "d2", name: "Paracetamol", generic: "Acetaminophen", category: "Painkillers" },
  { id: "d3", name: "Amoxicillin", generic: "Amoxicillin", category: "Antibiotics" },
  { id: "d4", name: "Metronidazole", generic: "Metronidazole", category: "Antibiotics" },
  { id: "d5", name: "Ibuprofen", generic: "Ibuprofen", category: "Painkillers" },
  { id: "d6", name: "Artemether Inj", generic: "Artemether", category: "Antimalarials" },
  { id: "d7", name: "ORS", generic: "Oral Rehydration Salts", category: "Other" },
  { id: "d8", name: "Vitamin C", generic: "Ascorbic Acid", category: "Supplements" },
  { id: "d9", name: "Amlodipine", generic: "Amlodipine", category: "Cardiovascular" },
  { id: "d10", name: "Omeprazole", generic: "Omeprazole", category: "GI" },
  { id: "d11", name: "Prednisolone", generic: "Prednisolone", category: "Steroids" },
  { id: "d12", name: "Salbutamol", generic: "Albuterol", category: "Respiratory" },
  { id: "d13", name: "Furosemide", generic: "Furosemide", category: "Cardiovascular" },
  { id: "d14", name: "Diclofenac", generic: "Diclofenac Sodium", category: "Painkillers" },
  { id: "d15", name: "Ciprofloxacin", generic: "Ciprofloxacin", category: "Antibiotics" },
  { id: "d16", name: "Multivitamins", generic: "Multivitamin", category: "Supplements" },
  { id: "d17", name: "Ferrous Sulfate", generic: "Iron Supplement", category: "Supplements" },
  { id: "d18", name: "Folic Acid", generic: "Folate", category: "Supplements" },
  { id: "d19", name: "Zinc Sulfate", generic: "Zinc", category: "Supplements" },
  { id: "d20", name: "Gentamicin", generic: "Gentamicin", category: "Antibiotics" },
];

export const CATEGORIES: DrugCategory[] = [
  "Antimalarials", "Antibiotics", "Painkillers", "Supplements",
  "Cardiovascular", "GI", "Steroids", "Respiratory", "Other"
];

export const ESSENTIAL_DRUGS = DRUGS.slice(0, 20);

export function getDrugById(id: string): Drug | undefined {
  return DRUGS.find(d => d.id === id);
}

export function getDrugsByCategory(category: DrugCategory): Drug[] {
  return DRUGS.filter(d => d.category === category);
}

export function searchDrugs(query: string): Drug[] {
  if (!query.trim()) return DRUGS;
  const q = query.toLowerCase();
  return DRUGS.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.generic.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q)
  );
}

export function searchPharmacies(pharmacies: Pharmacy[], query: string): Pharmacy[] {
  if (!query.trim()) return pharmacies;
  const q = query.toLowerCase();
  return pharmacies.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.area.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q)
  );
}

export function generateInventory(): InventoryEntry[] {
  const count = 5 + Math.floor(Math.random() * 8);
  const shuffled = [...DRUGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(drug => ({
    drugId: drug.id,
    inStock: Math.random() > 0.25,
    price: Math.round((500 + Math.random() * 9500) / 100) * 100,
    quantity: Math.random() > 0.25 ? Math.floor(Math.random() * 200) + 10 : 0,
  }));
}

export const MAP_CENTER: [number, number] = [6.54, 3.36];
export const MAP_ZOOM = 12;
