import { OOHRecord } from '../types';
import { parquetRead } from 'hyparquet';

// ОБНОВЛЕННЫЙ СПИСОК: Добавил октябрь, ноябрь и декабрь 2025
const FILE_LIST = [
  '2024-01.parquet', '2024-02.parquet', '2024-03.parquet', '2024-04.parquet',
  '2024-05.parquet', '2024-06.parquet', '2024-07.parquet', '2024-08.parquet',
  '2024-09.parquet', '2024-10.parquet', '2024-11.parquet', '2024-12.parquet',
  '2025-01.parquet', '2025-02.parquet', '2025-03.parquet', '2025-04.parquet',
  '2025-05.parquet', '2025-06.parquet', '2025-07.parquet', '2025-08.parquet',
  '2025-09.parquet', '2025-10.parquet', '2025-11.parquet', '2025-12.parquet'
];

export const loadRealData = async (): Promise<OOHRecord[]> => {
  const allRecords: OOHRecord[] = [];
  if (typeof window === 'undefined') return [];
  
  console.log("🚀 Загрузка данных по индексам колонок...");

  const promises = FILE_LIST.map(async (filename) => {
    try {
      const response = await fetch(`/data/${filename}`);
      
      if (!response.ok) {
        // Тихая проверка: если файла нет, просто пропускаем
        return [];
      }

      const arrayBuffer = await response.arrayBuffer();
      
      return new Promise<OOHRecord[]>((resolve) => {
        parquetRead({
          file: arrayBuffer,
          onComplete: (rawData: any[]) => {
            if (!rawData || rawData.length === 0) {
              resolve([]); 
              return;
            }

            const mapped = rawData.map((row, index) => {
              // Маппинг по индексам (0=A, 1=B и т.д.)
              const vals = Array.isArray(row) ? row : Object.values(row);

              return {
                id: `ID-${index}-${Math.random()}`,
                
                // 0 = A (Адрес)
                address: String(vals[0] || ''),
                // 5 = F (Город)
                city: String(vals[5] || ''),
                // 4 = E (Год)
                year: Number(vals[4]) || 0,
                // 8 = I (Месяц)
                month: String(vals[8] || ''),
                // 11 = L (Продавец)
                vendor: String(vals[11] || ''),
                // 14 = O (Формат)
                format: String(vals[14] || ''),
                // 17 = R (GRP)
                grp: Number(vals[17]) || 0,
                // 18 = S (OTS)
                ots: Number(vals[18]) || 0,
                // 15 = P (Широта), 7 = H (Долгота)
                lat: parseCoord(vals[15] || 55.75),
                lng: parseCoord(vals[7] || 37.61),
              };
            });
            resolve(mapped);
          }
        });
      });
    } catch (e) {
      console.error(`❌ Ошибка ${filename}:`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach(arr => allRecords.push(...arr));

  console.log(`🏁 ИТОГО: Загружено ${allRecords.length} строк.`);
  return allRecords;
};

const parseCoord = (val: any): number => {
  if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
  return Number(val);
};

export const formatNumberRussian = (num: number, decimals = 2): string => {
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toString();
};
