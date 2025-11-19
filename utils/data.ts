import { OOHRecord } from '../types';
import { parquetRead } from 'hyparquet';

// Список файлов (убедитесь, что они так называются на GitHub в public/data)
const FILE_LIST = [
  '2024-01.parquet', '2024-02.parquet', '2024-03.parquet', '2024-04.parquet',
  '2024-05.parquet', '2024-06.parquet', '2024-07.parquet', '2024-08.parquet',
  '2024-09.parquet', '2024-10.parquet', '2024-11.parquet', '2024-12.parquet',
  '2025-01.parquet',
];

export const loadRealData = async (): Promise<OOHRecord[]> => {
  const allRecords: OOHRecord[] = [];
  
  if (typeof window === 'undefined') return [];
  console.log("🚀 Начинаю загрузку данных...");

  const promises = FILE_LIST.map(async (filename) => {
    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) return [];
      
      const arrayBuffer = await response.arrayBuffer();
      
      return new Promise<OOHRecord[]>((resolve) => {
        try {
          parquetRead({
            file: arrayBuffer,
            onComplete: (rawData: any[]) => {
              if (rawData.length === 0) {
                resolve([]);
                return;
              }

              // --- РЕЖИМ ОТЛАДКИ: ВЫВОДИМ ПЕРВУЮ СТРОКУ В КОНСОЛЬ ---
              // Это покажет нам реальные названия колонок
              if (allRecords.length === 0) {
                 console.log(`🔥 ЧИТАЕМ ФАЙЛ ${filename}`);
                 console.log("🔥 РЕАЛЬНЫЕ КОЛОНКИ В ФАЙЛЕ:", Object.keys(rawData[0]));
                 console.log("🔥 ПРИМЕР ДАННЫХ:", rawData[0]);
              }
              // ------------------------------------------------------

              const mappedData = rawData.map((row, index) => {
                // Пытаемся найти поле, даже если название отличается регистром
                const getVal = (key: string) => row[key]; 

                return {
                  id: `ID-${index}-${Math.random()}`,
                  // ВАЖНО: Проверьте консоль, чтобы узнать точные ключи!
                  address: String(getVal('Адрес в системе Admetrix') || getVal('Address') || getVal('Адрес') || ''),
                  city: String(getVal('Город') || getVal('City') || ''),
                  year: Number(getVal('Год') || getVal('Year')) || 0,
                  month: String(getVal('Месяц') || getVal('Month') || ''),
                  vendor: String(getVal('Продавец') || getVal('Vendor') || ''),
                  format: String(getVal('Формат поверхности') || getVal('Format') || ''),
                  
                  grp: Number(getVal('GRP (18+) в сутки') || getVal('GRP') || 0),
                  ots: Number(getVal('OTS (18+) тыс.чел. в сутки') || getVal('OTS') || 0),
                  
                  lat: typeof getVal('Широта') === 'string' 
                       ? parseFloat(getVal('Широта').replace(',', '.')) 
                       : Number(getVal('Широта')) || 55.75,
                  lng: typeof getVal('Долгота') === 'string' 
                       ? parseFloat(getVal('Долгота').replace(',', '.')) 
                       : Number(getVal('Долгота')) || 37.61,
                };
              });
              resolve(mappedData);
            }
          });
        } catch (e) {
          console.error("Ошибка парсинга:", e);
          resolve([]);
        }
      });
    } catch (e) {
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach(arr => allRecords.push(...arr));
  console.log(`✅ Итого загружено: ${allRecords.length} строк`);
  return allRecords;
};

export const formatNumberRussian = (num: number, decimals = 2): string => {
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toString();
};
