import { OOHRecord } from '../types';
import { parquetRead } from 'hyparquet';

// Список файлов, которые мы ожидаем найти в папке public/data
// Если появятся новые месяцы, просто добавьте их сюда или сделайте генератор имен
const FILE_LIST = [
  'final_OOH_январь_2024.parquet',
  'final_OOH_февраль_2024.parquet',
  'final_OOH_март_2024.parquet',
  'final_OOH_апрель_2024.parquet',
  'final_OOH_май_2024.parquet',
  'final_OOH_июнь_2024.parquet',
  'final_OOH_июль_2024.parquet',
  'final_OOH_август_2024.parquet',
  'final_OOH_сентябрь_2024.parquet',
  'final_OOH_октябрь_2024.parquet',
  'final_OOH_ноябрь_2024.parquet',
  'final_OOH_декабрь_2024.parquet',
  'final_OOH_январь_2025.parquet',
  // Добавьте 2025 год по аналогии, если файлы есть
];

export const loadRealData = async (): Promise<OOHRecord[]> => {
  const allRecords: OOHRecord[] = [];
  
  console.log("Начинаю загрузку Parquet файлов...");

  const promises = FILE_LIST.map(async (filename) => {
    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) {
        console.warn(`Файл не найден или ошибка сети: ${filename}`);
        return [];
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      return new Promise<OOHRecord[]>((resolve) => {
        parquetRead({
          file: arrayBuffer,
          onComplete: (rawData: any[]) => {
            // Преобразуем сырые данные (с русскими ключами) в наш формат OOHRecord
            const mappedData = rawData.map((row, index) => ({
              id: `ID-${index}-${Math.random()}`, // Генерируем уникальный ID
              address: String(row['Адрес в системе Admetrix'] || row['Адрес'] || ''),
              city: String(row['Город'] || ''),
              year: Number(row['Год']) || 0,
              month: String(row['Месяц'] || ''),
              vendor: String(row['Продавец'] || ''),
              format: String(row['Формат поверхности'] || ''),
              grp: Number(row['GRP (18+) в сутки']) || 0,
              ots: Number(row['OTS (18+) тыс.чел. в сутки']) || 0,
              // Если в parquet широта/долгота записаны с запятой (как текст), заменяем на точку
              lat: typeof row['Широта'] === 'string' 
                   ? parseFloat(row['Широта'].replace(',', '.')) 
                   : Number(row['Широта']) || 55.75,
              lng: typeof row['Долгота'] === 'string' 
                   ? parseFloat(row['Долгота'].replace(',', '.')) 
                   : Number(row['Долгота']) || 37.61,
            }));
            resolve(mappedData);
          }
        });
      });
    } catch (e) {
      console.error(`Ошибка при чтении файла ${filename}:`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  
  // Объединяем все массивы в один
  results.forEach(arr => allRecords.push(...arr));
  
  console.log(`Всего загружено записей: ${allRecords.length}`);
  return allRecords;
};

// Вспомогательные функции форматирования оставляем как были
export const formatNumberRussian = (num: number, decimals = 2): string => {
  return num.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatCompactRussian = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  if (num >= 1000) return `${(num / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
  return num.toString();
};
