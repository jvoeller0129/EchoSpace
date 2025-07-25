import { useEffect, useRef } from "react";
import type { FragmentWithDistance } from "@shared/schema";

interface MapContainerProps {
  fragments: FragmentWithDistance[];
  currentLocation: { lat: number; lng: number } | null;
  onFragmentSelect: (fragment: FragmentWithDistance) => void;
  selectedFragment: FragmentWithDistance | null;
}

export default function MapContainer({
  fragments,
  currentLocation,
  onFragmentSelect,
  selectedFragment,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Import Leaflet dynamically to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map only once
      const map = L.map(mapRef.current!, {
        center: currentLocation || [39.6295, -79.9559], // Default to Morgantown, WV
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });
      
      mapInstanceRef.current = map;

      // Add tile layer with proper options
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0,
      }).addTo(map);
      
      // Force map to resize after initialization
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Initialize only once

  // Update map content when fragments, location, or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    console.log("Map update triggered, fragments count:", fragments.length);

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      
      // Clear existing markers
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];

      // Add fragment markers
      console.log("Adding fragments to map:", fragments);
      fragments.forEach((fragment) => {
        console.log("Creating marker for:", fragment.title, fragment.latitude, fragment.longitude);
        const categoryColors: Record<string, string> = {
          story: "#F59E0B", // echo-amber
          memory: "#0F766E", // echo-teal
          lore: "#1E3A8A", // echo-blue
          mystery: "#7C3AED", // purple
          history: "#DC2626", // red
        };

        const color = categoryColors[fragment.category] || "#6B7280";
        
        const marker = L.circleMarker([fragment.latitude, fragment.longitude], {
          radius: 12,
          fillColor: color,
          color: "white",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8,
          stroke: true,
          className: 'fragment-marker'
        }).addTo(map);

        console.log("Marker added to map:", marker, "at position:", [fragment.latitude, fragment.longitude]);
        markersRef.current.push(marker);

        marker.bindPopup(`
          <div class="text-sm">
            <h3 class="font-semibold text-gray-900">${fragment.title}</h3>
            <p class="text-gray-600 mt-1">${fragment.content.substring(0, 100)}...</p>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                ${fragment.category}
              </span>
            </div>
          </div>
        `);

        marker.on("click", () => {
          onFragmentSelect(fragment);
        });

        // Highlight selected fragment
        if (selectedFragment && selectedFragment.id === fragment.id) {
          marker.setStyle({
            radius: 12,
            weight: 4,
          });
        }
      });

      // Add current location marker if available
      if (currentLocation) {
        const userMarker = L.circleMarker([currentLocation.lat, currentLocation.lng], {
          radius: 6,
          fillColor: "#3B82F6",
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);

        markersRef.current.push(userMarker);

        // Add pulsing animation
        const pulseMarker = L.circleMarker([currentLocation.lat, currentLocation.lng], {
          radius: 15,
          fillColor: "#3B82F6",
          color: "#3B82F6",
          weight: 1,
          opacity: 0.6,
          fillOpacity: 0.2,
        }).addTo(map);

        markersRef.current.push(pulseMarker);

        // Center map on user location
        map.setView([currentLocation.lat, currentLocation.lng], 16);
      }
    });
  }, [fragments, currentLocation, selectedFragment]);

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 z-0"
      data-testid="map-container"
      style={{ height: "100%", width: "100%" }}
    />
  );
}