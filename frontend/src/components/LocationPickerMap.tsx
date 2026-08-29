import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { reverseGeocode, GeocodeResult } from "../lib/geocode";
import { initLeafletIcons } from "../lib/leafletIcons";
import { AlertCircle, Loader2 } from "lucide-react";

// Initialize Leaflet icons to fix Vite path issues
initLeafletIcons();

// Default center: Connaught Place, New Delhi
const DEFAULT_CENTER = { lat: 28.6304, lng: 77.2177 };
const DEFAULT_ZOOM = 13;

interface LocationPickerMapProps {
  label: string;
  onSelect: (result: GeocodeResult) => void;
  defaultPosition?: { lat: number; lng: number };
}

export function LocationPickerMap({ label, onSelect, defaultPosition }: LocationPickerMapProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(defaultPosition || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = React.useRef<number | null>(null);

  // Map events to handle clicks
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        setLoading(true);
        setError(null);

        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(async () => {
          try {
            const result = await reverseGeocode(lat, lng);
            
            if (!result.pincode) {
              setError("Pin dropped successfully, but please manually confirm your Pincode for accurate pricing.");
            }
            
            onSelect(result);
          } catch (err) {
            setError("Failed to fetch address for this location. Please type it manually.");
          } finally {
            setLoading(false);
          }
        }, 800);
      },
    });
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="relative h-[300px] w-full rounded-md overflow-hidden border border-slate-700">
        <MapContainer
          center={defaultPosition || DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
          {position && <Marker position={position} />}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[1000] flex flex-col items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-200">Finding address...</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 italic">Click anywhere on the map to drop a pin.</p>
    </div>
  );
}
