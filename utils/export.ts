import * as XLSX from 'xlsx';
import { OOHRecord } from '../types';

// Помощник для сортировки месяцев
const getMonthIndex = (monthStr: string) => {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const m = monthStr.toLowerCase().slice(0, 3);
  return months.findIndex(x => x === m);
};

export const exportToExcel = (data: OOHRecord[], fileName: string = 'OOH_Analytics', includeDetails: boolean = true) => {
  if (!data || data.length === 0) return;

  // --- 1. ПОДГОТОВКА ДАННЫХ (АГРЕГАЦИЯ) ---
  
  // Переменные для общих KPI
  let totalGrp = 0;
  let totalOts = 0;
  const uniqueAddresses = new Set<string>();
  let digitalCount = 0;
  
  // Агрегаторы для таблиц
  const dynamicsMap: Record<string, { grpSum: number, count: number, year: number, month: string }> = {};
  const formatMap: Record<string, { grpSum: number, count: number }> = {};
  const vendorMap: Record<string, number> = {};

  // ПРОХОДИМ ПО ДАННЫМ ОДИН РАЗ (для скорости)
  data.forEach(d => {
    // 1. Общие KPI
    totalGrp += d.grp || 0;
    totalOts += d.ots || 0;
    uniqueAddresses.add(d.address);
    
    const fmtUpper = (d.format || '').toUpperCase();
    if (fmtUpper.startsWith('D') || fmtUpper === 'MF') {
      digitalCount++;
    }

    // 2. Для динамики (Ключ: Год-Месяц)
    const dynKey = `${d.year}-${d.month}`;
    if (!dynamicsMap[dynKey]) {
      dynamicsMap[dynKey] = { grpSum: 0, count: 0, year: d.year, month: d.month };
    }
    dynamicsMap[dynKey].grpSum += d.grp;
    dynamicsMap[dynKey].count += 1;

    // 3. Для форматов
    const fmt = (d.format || 'Не указан').trim();
    if (!formatMap[fmt]) {
      formatMap[fmt] = { grpSum: 0, count: 0 };
    }
    formatMap[fmt].grpSum += d.grp;
    formatMap[fmt].count += 1;

    // 4. Для продавцов
    const vnd = (d.vendor || 'Неизвестный').trim();
    if (!vendorMap[vnd]) vendorMap[vnd] = 0;
    vendorMap[vnd] += 1;
  });

  // --- РАСЧЕТЫ И СОРТИРОВКА ---

  const totalSurfaces = data.length;
  const avgGrp = totalSurfaces > 0 ? totalGrp / totalSurfaces : 0;
  const digitalShare = totalSurfaces > 0 ? (digitalCount / totalSurfaces) * 100 : 0;
  const highGrpCount = data.filter(d => d.grp > avgGrp).length;
  const highGrpShare = totalSurfaces > 0 ? (highGrpCount / totalSurfaces) * 100 : 0;

  // 1. Таблица Динамики
  const dynamicsArray = Object.values(dynamicsMap)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    })
    .map(item => [
      item.year, 
      item.month, 
      item.grpSum / item.count // Средний GRP
    ]);

  // 2. Таблица Форматов
  const formatsArray = Object.keys(formatMap)
    .map(key => [
      key, 
      formatMap[key].grpSum / formatMap[key].count // Средний GRP
    ])
    .sort((a, b) => (b[1] as number) - (a[1] as number)); // Сортировка по убыванию GRP

  // 3. Таблица Продавцов
  const vendorsArray = Object.keys(vendorMap)
    .map(key => [
      key, 
      vendorMap[key], // Кол-во
      (vendorMap[key] / totalSurfaces) * 100 // Доля %
    ])
    .sort((a, b) => (b[1] as number) - (a[1] as number)); // Сортировка по кол-ву

  // --- ФОРМИРОВАНИЕ ЛИСТА "СВОДКА" ---
  
  const summaryData: any[][] = [
    ['ОТЧЕТ ПО OOH АНАЛИТИКЕ'],
    ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
    ['Режим', includeDetails ? 'Полная выгрузка' : 'Только сводка'],
    [], // Пустая строка
    ['ОСНОВНЫЕ KPI', ''],
    ['Средний GRP', avgGrp],
    ['Общий OTS', totalOts],
    ['Всего поверхностей', totalSurfaces],
    ['Уникальных адресов', uniqueAddresses.size],
    ['Цифровых (DOOH)', digitalCount],
    ['Доля Digital (%)', digitalShare],
    ['Выше среднего (%)', highGrpShare],
    [], [], // Отступ
    
    // БЛОК 1: ДИНАМИКА
    ['ДИНАМИКА СРЕДНЕГО GRP', '', ''],
    ['Год', 'Месяц', 'Средний GRP'],
    ...dynamicsArray,
    [], [],
    
    // БЛОК 2: ФОРМАТЫ
    ['СРЕДНИЙ GRP ПО ФОРМАТАМ', ''],
    ['Формат', 'Средний GRP'],
    ...formatsArray,
    [], [],
    
    // БЛОК 3: ПРОДАВЦЫ
    ['РАСПРЕДЕЛЕНИЕ ПО ПРОДАВЦАМ', '', ''],
    ['Продавец', 'Кол-во сторон', 'Доля (%)'],
    ...vendorsArray
  ];

  const workbook = XLSX.utils.book_new();

  // Лист 1: Сводка
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  // Настраиваем ширину колонок (для красоты)
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Сводка KPI");

  // --- ФОРМИРОВАНИЕ ЛИСТА "ДЕТАЛИЗАЦИЯ" ---
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
    wsDetails['!cols'] = [
      { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
      { wch: 12 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Детализация");
  }

  // ГЕНЕРАЦИЯ ФАЙЛА
  const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  const suffix = includeDetails ? 'Full' : 'KPI_Only';
  XLSX.writeFile(workbook, `${fileName}_${suffix}_${dateStr}.xlsx`);
};
