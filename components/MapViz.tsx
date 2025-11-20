import React, { useState, useMemo } from 'react';
import { Map, Overlay } from 'pigeon-maps';
import { OOHRecord } from '../types';
import { formatNumberRussian } from '../utils/data';

interface MapVizProps {
  data: OOHRecord[];
}

export const MapViz: React.FC<MapVizProps> = ({ data }) => {
  // Состояние для тултипа (какую точку навели)
  const [hoveredPoint, setHoveredPoint] = useState<OOHRecord | null>(null);

  // 1. Вычисляем центр карты на основе данных
  const { center, zoom } = useMemo(() => {
    if (data.length === 0) return { center: [55.75, 37.61] as [number, number], zoom: 5 };

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let count = 0;

    data.forEach(d => {
      if (d.lat && d.lng) {
        if (d.lat < minLat) minLat = d.lat;
        if (d.lat > maxLat) maxLat = d.lat;
        if (d.lng < minLng) minLng = d.lng;
        if (d.lng > maxLng) maxLng = d.lng;
        count++;
      }
    });

    if (count === 0) return { center: [55.75, 37.61] as [number, number], zoom: 5 };

    // Центр - это среднее арифметическое границ
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Примерный расчет зума (грубая оценка)
    const latDiff = maxLat - minLat;
    let calculatedZoom = 11;
    if (latDiff > 10) calculatedZoom = 4;
    else if (latDiff > 2) calculatedZoom = 7;
    else if (latDiff > 0.5) calculatedZoom = 9;
    else if (latDiff > 0.1) calculatedZoom = 12;
    else calculatedZoom = 14;

    return { center: [centerLat, centerLng] as [number, number], zoom: calculatedZoom };
  }, [data]);

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
      <Map 
        height={500} 
        center={center} 
        zoom={zoom}
        // Отключаем прокрутку колесом, чтобы не мешать скроллу страницы (можно включить: true)
        mouseEvents={true} 
        touchEvents={true}
      >
        {/* Рендерим точки */}
        {data.map((record) => {
          if (!record.lat || !record.lng) return null;
          
          const isHighGrp = record.grp > 3;
          const color = isHighGrp ? '#ef4444' : '#0ea5e9';
          
          // Если точек очень много, делаем их поменьше
          const size = data.length > 1000 ? 6 : 10;

          return (
            <Overlay key={record.id} anchor={[record.lat, record.lng]} offset={[size/2, size/2]}>
              <div 
                onMouseEnter={() => setHoveredPoint(record)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: '1px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  transform: hoveredPoint?.id === record.id ? 'scale(1.5)' : 'scale(1)',
                  transition: 'transform 0.1s',
                  zIndex: hoveredPoint?.id === record.id ? 999 : 1
                }}
              />
            </Overlay>
          );
        })}

        {/* Тултип (всплывающее окно) рендерим отдельно поверх всего */}
        {hoveredPoint && (
          <Overlay anchor={[hoveredPoint.lat, hoveredPoint.lng]} offset={[0, 20]}>
            <div className="bg-white p-3 rounded shadow-xl border border-gray-200 text-sm min-w-[220px] z-[1000] pointer-events-none relative -top-4">
              {/* Стрелочка вниз */}
              <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
              
              <div className="font-bold text-gray-900 mb-1">{hoveredPoint.address}</div>
              <div className="text-xs text-gray-500 mb-2 pb-1 border-b">{hoveredPoint.city}</div>
              
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 text-xs">GRP</span>
                <span className={`font-bold ${hoveredPoint.grp > 3 ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatNumberRussian(hoveredPoint.grp)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">OTS</span>
                <span className="font-bold text-gray-800">
                  {formatNumberRussian(hoveredPoint.ots)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-wider">
                {hoveredPoint.vendor}
              </div>
            </div>
          </Overlay>
        )}
      </Map>
    </div>
  );
};
