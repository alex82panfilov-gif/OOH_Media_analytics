import React, { useState, useMemo, useEffect } from 'react';
import { OOHRecord, FilterState, TabView } from './types';
import { loadRealData, formatNumberRussian, formatCompactRussian } from './utils/data';
import { TrendChart, FormatBarChart, VendorTreemap } from './components/Charts';
import { MapViz } from './components/MapViz';
import { Loader2, AlertTriangle } from 'lucide-react';

// --- COMPONENTS ---
const KPI_CARD_CLASS = "bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-32 transition-all hover:shadow-md";

const KPICard = ({ label, value, subtext }: { label: string; value: string; subtext?: string }) => (
  <div className={KPI_CARD_CLASS}>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
    {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
  </div>
);

const FilterDropdown = ({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onChange: (v: string) => void 
}) => (
  <div className="flex flex-col min-w-[140px] w-full sm:w-auto">
    <label className="text-xs text-gray-500 mb-1 ml-1 font-medium">{label}</label>
    <select
      className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm bg-white border h-10"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="Все">Все</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.ANALYTICS);
  const [data, setData] = useState<OOHRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const records = await loadRealData();
        setData(records);
      } catch (err: any) {
        console.error("CRITICAL ERROR:", err);
        setError(err.message || "Произошла неизвестная ошибка при загрузке данных");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    city: 'Все', year: 'Все', month: 'Все', format: 'Все', vendor: 'Все',
  });

  const options = useMemo(() => {
    if (data.length === 0) return { cities: [], years: [], months: [], formats: [], vendors: [] };
    return {
      cities: Array.from(new Set(data.map(d => d.city))).sort(),
      years: Array.from(new Set(data.map(d => d.year.toString()))).sort(),
      months: Array.from(new Set(data.map(d => d.month))), 
      formats: Array.from(new Set(data.map(d => d.format))).sort(),
      vendors: Array.from(new Set(data.map(d => d.vendor))).sort(),
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (filters.city !== 'Все' && d.city !== filters.city) return false;
      if (filters.year !== 'Все' && d.year.toString() !== filters.year) return false;
      if (filters.month !== 'Все' && d.month !== filters.month) return false;
      if (filters.format !== 'Все' && d.format !== filters.format) return false;
      if (filters.vendor !== 'Все' && d.vendor !== filters.vendor) return false;
      return true;
    });
  }, [data, filters]);

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0, percentHighGrp: 0 };
    const totalGrp = filteredData.reduce((acc, curr) => acc + curr.grp, 0);
    const avgGrp = totalGrp / filteredData.length;
    const totalOts = filteredData.reduce((acc, curr) => acc + curr.ots, 0); 
    const uniqueSurfaces = new Set(filteredData.map(d => d.address)).size; 
    const highGrpCount = filteredData.filter(d => d.grp > avgGrp).length;
    const percentHighGrp = (highGrpCount / filteredData.length) * 100;
    return { avgGrp, totalOts, uniqueSurfaces, percentHighGrp };
  }, [filteredData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- ЭКРАН ОШИБКИ ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800">Ошибка загрузки</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm bg-gray-100 p-4 rounded text-gray-700 font-mono break-all">
            Совет: Откройте консоль браузера (F12), чтобы увидеть детали. <br/>
            Убедитесь, что файлы в папке public/data называются на английском (2024-01.parquet).
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 w-full"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ЗАГРУЗКИ ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="text-gray-600 font-medium">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-200 z-20 sticky top-0">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">OOH Media Analytics</h1>
            <div className="flex gap-4">
                <button onClick={() => setActiveTab(TabView.ANALYTICS)} className={`px-6 py-3 rounded-lg text-lg font-bold transition-all border-2 ${activeTab === TabView.ANALYTICS ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200'}`}>Analytics</button>
                <button onClick={() => setActiveTab(TabView.MAP)} className={`px-6 py-3 rounded-lg text-lg font-bold transition-all border-2 ${activeTab === TabView.MAP ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200'}`}>Map</button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex flex-wrap gap-4 items-end p-1">
           <FilterDropdown label="Город" value={filters.city} options={options.cities} onChange={(v) => handleFilterChange('city', v)} />
           <FilterDropdown label="Год" value={filters.year} options={options.years} onChange={(v) => handleFilterChange('year', v)} />
           <FilterDropdown label="Месяц" value={filters.month} options={options.months} onChange={(v) => handleFilterChange('month', v)} />
           <FilterDropdown label="Формат" value={filters.format} options={options.formats} onChange={(v) => handleFilterChange('format', v)} />
           <FilterDropdown label="Продавец" value={filters.vendor} options={options.vendors} onChange={(v) => handleFilterChange('vendor', v)} />
           <button onClick={() => setFilters({city: 'Все', year: 'Все', month: 'Все', format: 'Все', vendor: 'Все'})} className="ml-auto mb-1 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md">Сбросить</button>
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-grow p-6 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard value={formatNumberRussian(kpis.avgGrp)} label="Средний GRP" />
          <KPICard value={`${formatCompactRussian(kpis.totalOts * 1000)}`} label="Общий OTS" subtext="человек" />
          <KPICard value={`${kpis.uniqueSurfaces.toLocaleString('ru-RU')}`} label="Уникальные поверхности" />
          <KPICard value={`${Math.round(kpis.percentHighGrp)}%`} label="% конструкций выше среднего GRP" />
        </div>

        {activeTab === TabView.ANALYTICS && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] lg:h-[350px]">
              <div className="lg:col-span-2 h-full"><TrendChart data={filteredData} /></div>
              <div className="h-full"><FormatBarChart data={filteredData} /></div>
            </div>
            <div className="w-full"><VendorTreemap data={filteredData} /></div>
          </div>
        )}

        {activeTab === TabView.MAP && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <MapViz data={filteredData} />
             <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50"><h3 className="text-sm font-medium text-gray-700">Детализация</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Продавец</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Формат</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GRP</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">OTS</th></tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.slice(0, 20).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 text-xs text-gray-900">{record.city}</td>
                        <td className="px-6 py-2 text-xs text-gray-500 truncate max-w-xs" title={record.address}>{record.address}</td>
                        <td className="px-6 py-2 text-xs text-gray-500">{record.vendor}</td>
                        <td className="px-6 py-2 text-xs text-gray-500">{record.format}</td>
                        <td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.grp)}</td>
                        <td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.ots)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
