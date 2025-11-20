import React, { useState, useMemo } from 'react';
import { Map, Overlay } from 'pigeon-maps';
import { OOHRecord } from '../types';
import { formatNumberRussian } from '../utils/data';

interface MapVizProps {
  data: OOHRecord[];
  // Новые пропсы для взаимодействия
  onPointClick?: (id: string) => void;
  selectedPointId?: string | null;
}

export const MapViz: React.FC<MapVizProps> = ({ data, onPointClick, selectedPointId }) => {
  const [hoveredPoint, setHoveredPoint] = useState<OOHRecord | null>(null);

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

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDiff = maxLat - minLat;

    let calculatedZoom = 11;
    if (latDiff > 10) calculatedZoom = 4;
    else if (latDiff > 2) calculatedZoom = 7;
    else if (latDiff > 0.5) calculatedZoom = 9;
    else if (latDiff > 0.1) calculatedZoom = 12;
    else calculatedZoom = 14;

    return { center: [centerLat, centerLng] as [number, number], zoom: calculatedZoom };
  }, [data]);

  const getPointType = (format: string) => {
    const fmt = (format || '').toUpperCase();
    const isDigital = fmt.startsWith('D') || fmt === 'MF';
    return {
      isDigital,
      color: isDigital ? '#ef4444' : '#0ea5e9',
      label: isDigital ? 'Digital' : 'Статика'
    };
  };

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
      <Map 
        height={500} 
        center={center} 
        zoom={zoom}
        mouseEvents={true} 
        touchEvents={true}
        // При клике по пустому месту карты - сбрасываем выбор
        onClick={() => {
          if (onPointClick) onPointClick('');
        }}
      >
        {data.map((record) => {
          if (!record.lat || !record.lng) return null;
          
          const { color, isDigital } = getPointType(record.format);
          
          // Проверяем, выбрана ли эта точка или наведена ли она
          const isSelected = selectedPointId === record.id;
          const isHovered = hoveredPoint?.id === record.id;
          const isActive = isSelected || isHovered;

          const baseSize = data.length > 1000 ? 6 : 10;
          const size = isDigital ? baseSize + 2 : baseSize;

          return (
            <Overlay key={record.id} anchor={[record.lat, record.lng]} offset={[size/2, size/2]}>
              <div 
                onMouseEnter={() => setHoveredPoint(record)}
                onMouseLeave={() => setHoveredPoint(null)}
                // Добавляем обработчик клика
                onClick={(e) => {
                  e.stopPropagation(); // Чтобы не сработал клик по карте (сброс)
                  if (onPointClick) onPointClick(record.id);
                }}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: '50%',
                  // Если выбрана - жирная черная обводка, иначе белая
                  border: isSelected ? '2px solid #000' : '1px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  // Увеличиваем если активна
                  transform: isActive ? 'scale(1.8)' : 'scale(1)',
                  transition: 'transform 0.15s ease-out',
                  zIndex: isActive ? 999 : (isDigital ? 10 : 1)
                }}
              />
            </Overlay>
          );
        })}

        {/* Тултип */}
        {hoveredPoint && (
          <Overlay anchor={[hoveredPoint.lat, hoveredPoint.lng]} offset={[0, 20]}>
             <div className="bg-white p-3 rounded shadow-xl border border-gray-200 text-sm min-w-[220px] z-[1000] pointer-events-none relative -top-4">
              <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
              
              <div className="font-bold text-gray-900 mb-1 line-clamp-2">{hoveredPoint.address}</div>
              <div className="text-xs text-gray-500 mb-2 pb-1 border-b">{hoveredPoint.city}</div>
              
              <div className="flex justify-between items-center mb-2 bg-gray-50 p-1 rounded">
                <span className="font-semibold text-gray-700">{hoveredPoint.format}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  getPointType(hoveredPoint.format).isDigital 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {getPointType(hoveredPoint.format).label}
                </span>
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 text-xs">GRP</span>
                <span className="font-bold text-gray-800">{formatNumberRussian(hoveredPoint.grp)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">OTS</span>
                <span className="font-bold text-gray-800">{formatNumberRussian(hoveredPoint.ots)}</span>
              </div>
              <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-wider truncate">
                {hoveredPoint.vendor}
              </div>
              <div className="mt-2 text-[10px] text-teal-600 text-center font-bold border-t pt-1">
                Нажмите для деталей
              </div>
            </div>
          </Overlay>
        )}
      </Map>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 z-[500]">
        <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Тип поверхности</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444] border border-white shadow-sm"></div>
            <span className="text-xs text-gray-800 font-medium">Digital (DOOH)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0ea5e9] border border-white shadow-sm"></div>
            <span className="text-xs text-gray-800 font-medium">Статика</span>
          </div>
        </div>
      </div>
    </div>
  );
};
