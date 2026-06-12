"use client";

import { useState, useCallback, useRef } from "react";
import {
  Pill,
  ToggleLeft,
  ToggleRight,
  Upload,
  PackageCheck,
  Users,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { ESSENTIAL_DRUGS } from "./mockData";

interface StockState {
  [drugId: string]: boolean;
}

interface Props {
  onStockChange: (drugId: string, inStock: boolean) => void;
  currentStock: StockState;
  pharmacyCount: number;
}

export default function PharmacistPanel({ onStockChange, currentStock, pharmacyCount }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  }, []);

  const totalStocked = Object.values(currentStock).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Users size={18} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pharmacist Dashboard</h2>
            <p className="text-[11px] text-slate-500">Manage your inventory</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
          <PackageCheck size={18} className="mx-auto text-emerald-600 mb-1" />
          <p className="text-lg font-bold text-emerald-800">{totalStocked}</p>
          <p className="text-[10px] text-emerald-600">In Stock</p>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
          <AlertTriangle size={18} className="mx-auto text-red-500 mb-1" />
          <p className="text-lg font-bold text-red-700">{ESSENTIAL_DRUGS.length - totalStocked}</p>
          <p className="text-[10px] text-red-500">Low Stock</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
          <Users size={18} className="mx-auto text-slate-500 mb-1" />
          <p className="text-lg font-bold text-slate-700">{pharmacyCount}</p>
          <p className="text-[10px] text-slate-500">Customers</p>
        </div>
      </div>

      <div className="px-4 pb-2">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Top 20 Essential Drugs
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {ESSENTIAL_DRUGS.map(drug => {
          const inStock = currentStock[drug.id] ?? true;
          return (
            <div
              key={drug.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                inStock ? "bg-emerald-100" : "bg-red-100"
              }`}>
                <Pill size={14} className={inStock ? "text-emerald-700" : "text-red-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{drug.name}</p>
                <p className="text-[10px] text-slate-400">{drug.generic} &middot; {drug.category}</p>
              </div>
              <button
                onClick={() => onStockChange(drug.id, !inStock)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  inStock
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {inStock ? (
                  <><Check size={13} /> In Stock</>
                ) : (
                  <><X size={13} /> Out of Stock</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : uploadedFile
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload size={20} className={`mx-auto mb-1.5 ${uploadedFile ? "text-emerald-600" : "text-slate-400"}`} />
          {uploadedFile ? (
            <div>
              <p className="text-xs font-medium text-emerald-700">{uploadedFile}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">Uploaded successfully</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-slate-600">Upload stock CSV/Excel</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop or click to browse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
