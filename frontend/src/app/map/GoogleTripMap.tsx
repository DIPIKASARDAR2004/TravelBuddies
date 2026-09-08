'use client';
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function TripDirections({ plan }: { plan?: any }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMins, setDurationMins] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!map || !routesLibrary || !plan) return;

    let polyline: any = null;

    const hotelLat = plan.selectedHotel?.latitude;
    const hotelLng = plan.selectedHotel?.longitude;
    
    if (!hotelLat || !hotelLng) return;

    const validActivities = (plan.selectedActivities || []).filter((a: any) => a.latitude && a.longitude);
    if (validActivities.length === 0) return;

    const origin = { lat: Number(hotelLat), lng: Number(hotelLng) };
    const destination = { lat: Number(validActivities[validActivities.length - 1].latitude), lng: Number(validActivities[validActivities.length - 1].longitude) };
    
    const intermediates = validActivities.slice(0, -1).map((a: any) => ({
      lat: Number(a.latitude), lng: Number(a.longitude)
    }));

    const calculateRoute = async () => {
      try {
        const { Route } = routesLibrary as any;
        if (!Route || !Route.computeRoutes) {
          setErrorMsg("Routing API not available.");
          return;
        }

        // Format for Routes API using explicit google.maps.LatLng instances
        const request: any = {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis']
        };

        if (intermediates.length > 0) {
          request.intermediates = intermediates.map((i: any) => ({
            location: new google.maps.LatLng(i.lat, i.lng)
          }));
        }

        const response = await Route.computeRoutes(request);

        if (response && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          
          if (route.path) {
            polyline = new google.maps.Polyline({
              path: route.path,
              map: map,
              strokeColor: '#3b82f6',
              strokeWeight: 6,
              strokeOpacity: 0.7,
            });
          }

          if (route.distanceMeters) {
            setDistanceKm(route.distanceMeters / 1000);
          }
          if (route.durationMillis) {
            setDurationMins(Math.round(route.durationMillis / 60000));
          }
          setErrorMsg('');
        } else {
          setErrorMsg("No route available.");
        }
      } catch (err: any) {
        console.error("Routing error:", err);
        setErrorMsg("Failed to compute route.");
      }
    };

    calculateRoute();

    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [map, routesLibrary, plan]);

  if (errorMsg) {
    return (
      <div className="absolute top-4 left-4 z-10 bg-red-100/90 text-red-700 px-4 py-2 rounded-lg shadow-md font-medium text-sm backdrop-blur-sm">
        {errorMsg}
      </div>
    );
  }

  if (distanceKm !== null && durationMins !== null) {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    return (
      <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 px-5 py-3 rounded-xl shadow-lg font-bold text-sm backdrop-blur-md border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Total Driving Route
        </div>
        <div className="text-lg">{distanceKm.toFixed(1)} km • {timeString}</div>
      </div>
    );
  }

  return null;
}

export default function GoogleTripMap({ plan }: { plan?: any }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const defaultCenter = { lat: 27.037, lng: 88.261 };
  const hotelLat = plan?.selectedHotel?.latitude;
  const hotelLng = plan?.selectedHotel?.longitude;
  const center = (hotelLat && hotelLng) ? { lat: Number(hotelLat), lng: Number(hotelLng) } : defaultCenter;

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="DEMO_MAP_ID"
        >
          {/* Hotel Marker */}
          {hotelLat && hotelLng && (
            <AdvancedMarker position={{ lat: Number(hotelLat), lng: Number(hotelLng) }} title={plan.selectedHotel.name}>
              <Pin background={'#3b82f6'} borderColor={'#1d4ed8'} glyphColor={'#ffffff'} />
            </AdvancedMarker>
          )}

          {/* Activities Markers */}
          {plan?.selectedActivities?.map((activity: any, idx: number) => {
            if (activity.latitude && activity.longitude) {
              return (
                <AdvancedMarker key={idx} position={{ lat: Number(activity.latitude), lng: Number(activity.longitude) }} title={activity.activity_name}>
                  <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'#ffffff'} />
                </AdvancedMarker>
              );
            }
            return null;
          })}

          <TripDirections plan={plan} />
        </Map>
      </APIProvider>
    </div>
  );
}
