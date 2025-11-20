import { OOHRecord } from '../types';
import { parquetRead } from 'hyparquet';

// Список файлов. Если какого-то файла нет на сервере, скрипт теперь просто пропустит его.
const FILE_LIST = [
  '2024-01.parquet', '2024-02.parquet', '2024-03.parquet', '2024-04.parquet',
  '2024-05.parquet', '2024-06.parquet', '2024-07.parquet', '2024-08.parquet',
  '2024-09.parquet', '2024-10.parquet', '2024-11.parquet', '2024-12.parquet',
  '2025-01.parquet', '2025-02.parquet', '2025-03.parquet', '2025-04.parquet',
  '2025-05.parquet', '2025-06.parquet', '2025-07.parquet', '2025-08.parquet',
  '2025-09.parquet'
];

export const loadRealData = async (): Promise<OOHRecord[]> => {
  const allRecords: OOHRecord[] = [];
  if (typeof window === 'undefined') return [];
  
  console.log("🚀 Запуск безопасной загрузки данных...");

  // Используем map, чтобы запустить все запросы параллельно
  const promises = FILE_LIST.map(async (filename) => {
    try {
      const response = await fetch(`/data/${filename}`);
      
      // Если файл не найден (404) или это HTML (ошибка Vercel), пропускаем
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        console.warn(`⚠️ Пропуск файла (нет на сервере или ошибка): ${filename}`);
        return [];
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Дополнительная проверка: Parquet всегда начинается с 'PAR1'
      const textDecoder = new TextDecoder();
      const header = textDecoder.decode(arrayBuffer.slice(0, 4));
      if (header !== 'PAR1') {
        console.warn(`⚠️ Файл ${filename} поврежден или не является Parquet (Header: ${header})`);
        return [];
      }

      return new Promise<OOHRecord[]>((resolve) => {
        parquetRead({
          file: arrayBuffer,
          onComplete: (rawData: any[]) => {
            if (!rawData || rawData.length === 0) {
              resolve([]); 
              return;
            }

            // Вывод колонок для отладки (то, что я просил в Шаге 1)
            if (allRecords.length === 0) {
               console.log(`✅ УСПЕШНО ЧИТАЕМ ${filename}`);
               console.log("📋 КОЛОНКИ:", Object.keys(rawData[0]));
            }

            const mapped = rawData.map((row, index) => {
              // Функция-помощник: ищет значение, игнорируя регистр букв
              const findKey = (target: string) => {
                const key = Object.keys(row).find(k => k.toLowerCase().includes(target.toLowerCase()));
                return key ? row[key] : undefined;
              };

              return {
                id: `ID-${index}-${Math.random()}`,
                // Пытаемся найти по ключевым словам из вашего Excel
                address: String(findKey('Адрес') || findKey('Address') || ''),
                city: String(findKey('Город') || findKey('City') || ''),
                year: Number(findKey('Год') || findKey('Year')) || 0,
                month: String(findKey('Месяц') || findKey('Month') || ''),
                vendor: String(findKey('Продавец') || findKey('Vendor') || ''),
                format: String(findKey('Формат') || findKey('Format') || ''),
                
                grp: Number(findKey('GRP') || 0),
                ots: Number(findKey('OTS') || 0),
                
                // Для координат ищем "Широта"/"Lat"
                lat: parseCoord(findKey('Широта') || findKey('Lat') || 55.75),
                lng: parseCoord(findKey('Долгота') || findKey('Lon') || 37.61),
              };
            });
            resolve(mapped);
          }
        });
      });
    } catch (e) {
      console.error(`❌ Ошибка обработки ${filename}:`, e);
      return []; // Возвращаем пустой массив, чтобы не ломать остальные файлы
    }
  });

  // Ждем завершения всех загрузок (даже если были ошибки)
  const results = await Promise.all(promises);
  
  // Собираем всё в одну кучу
  results.forEach(arr => allRecords.push(...arr));

  console.log(`🏁 ИТОГО: Загружено ${allRecords.length} строк из ${results.filter(r => r.length > 0).length} файлов.`);
  return allRecords;
};

// Помощник для координат (заменяет запятую на точку)
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
