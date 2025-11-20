import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Treemap, LabelList 
} from 'recharts';
import { OOHRecord } from '../types';
import { formatNumberRussian } from '../utils/data';

interface ChartProps {
  data: OOHRecord[];
  onFilterClick?: (type: 'date' | 'format' | 'vendor', value: any) => void;
}

// Помощник для перевода месяцев в сокращенный вид и получения индекса для сортировки
const getMonthInfo = (monthStr: string) => {
  const m = monthStr.toLowerCase().trim();
  const map: Record<string, number> = {
    'январь': 0, 'янв': 0, '01': 0, '1': 0,
    'февраль': 1, 'фев': 1, '02': 1, '2': 1,
    'март': 2, 'мар': 2, '03': 2, '3': 2,
    'апрель': 3, 'апр': 3, '04': 3, '4': 3,
    'май': 4, '05': 4, '5': 4,
    'июнь': 5, 'июн': 5, '06': 5, '6': 5,
    'июль': 6, 'июл': 6, '07': 6, '7': 6,
    'август': 7, 'авг': 7, '08': 7, '8': 7,
    'сентябрь': 8, 'сен': 8, '09': 8, '9': 8,
    'октябрь': 9, 'окт': 9, '10': 9,
    'ноябрь': 10, 'ноя': 10, '11': 10,
    'декабрь': 11, 'дек': 11, '12': 11,
  };
  
  const shortNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  
  const index = map[m] !== undefined ? map[m] : -1;
  return {
    index,
    shortName: index >= 0 ? shortNames[index] : monthStr
  };
};

// --- 1. ГРАФИК ДИНАМИКИ (ИСПРАВЛЕННЫЙ) ---
export const TrendChart: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, { totalGrp: number; count: number; year: number; monthIdx: number; fullMonth: string }> = {};
    
    data.forEach(d => {
      // 1. Игнорируем столбец U. Собираем ключ сами из Года и Месяца.
      const { index: monthIdx, shortName } = getMonthInfo(d.month);
      
      // Уникальный ключ для группировки: "2024-0" (январь 2024)
      const sortKey = `${d.year}-${monthIdx}`;
      
      if (!grouped[sortKey]) {
        grouped[sortKey] = { 
          totalGrp: 0, 
          count: 0, 
          year: d.year, 
          monthIdx: monthIdx,
          fullMonth: d.month 
        };
      }
      grouped[sortKey].totalGrp += d.grp;
      grouped[sortKey].count += 1;
    });

    // 2. Превращаем в массив и сортируем
    return Object.values(grouped).map(item => ({
      // Формируем красивую подпись: "янв 2024"
      name: `${getMonthInfo(item.fullMonth).shortName} ${item.year}`,
      value: item.totalGrp / item.count,
      year: item.year,
      month: item.fullMonth,
      // Для сортировки используем числовое значение: год * 100 + месяц
      sortValue: item.year * 100 + item.monthIdx
    })).sort((a, b) => a.sortValue - b.sortValue);

  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Динамика среднего GRP</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const payload = e.activePayload[0].payload;
                if (onFilterClick) onFilterClick('date', { year: String(payload.year), month: payload.month });
              }
            }}
            className="cursor-pointer"
            // Добавляем отступы слева и справа, чтобы точки не обрезались
            margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              axisLine={false} 
              tickLine={false}
              angle={-30}
              textAnchor="end"
              height={50}
              // ВАЖНО: Отступ слева и справа внутри оси
              padding={{ left: 30, right: 30 }}
            />
            
            <Tooltip 
              formatter={(val: number) => [formatNumberRussian(val), 'Средний GRP']}
              labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#334155" 
              strokeWidth={3} 
              dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} 
              activeDot={{ r: 7, fill: '#334155' }}
            >
               {/* dy={-15} поднимает текст выше точки */}
               <LabelList 
                 dataKey="value" 
                 position="top" 
                 dy={-15} 
                 formatter={(val: number) => formatNumberRussian(val)} 
                 style={{ fontSize: '11px', fill: '#334155', fontWeight: 600 }} 
               />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- 2. ГРАФИК ФОРМАТОВ (Без изменений) ---
