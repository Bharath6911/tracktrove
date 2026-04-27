"use client";

import { useState } from "react";

interface LocationTestResult {
  searchTerm: string;
  country: string;
  itemsFound: number;
  items: Array<{
    itemId: string;
    title: string;
    location: string;
    price: number;
    posted: string;
  }>;
  locationSummary: {
    usaItems: number;
    usaPercentage: number;
    uniqueLocations: string[];
  };
}

export default function LocationFilterTestPage() {
  const [searchTerm, setSearchTerm] = useState("mavado");
  const [country, setCountry] = useState("USA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countries = ["USA", "UK", "Canada", "Australia", "Germany", "France"];

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/test/location-filter?q=${encodeURIComponent(searchTerm)}&country=${encodeURIComponent(country)}`
      );

      if (!response.ok) {
        throw new Error(`Test failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🌍 Location Filter Test</h1>

        <div className="bg-slate-900 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Search Term</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., mavado, omega"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={runTest}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
              >
                {loading ? "Testing..." : "Run Test"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
            <p className="text-red-200">❌ Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Items</p>
                  <p className="text-2xl font-bold text-emerald-400">{result.itemsFound}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{result.country} Items</p>
                  <p className="text-2xl font-bold text-blue-400">{result.locationSummary.usaItems}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">% {result.country}</p>
                  <p className="text-2xl font-bold text-yellow-400">{result.locationSummary.usaPercentage}%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">🗺️ Unique Locations Found</h2>
              <div className="flex flex-wrap gap-2">
                {result.locationSummary.uniqueLocations.map((loc, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-800 rounded text-sm border border-slate-700">
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📦 Sample Items (First 10)</h2>
              <div className="space-y-3">
                {result.items.map((item) => (
                  <div key={item.itemId} className="bg-slate-800 rounded p-3 border border-slate-700">
                    <p className="font-semibold text-sm mb-1">{item.title}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <p>
                        <span className="text-gray-500">📍 Location:</span> <span className="text-emerald-300">{item.location}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">💰 Price:</span> <span className="text-blue-300">${item.price.toFixed(2)}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">⏰ Posted:</span> <span className="text-yellow-300">{new Date(item.posted).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
