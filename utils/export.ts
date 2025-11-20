import * as XLSX from 'xlsx';
import { OOHRecord } from '../types';

// Функция экспорта в Excel с поддержкой двух листов
export const exportToExcel = (data: OOHRecord[], fileName: string = 'OOH_Analytics', includeDetails: boolean = true) => {
  if (!data || data.length === 0) return;

  // --- 1. РАСЧЕТ KPI ДЛЯ ЛИСТА "СВОДКА" ---
  const totalSurfaces = data.length;
  
  // Средний GRP
  const totalGrp = data.reduce((acc, curr) => acc + (curr.grp || 0), 0);
  const avgGrp = totalSurfaces > 0 ? totalGrp / totalSurfaces : 0;
  
  // Общий OTS
  const totalOts = data.reduce((acc, curr) => acc + (curr.ots || 0), 0);
  
  // Уникальные адреса
  const uniqueSurfaces = new Set(data.map(d => d.address)).size;
  
  // Digital (DOOH + MF)
  const digitalCount = data.filter(d => {
    const fmt = (d.format || '').toUpperCase();
    return fmt.startsWith('D') || fmt === 'MF';
  }).length;
  const digitalShare = totalSurfaces > 0 ? (digitalCount / totalSurfaces) * 100 : 0;

  // Выше среднего
  const highGrpCount = data.filter(d => d.grp > avgGrp).length;
  const highGrpShare = totalSurfaces > 0 ? (highGrpCount / totalSurfaces) * 100 : 0;

  // Данные для первого листа (Массив массивов)
  const summaryData = [
    ['ОТЧЕТ ПО OOH АНАЛИТИКЕ', ''],
    ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
    ['Режим отчета', includeDetails ? 'Полная детализация' : 'Только KPI (Сводка)'],
    ['', ''],
    ['ПОКАЗАТЕЛЬ', 'ЗНАЧЕНИЕ'],
    ['Средний GRP', avgGrp],
    ['Общий OTS', totalOts],
    ['Всего поверхностей (шт.)', totalSurfaces],
    ['Уникальных адресов', uniqueSurfaces],
    ['Цифровых поверхностей (шт.)', digitalCount],
    ['Доля Digital (%)', digitalShare],
    ['Поверхностей выше среднего GRP (%)', highGrpShare]
  ];

  // Создаем новую книгу Excel
  const workbook = XLSX.utils.book_new();

  // --- ЛИСТ 1: СВОДКА ---
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }]; // Ширина колонок
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Сводка KPI");

  // --- ЛИСТ 2: ДЕТАЛИЗАЦИЯ (ТОЛЬКО ЕСЛИ РАЗРЕШЕНО) ---
  if (includeDetails) {
    const detailsData = data.map(item => ({
      'Город': item.city,
      'Адрес': item.address,
      'Продавец': item.vendor,
      'Формат': item.format,
      'GRP': item.grp,
      'OTS': item.ots,
      'Год': item.year,
      'Месяц': item.month,
      'Широта': item.lat,
      'Долгота': item.lng,
    }));

    const wsDetails = XLSX.utils.json_to_sheet(detailsData);
    // Настройка ширины колонок
    wsDetails['!cols'] = [
      { wch: 15 }, // Город
      { wch: 40 }, // Адрес
      { wch: 20 }, // Продавец
      { wch: 15 }, // Формат
      { wch: 10 }, // GRP
      { wch: 12 }, // OTS
      { wch: 8 },  // Год
      { wch: 10 }, // Месяц
      { wch: 12 }, // Lat
      { wch: 12 }, // Lng
    ];
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Детализация");
  }

  // --- ГЕНЕРАЦИЯ ФАЙЛА ---
  const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  // Добавляем пометку в имя файла, полный он или нет
  const suffix = includeDetails ? 'Full' : 'KPI_Only';
  
  XLSX.writeFile(workbook, `${fileName}_${suffix}_${dateStr}.xlsx`);
};