export const FormatBarChart: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, { totalGrp: number; count: number }> = {};
    data.forEach(d => {
      if (!grouped[d.format]) grouped[d.format] = { totalGrp: 0, count: 0 };
      grouped[d.format].totalGrp += d.grp;
      grouped[d.format].count += 1;
    });

    return Object.keys(grouped)
      .map(key => ({ name: key, value: grouped[key].totalGrp / grouped[key].count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Средний GRP по форматам</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            layout="vertical" 
            data={chartData} 
            margin={{ left: 20, right: 30 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                 if (onFilterClick) onFilterClick('format', e.activePayload[0].payload.name);
              }
            }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120} 
              tick={{ fontSize: 11, fill: '#4b5563' }} 
              axisLine={false} 
              tickLine={false} 
              interval={0}
            />
            <Tooltip formatter={(val: number) => formatNumberRussian(val)} cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="value" fill="#334155" radius={[0, 4, 4, 0]} barSize={24}>
              <LabelList dataKey="value" position="right" formatter={(val: number) => formatNumberRussian(val)} style={{ fontSize: '11px', fill: '#6b7280' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- 3. TREEMAP ПРОДАВЦОВ (ОБНОВЛЕННЫЙ: Градиент + Проценты) ---

// Палитра "Корпоративный синий/грифельный": от темного к светлому
// Самый крупный сегмент будет самым темным
const SHADES = [
  '#1e293b', // Slate 800 (Почти черный)
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#57534e', // Stone 600 (Для контраста)
  '#64748b', // Slate 500
  '#71717a', // Zinc 500
  '#94a3b8', // Slate 400 (Светлее)
  '#a1a1aa', // Zinc 400
];

export const VendorTreemap: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    let totalCount = 0;

    // 1. Считаем количество и общую сумму
    data.forEach(d => {
      if (!grouped[d.vendor]) grouped[d.vendor] = 0;
      grouped[d.vendor] += 1; 
      totalCount += 1;
    });

    // 2. Формируем массив с процентами и цветами
    return Object.keys(grouped)
      .map((key) => {
        const count = grouped[key];
        const percent = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';
        
        return { 
          name: key, 
          size: count,
          percent: percent // Добавляем поле процента в данные
        };
      })
      .sort((a, b) => b.size - a.size) // Сортируем от большего к меньшему
      .map((item, index) => ({
        ...item,
        // Назначаем цвет: чем выше в списке (больше доля), тем темнее цвет
        fill: SHADES[index % SHADES.length]
      }));
  }, [data]);

  // Кастомный блок внутри прямоугольника
  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size, percent, fill } = props;
    
    // Если прямоугольник слишком маленький, не рисуем текст
    if (width < 50 || height < 40) return null;
    
    return (
      <g>
        {/* Прямоугольник */}
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill} 
          stroke="#fff" 
          strokeWidth={2} 
          rx={4} // Скругление углов как на скриншоте
          ry={4}
        />
        {/* Название продавца */}
        <text 
          x={x + 8} 
          y={y + 20} 
          fill="#fff" 
          fontSize={12} 
          fontWeight="bold"
          style={{ pointerEvents: 'none' }} // Чтобы клик проходил сквозь текст
        >
          {name}
        </text>
        {/* Количество и процент */}
        <text 
          x={x + 8} 
          y={y + 38} 
          fill="rgba(255,255,255,0.8)" 
          fontSize={11}
          style={{ pointerEvents: 'none' }}
        >
          {size.toLocaleString('ru-RU')} шт. ({percent}%)
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Распределение по продавцам</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="size"
            stroke="#fff"
            content={<CustomContent />}
            onClick={(e) => {
              if (e && e.name) {
                 if (onFilterClick) onFilterClick('vendor', e.name);
              }
            }}
            className="cursor-pointer"
          >
            <Tooltip 
              // Кастомный тултип, чтобы показать проценты при наведении
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
                      <p className="font-bold text-gray-900 mb-1">{data.name}</p>
                      <p className="text-gray-600">Поверхностей: <span className="font-medium text-gray-900">{data.size.toLocaleString('ru-RU')}</span></p>
                      <p className="text-gray-600">Доля рынка: <span className="font-medium text-teal-600">{data.percent}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
