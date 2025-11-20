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

// --- 1. ГРАФИК ДИНАМИКИ ---
export const TrendChart: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, { totalGrp: number; count: number; year: number; month: string }> = {};
    
    data.forEach(d => {
      // Если dateLabel пустой (старый файл), называем точку "Без даты" или берем из года/месяца
      const label = d.dateLabel || `${d.month} ${d.year}`;
      
      if (!grouped[label]) {
        grouped[label] = { totalGrp: 0, count: 0, year: d.year, month: d.month };
      }
      grouped[label].totalGrp += d.grp;
      grouped[label].count += 1;
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key].totalGrp / grouped[key].count,
      year: grouped[key].year,
      month: grouped[key].month
    })).sort((a, b) => {
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

// --- 3. TREEMAP ПРОДАВЦОВ ---
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

export const VendorTreemap: React.FC<ChartProps> = ({ data, onFilterClick }) => {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(d => {
      if (!grouped[d.vendor]) grouped[d.vendor] = 0;
      grouped[d.vendor] += 1; 
    });

    return Object.keys(grouped)
      .map((key, index) => ({ 
        name: key, 
        size: grouped[key], 
        fill: COLORS[index % COLORS.length] 
      }))
      .sort((a, b) => b.size - a.size);
  }, [data]);

  const CustomContent = (props: any) => {
    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Иногда Recharts передает данные в 'value', а не в 'size'.
    // Мы берем то, что есть, и добавляем || 0, чтобы toLocaleString не упал.
    const { x, y, width, height, name, size, value } = props;
    const displayValue = size || value || 0;
    
    if (width < 40 || height < 40) return null;
    
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={props.fill} stroke="#fff" strokeWidth={2} />
        <text x={x + 6} y={y + 18} fill="#fff" fontSize={12} fontWeight="bold">{name}</text>
        <text x={x + 6} y={y + 34} fill="rgba(255,255,255,0.9)" fontSize={10}>
          {displayValue.toLocaleString('ru-RU')} шт.
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
