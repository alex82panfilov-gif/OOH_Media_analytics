import React, { useMemo } from 'react';
import { OOHRecord } from '../types';

interface MapVizProps {
  data: OOHRecord[];
}

// A simplified SVG map component that scales points to a bounding box
export const MapViz: React.FC<MapVizProps> = ({ data }) => {
  
  const { points, bounds } = useMemo(() => {
    if (data.length === 0) return { points: [], bounds: null };

    const lats = data.map(d => d.lat);
    const lngs = data.map(d => d.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add 10% padding
    const latPad = (maxLat - minLat) * 0.1 || 0.01;
    const lngPad = (maxLng - minLng) * 0.1 || 0.01;

    return {
      points: data,
      bounds: {
        minLat: minLat - latPad,
        maxLat: maxLat + latPad,
        minLng: minLng - lngPad,
        maxLng: maxLng + lngPad,
      }
    };
  }, [data]);

  if (!bounds) {
    return <div className="flex items-center justify-center h-full text-gray-400">Нет данных для отображения карты</div>;
  }

  const width = 800;
  const height = 400;

  const getX = (lng: number) => {
    return ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  };

  // Latitude is inverted in SVG (y=0 is top)
  const getY = (lat: number) => {
    return height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  };

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      {/* Placeholder for Map Tiles Background */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Russia_edcp_location_map.svg/2560px-Russia_edcp_location_map.svg.png')] bg-cover bg-center" />
      
      <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded shadow text-xs font-semibold text-gray-700">
        Карта поверхностей
      </div>

      <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded shadow text-xs text-gray-600 flex flex-col gap-1">
         <button className="hover:bg-gray-100 w-6 h-6 flex items-center justify-center rounded font-bold">+</button>
         <button className="hover:bg-gray-100 w-6 h-6 flex items-center justify-center rounded font-bold">-</button>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full pointer-events-none">
        {points.map((p) => (
          <circle
            key={p.id}
            cx={getX(p.lng)}
            cy={getY(p.lat)}
            r={3}
            fill="#0ea5e9"
            stroke="#0284c7"
            strokeWidth={0.5}
            opacity={0.7}
          />
        ))}
      </svg>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">
        © 2025 OSM © 2025 TomTom Feedback
      </div>
    </div>
  );
};