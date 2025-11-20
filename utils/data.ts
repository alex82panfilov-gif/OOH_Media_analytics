import { OOHRecord } from '../types';
import { parquetRead } from 'hyparquet';

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
  
  console.log("🚀 Загрузка данных...");

  const promises = FILE_LIST.map(async (filename) => {
    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) return []; // Если файла нет (404), просто выходим без ошибки

      const arrayBuffer = await response.arrayBuffer();
      
      return new Promise<OOHRecord[]>((resolve) => {
        parquetRead({
          file: arrayBuffer,
          onComplete: (rawData: any[]) => {
            if (!rawData || rawData.length === 0) { resolve([]); return; }

            const mapped = rawData.map((row, index) => {
              const vals = Array.isArray(row) ? row : Object.values(row);
              return {
                id: `ID-${index}-${Math.random()}`,
                address: String(vals[0] || ''),
                city: String(vals[5] || ''),
                year: Number(vals[4]) || 0,
                month: String(vals[8] || ''),
                vendor: String(vals[11] || ''),
                format: String(vals[14] || ''),
                grp: Number(vals[17]) || 0,
                ots: Number(vals[18]) || 0,
                // Колонка U (индекс 20). Если её нет (старый файл), будет пустая строка
                dateLabel: String(vals[20] || ''), 
                lat: parseCoord(vals[15] || 55.75),
                lng: parseCoord(vals[7] || 37.61),
              };
            });
            resolve(mapped);
          }
        });
      });
    } catch (e) { return []; }
  });

  const results = await Promise.all(promises);
  results.forEach(arr => allRecords.push(...arr));
  return allRecords;
};

const parseCoord = (val: any): number => {
  if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
  return Number(val);
};

// --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
// Добавили проверку: если num undefined или NaN, возвращаем '0'
export const formatNumberRussian = (num: number | undefined | null, decimals = 2): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toString();
};
