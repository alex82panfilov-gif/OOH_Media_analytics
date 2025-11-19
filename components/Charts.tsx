import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Treemap, Cell, LabelList
} from 'recharts';
import { OOHRecord } from '../types';

// --- TREND CHART ---
interface TrendChartProps {
  data: OOHRecord[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  // Aggregate data by Month-Year
  const aggregated = React.useMemo(() => {
    const map = new Map<string, { name: string; totalGrp: number; count: number; sortIndex: number }>();
    
    const monthOrder = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    
    data.forEach(d => {
      const key = `${d.month} ${d.year}`;
      const current = map.get(key) || { name: key, totalGrp: 0, count: 0, sortIndex: 0 };
      
      // Create a sort index: Year * 100 + MonthIndex
      const mIndex = monthOrder.indexOf(d.month);
      current.sortIndex = d.year * 100 + mIndex;
      
      current.totalGrp += d.grp;
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map(item => ({
        name: item.name,
        avgGrp: Number((item.totalGrp / item.count).toFixed(2)),
        sortIndex: item.sortIndex
      }))
      .sort((a, b) => a.sortIndex - b.sortIndex);
  }, [data]);

  return (
    <div className="h-full w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-4">Динамика среднего GRP по месяцам</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={aggregated} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fill: '#6b7280' }} 
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis 
            hide={false} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            label={{ value: 'Средний GRP', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="avgGrp" 
            stroke="#374151" 
            strokeWidth={2} 
            dot={{ r: 4, fill: 'white', stroke: '#374151', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          >
             <LabelList dataKey="avgGrp" position="top" offset={10} style={{ fontSize: 10, fill: '#4b5563' }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- BAR CHART ---
interface BarChartProps {
  data: OOHRecord[];
}

export const FormatBarChart: React.FC<BarChartProps> = ({ data }) => {
  const aggregated = React.useMemo(() => {
    const map = new Map<string, { format: string; totalGrp: number; count: number }>();
    data.forEach(d => {
      const current = map.get(d.format) || { format: d.format, totalGrp: 0, count: 0 };
      current.totalGrp += d.grp;
      current.count += 1;
      map.set(d.format, current);
    });
    return Array.from(map.values())
      .map(item => ({
        name: item.format,
        value: Number((item.totalGrp / item.count).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value); // Descending
  }, [data]);

  return (
    <div className="h-full w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">
       <h3 className="text-sm font-medium text-gray-600 mb-4">Средний GRP по форматам</h3>
       <ResponsiveContainer width="100%" height={250}>
         <BarChart layout="vertical" data={aggregated} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb"/>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 11, fill: '#374151' }} 
              width={40} 
              axisLine={false} 
              tickLine={false}
            />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="value" fill="#374151" radius={[0, 4, 4, 0]} barSize={20}>
              <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#374151' }} />
            </Bar>
         </BarChart>
       </ResponsiveContainer>
    </div>
  );
};

// --- TREEMAP ---
interface VendorTreemapProps {
  data: OOHRecord[];
}

const COLORS = ['#0078d4', '#107c10', '#d13438', '#881798', '#e3008c', '#00bcf2', '#ff8c00'];

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, index } = props;
  if (width < 50 || height < 30) return null; // Hide small labels

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      <text
        x={x + 5}
        y={y + 15}
        textAnchor="start"
        fill="#fff"
        fontSize={12}
        fontWeight="bold"
      >
        {name}
      </text>
      <text
        x={x + 5}
        y={y + height - 5}
        textAnchor="start"
        fill="rgba(255,255,255,0.9)"
        fontSize={10}
      >
        {Number(value).toLocaleString('ru-RU')} тыс.
      </text>
    </g>
  );
};

export const VendorTreemap: React.FC<VendorTreemapProps> = ({ data }) => {
  const aggregated = React.useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      const current = map.get(d.vendor) || 0;
      map.set(d.vendor, current + d.ots);
    });
    
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Распределение по продавцам (OTS)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <Treemap
          data={aggregated}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CustomTreemapContent />}
        >
          <Tooltip formatter={(value) => `${Number(value).toLocaleString('ru-RU')} тыс.`} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};