import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Treemap, LabelList 
} from 'recharts';
import { OOHRecord } from '../types';
import { formatNumberRussian } from '../utils/data';

interface ChartProps {
  data: OOHRecord[];
  // Добавляем функцию для кликов по графику
  onFilterClick?: (type: 'date' | 'format' | 'vendor', value: any) => void;
}

// --- 1. ГРАФИК ДИНАМИКИ (TREMD) ---
export const TrendChart: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    // Группируем по dateLabel ("окт 2025")
    const grouped: Record<string, { totalGrp: number; count: number; sortKey: number; year: number; month: string }> = {};
    
    data.forEach(d => {
      if (!grouped[d.dateLabel]) {
        // Создаем ключ для сортировки: 2025 * 100 + месяц (нужна логика парсинга, но
        // проще взять d.year и d.month для передачи в клик)
        grouped[d.dateLabel] = { totalGrp: 0, count: 0, sortKey: d.year * 100, year: d.year, month: d.month };
      }
      grouped[d.dateLabel].totalGrp += d.grp;
      grouped[d.dateLabel].count += 1;
      
      // Хак для сортировки: если месяц текстом, сложно сортировать. 
      // В идеале dateLabel должен быть сортируемым, но положимся на порядок в Excel или добавим логику
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key].totalGrp / grouped[key].count,
      year: grouped[key].year,
      month: grouped[key].month
    })).sort((a, b) => {
       // Простая сортировка может быть не идеальной для текста, 
       // но если Excel дает их по порядку, график построится.
       // Для надежности лучше использовать d.year/d.month для сортировки.
       const monthsOrder = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
       const getMIdx = (m: string) => monthsOrder.findIndex(mo => m.toLowerCase().includes(mo));
       
       if (a.year !== b.year) return a.year - b.year;
       return getMIdx(a.month) - getMIdx(b.month);
    });
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
            />
            {/* УБРАЛИ YAxis, как вы просили */}
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
               <LabelList dataKey="value" position="top" formatter={(val: number) => formatNumberRussian(val)} style={{ fontSize: '11px', fill: '#334155', fontWeight: 500 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- 2. ГРАФИК ФОРМАТОВ ---
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
            margin={{ left: 20, right: 30 }} // Отступы
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                 if (onFilterClick) onFilterClick('format', e.activePayload[0].payload.name);
              }
            }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            {/* УВЕЛИЧИЛИ width до 120, чтобы названия влезали */}
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120} 
              tick={{ fontSize: 11, fill: '#4b5563' }} 
              axisLine={false} 
              tickLine={false} 
              interval={0} // Показать ВСЕ подписи
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

// --- 3. TREEMAP ПРОДАВЦОВ (ТЕПЕРЬ ПО КОЛИЧЕСТВУ) ---
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

export const VendorTreemap: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(d => {
      if (!grouped[d.vendor]) grouped[d.vendor] = 0;
      // ТЕПЕРЬ СЧИТАЕМ КОЛИЧЕСТВО ПОВЕРХНОСТЕЙ (Count), А НЕ OTS
      grouped[d.vendor] += 1; 
    });

    return Object.keys(grouped)
      .map((key, index) => ({ 
        name: key, 
        size: grouped[key], // Размер квадрата = кол-во поверхностей
        fill: COLORS[index % COLORS.length] 
      }))
      .sort((a, b) => b.size - a.size);
  }, [data]);

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size } = props;
    if (width < 40 || height < 40) return null; // Скрываем мелкие подписи
    
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={props.fill} stroke="#fff" strokeWidth={2} />
        <text x={x + 6} y={y + 18} fill="#fff" fontSize={12} fontWeight="bold">{name}</text>
        <text x={x + 6} y={y + 34} fill="rgba(255,255,255,0.9)" fontSize={10}>
          {size.toLocaleString('ru-RU')} шт.
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Распределение по продавцам (кол-во поверхностей)</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="size"
            stroke="#fff"
            fill="#8884d8"
            content={<CustomContent />}
            onClick={(e) => {
              if (e && e.name) {
                 if (onFilterClick) onFilterClick('vendor', e.name);
              }
            }}
            className="cursor-pointer"
          >
            <Tooltip 
              formatter={(val: number) => [val.toLocaleString('ru-RU') + ' шт.', 'Поверхностей']}
              contentStyle={{ borderRadius: '8px', border: 'none', padding: '8px 12px' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
