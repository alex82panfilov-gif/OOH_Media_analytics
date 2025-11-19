import { OOHRecord } from '../types';

const CITIES = ['Москва и МО', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
const VENDORS = ['RUSS', 'РИМ MEDIAGROUP', 'ГОРИНФОР', 'GALLERY', 'POSTER', 'NORTH STAR', 'OUTDOOR'];
const FORMATS = ['SS', 'CB', 'DSS', 'BB', 'DBB', 'DCB', 'MF'];
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const YEARS = [2024, 2025];

// Generate deterministic random numbers
let seed = 42;
const random = () => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(random() * arr.length)];

export const generateData = (count: number = 1500): OOHRecord[] => {
  const data: OOHRecord[] = [];
  
  for (let i = 0; i < count; i++) {
    const city = getRandomItem(CITIES);
    
    // Rough coordinates for Russia (very approximate clustering)
    let baseLat = 55.75;
    let baseLng = 37.61;
    
    if (city === 'Санкт-Петербург') { baseLat = 59.93; baseLng = 30.33; }
    if (city === 'Новосибирск') { baseLat = 55.00; baseLng = 82.93; }
    if (city === 'Екатеринбург') { baseLat = 56.83; baseLng = 60.60; }
    if (city === 'Казань') { baseLat = 55.78; baseLng = 49.12; }

    // Add some noise to coords
    const lat = baseLat + (random() - 0.5) * 0.5;
    const lng = baseLng + (random() - 0.5) * 0.8;

    data.push({
      id: `ID-${i}`,
      address: `Ул. Примерная ${Math.floor(random() * 100)}, Позиция ${Math.floor(random() * 50)}`,
      city,
      year: getRandomItem(YEARS),
      month: getRandomItem(MONTHS),
      vendor: getRandomItem(VENDORS),
      format: getRandomItem(FORMATS),
      grp: Number((random() * 8).toFixed(2)),
      ots: Number((random() * 150 + 10).toFixed(2)), // in thousands
      lat,
      lng,
    });
  }
  return data;
};

export const formatNumberRussian = (num: number, decimals = 2): string => {
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toString();
};