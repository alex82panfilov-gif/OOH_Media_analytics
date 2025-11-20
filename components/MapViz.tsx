import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { OOHRecord } from '../types';
import { formatNumberRussian } from '../utils/data';

interface MapVizProps {
  data: OOHRecord[];
}

// --- Компонент для авто-фокуса карты ---
// Он смотрит на данные и передвигает камеру так, чтобы все точки влезли в экран
const MapUpdater: React.FC<{ data: OOHRecord[] }> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (data.length === 0) return;

    const lats = data.map(d => d.lat).filter(l => l !== 0);
    const lngs = data.map(d => d.lng).filter(l => l !== 0);

    if (lats.length === 0 || lngs.length === 0) return;

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Если точка всего одна (или все координаты одинаковые)
    if (minLat === maxLat && minLng === maxLng) {
      map.setView([minLat, minLng], 14); // Приближаем близко к этой точке
    } else {
      // Иначе берем границы всех точек и добавляем отступы (padding)
      map.fitBounds(
        [[minLat, minLng], [maxLat, maxLng]], 
        { padding: [50, 50] }
      );
    }
  }, [data, map]);

  return null;
};

// --- Основной компонент карты ---
export const MapViz: React.FC<MapVizProps> = ({ data }) => {
  // Центр по умолчанию (Москва), если данных нет
  const defaultCenter: [number, number] = [55.75, 37.61];

  return (
    // z-0 важен, чтобы карта не перекрывала выпадающие списки фильтров
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* СЛОЙ КАРТЫ (Тайлы OpenStreetMap) - Это и есть "картинка" местности */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Рисуем точки */}
        {data.map((record) => {
           // Пропускаем мусорные координаты
           if (!record.lat || !record.lng) return null;

           // Цвет точки: Красный, если GRP высокий (>3), иначе синий
           const isHighGrp = record.grp > 3;
           const color = isHighGrp ? '#ef4444' : '#0ea5e9';

           return (
            <CircleMarker 
              key={record.id}
              center={[record.lat, record.lng]}
              pathOptions={{ 
                color: color,       // Цвет обводки
                fillColor: color,   // Цвет заливки
                fillOpacity: 0.7, 
                weight: 1 
              }}
              radius={5} // Размер кружочка
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <strong className="block text-sm text-gray-900 mb-1">{record.address}</strong>
                  <div className="text-xs text-gray-500 mb-2 border-b pb-2">
                    {record.city} | {record.vendor}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Формат</div>
                      <div className="font-medium">{record.format}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">GRP</div>
                      <div className={`font-bold ${isHighGrp ? 'text-red-600' : 'text-gray-800'}`}>
                        {formatNumberRussian(record.grp)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">OTS</div>
                      <div>{formatNumberRussian(record.ots)}</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
           );
        })}

        {/* Активируем авто-фокус */}
        <MapUpdater data={data} />
      </MapContainer>
    </div>
  );
};
