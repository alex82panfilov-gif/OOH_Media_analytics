import React, { useState, useMemo, useEffect } from 'react';
import { OOHRecord, FilterState, TabView } from './types';
// Импортируем новую функцию загрузки
import { loadRealData, formatNumberRussian, formatCompactRussian } from './utils/data';
import { TrendChart, FormatBarChart, VendorTreemap } from './components/Charts';
import { MapViz } from './components/MapViz';
import { Loader2 } from 'lucide-react'; // Иконка загрузки

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
  
  // State для данных и загрузки
  const [data, setData] = useState<OOHRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Загружаем данные при старте
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const records = await loadRealData();
        setData(records);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    city: 'Все',
    year: 'Все',
    month: 'Все',
    format: 'Все',
    vendor: 'Все',
  });

  // Derive Unique Options
  const options = useMemo(() => {
    // Если данных нет, возвращаем пустые списки
    if (data.length === 0) return { cities: [], years: [], months: [], formats: [], vendors: [] };

    return {
      cities: Array.from(new Set(data.map(d => d.city))).sort(),
      years: Array.from(new Set(data.map(d => d.year.toString()))).sort(),
      months: Array.from(new Set(data.map(d => d.month))), 
      formats: Array.from(new Set(data.map(d => d.format))).sort(),
      vendors: Array.from(new Set(data.map(d => d.vendor))).sort(),
    };
  }, [data]);

  // Filter Data
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

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgGrp: 0, totalOts: 0, uniqueSurfaces: 0, percentHighGrp: 0 };
    }
    const totalGrp = filteredData.reduce((acc, curr) => acc + curr.grp, 0);
    const avgGrp = totalGrp / filteredData.length;
    const totalOts = filteredData.reduce((acc, curr) => acc + curr.ots, 0); 
    
    // Используем Set по адресу или ID для уникальности
    const uniqueSurfaces = new Set(filteredData.map(d => d.address)).size; 
    
    const highGrpCount = filteredData.filter(d => d.grp > avgGrp).length;
    const percentHighGrp = (highGrpCount / filteredData.length) * 100;

    return { avgGrp, totalOts, uniqueSurfaces, percentHighGrp };
  }, [filteredData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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
      
      {/* TOP NAVIGATION HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-200 z-20 sticky top-0">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              OOH Media Analytics
            </h1>
            
            <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab(TabView.ANALYTICS)}
                  className={`px-6 py-3 rounded-lg text-lg font-bold transition-all duration-200 border-2 flex items-center justify-center ${
                    activeTab === TabView.ANALYTICS
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Media Analytics
                </button>
                <button
                  onClick={() => setActiveTab(TabView.MAP)}
                  className={`px-6 py-3 rounded-lg text-lg font-bold transition-all duration-200 border-2 flex items-center justify-center ${
                    activeTab === TabView.MAP
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Map
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex flex-wrap gap-4 items-end p-1">
           <FilterDropdown label="Город" value={filters.city} options={options.cities} onChange={(v) => handleFilterChange('city', v)} />
           <FilterDropdown label="Год" value={filters.year} options={options.years} onChange={(v) => handleFilterChange('year', v)} />
           <FilterDropdown label="Месяц" value={filters.month} options={options.months} onChange={(v) => handleFilterChange('month', v)} />
           <FilterDropdown label="Формат поверхности" value={filters.format} options={options.formats} onChange={(v) => handleFilterChange('format', v)} />
           <FilterDropdown label="Продавец конструкции" value={filters.vendor} options={options.vendors} onChange={(v) => handleFilterChange('vendor', v)} />
           
           <button 
            onClick={() => setFilters({city: 'Все', year: 'Все', month: 'Все', format: 'Все', vendor: 'Все'})}
            className="ml-auto mb-1 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
           >
             Сбросить фильтры
           </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 overflow-y-auto w-full max-w-[1600px] mx-auto">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard 
            value={formatNumberRussian(kpis.avgGrp)} 
            label="Средний GRP" 
          />
          <KPICard 
            value={`${formatCompactRussian(kpis.totalOts * 1000)}`} 
            label="Общий OTS" 
            subtext="человек"
          />
          <KPICard 
            value={`${kpis.uniqueSurfaces.toLocaleString('ru-RU')}`} 
            label="Уникальные поверхности" 
          />
          <KPICard 
            value={`${Math.round(kpis.percentHighGrp)}%`} 
            label="% конструкций выше среднего GRP" 
          />
        </div>

        {activeTab === TabView.ANALYTICS && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] lg:h-[350px]">
              <div className="lg:col-span-2 h-full">
                <TrendChart data={filteredData} />
              </div>
              <div className="h-full">
                <FormatBarChart data={filteredData} />
              </div>
            </div>

            {/* CHARTS ROW 2 */}
            <div className="w-full">
              <VendorTreemap data={filteredData} />
            </div>
          </div>
        )}

        {activeTab === TabView.MAP && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <MapViz data={filteredData} />
            
            {/* DATA TABLE */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Детализация по адресам</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Город</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Адрес в системе Admetrix</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Продавец</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Формат</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GRP</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">OTS (тыс)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.slice(0, 20).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 text-xs text-gray-900 whitespace-nowrap">{record.city}</td>
                        <td className="px-6 py-2 text-xs text-gray-500 truncate max-w-xs" title={record.address}>{record.address}</td>
                        <td className="px-6 py-2 text-xs text-gray-500 whitespace-nowrap">{record.vendor}</td>
                        <td className="px-6 py-2 text-xs text-gray-500 whitespace-nowrap">{record.format}</td>
                        <td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.grp)}</td>
                        <td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.ots)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                 <span>Показано {Math.min(20, filteredData.length)} из {filteredData.length} записей</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
