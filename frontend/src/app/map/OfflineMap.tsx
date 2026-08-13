import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import safePlaces from './safe-places.json';

// Fix default icon issue for Leaflet in Next.js
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const OfflineMap: React.FC = () => {
  // Ensure the code only runs in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const position: [number, number] = [28.6139, 77.2090]; // Default center

  useEffect(() => {
    // If map already exists, do nothing
    if (mapRef.current) return;

    const map = L.map(containerRef.current as HTMLElement, {
      center: position,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    safePlaces.forEach((place: any) => {
      const marker = L.marker([place.latitude, place.longitude]).addTo(map);
      const popupContent = `
        <div>
          <strong>${place.name}</strong><br/>
          <em>Safety Level: ${place.safetyLevel}</em><br/>
          <p>${place.description}</p>
          <p>Contact: ${place.contact}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
    });

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ height: '500px', width: '100%' }} />;
};

export default OfflineMap;
