'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const laadIcon = createIcon('#22c55e'); // Green for loading
const losIcon = createIcon('#ef4444'); // Red for unloading

interface AddressMapProps {
  laadLat: number | null;
  laadLng: number | null;
  laadAdres?: string | null;
  losLat: number | null;
  losLng: number | null;
  losAdres?: string | null;
}

// Component to fit bounds when markers change
function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [map, bounds]);
  
  return null;
}

export function AddressMap({ 
  laadLat, 
  laadLng, 
  laadAdres, 
  losLat, 
  losLng, 
  losAdres 
}: AddressMapProps) {
  const [mounted, setMounted] = useState(false);
  
  // Prevent SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Kaart laden...</span>
      </div>
    );
  }
  
  // Check if we have at least one valid coordinate
  const hasLaad = laadLat !== null && laadLng !== null;
  const hasLos = losLat !== null && losLng !== null;
  
  if (!hasLaad && !hasLos) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            Geen coördinaten beschikbaar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Geocoding wordt uitgevoerd bij nieuwe orders
          </p>
        </div>
      </div>
    );
  }
  
  // Calculate center and bounds
  const positions: [number, number][] = [];
  if (hasLaad) positions.push([laadLat!, laadLng!]);
  if (hasLos) positions.push([losLat!, losLng!]);
  
  const center: [number, number] = hasLaad 
    ? [laadLat!, laadLng!] 
    : [losLat!, losLng!];
  
  // Create bounds if we have both points
  let bounds: L.LatLngBounds | null = null;
  if (hasLaad && hasLos) {
    bounds = L.latLngBounds([
      [laadLat!, laadLng!],
      [losLat!, losLng!]
    ]);
  }
  
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={hasLaad && hasLos ? 6 : 10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bounds && <FitBounds bounds={bounds} />}
        
        {/* Laad marker (green) */}
        {hasLaad && (
          <Marker position={[laadLat!, laadLng!]} icon={laadIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-green-600">📦 Laden</strong>
                <br />
                {laadAdres || `${laadLat?.toFixed(4)}, ${laadLng?.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Los marker (red) */}
        {hasLos && (
          <Marker position={[losLat!, losLng!]} icon={losIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-red-600">📍 Lossen</strong>
                <br />
                {losAdres || `${losLat?.toFixed(4)}, ${losLng?.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Line between points */}
        {hasLaad && hasLos && (
          <Polyline
            positions={[[laadLat!, laadLng!], [losLat!, losLng!]]}
            color="#3b82f6"
            weight={2}
            dashArray="5, 10"
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}

