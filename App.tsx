import React, { useState, useMemo, useEffect } from 'react';
import { OOHRecord, FilterState, TabView } from './types';
import { loadRealData, formatNumberRussian, formatCompactRussian } from './utils/data';
import { TrendChart, FormatBarChart, VendorTreemap } from './components/Charts';
import { MapViz } from './components/MapViz';
import { exportToExcel } from './utils/export';
import { Loader2, AlertTriangle, Map as MapIcon, Lock, Download } from 'lucide-react';

// --- ИМПОРТ АНАЛИТИКИ VERCEL ---
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const KPI_CARD_CLASS = "bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center h-32 transition-all hover:shadow-md";

const KPICard = ({ label, value, subtext }: { label: string; value: string; subtext?: string }) => (
  <div className={KPI_CARD_CLASS}>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
    {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
  </div>
);

const FilterDropdown = ({ 
  label, value, options, onChange 
}: { 
  label: string; value: string; options: string[]; onChange: (v: string) => void 
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
  
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const records = await loadRealData();
        setData(records);
      } catch (err: any) {
        console.error("CRITICAL ERROR:", err);
        setError(err.message || "Ошибка загрузки данных");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    city: 'Все', year: 'Все', month: 'Все', format: 'Все', vendor: 'Все',
  });

  const handleChartClick = (type: 'date' | 'format' | 'vendor', value: any) => {
    if (type === 'date') {
      setFilters(prev => ({ ...prev, year: value.year, month: value.month }));
    } else if (type === 'format') {
      setFilters(prev => ({ ...prev, format: value }));
    } else if (type === 'vendor') {
      setFilters(prev => ({ ...prev, vendor: value }));
    }
  };

  const isMapReady = filters.city !== 'Все' && filters.year !== 'Все' && filters.month !== 'Все';

  const options = useMemo(() => {
    if (data.length === 0) {
      return { cities: [], years: [], months: [], formats: [], vendors: [] };
    }
    const cities = new Set<string>();
    const years = new Set<string>();
    const months = new Set<string>();
    const formats = new Set<string>();
    const vendors = new Set<string>();

    data.forEach(d => {
      const strYear = String(d.year);
      const matchCity = filters.city === 'Все' || d.city === filters.city;
      const matchYear = filters.year === 'Все' || strYear === filters.year;
      const matchMonth = filters.month === 'Все' || d.month === filters.month;
      const matchFormat = filters.format === 'Все' || d.format === filters.format;
      const matchVendor = filters.vendor === 'Все' || d.vendor === filters.vendor;

      if (matchYear && matchMonth && matchFormat && matchVendor) cities.add(d.city);
      if (matchCity && matchMonth && matchFormat && matchVendor) years.add(strYear);
      if (matchCity && matchYear && matchFormat && matchVendor) months.add(d.month);
      if (matchCity && matchYear && matchMonth && matchVendor) formats.add(d.format);
      if (matchCity && matchYear && matchMonth && matchFormat) vendors.add(d.vendor);
    });

    const monthOrder = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const sortMonths = (a: string, b: string) => {
       const ia = monthOrder.findIndex(m => a.toLowerCase().includes(m));
       const ib = monthOrder.findIndex(m => b.toLowerCase().includes(m));
       return ia - ib;
    };

    return {
      cities: Array.from(cities).sort(),
      years: Array.from(years).sort(),
      months: Array.from(months).sort(sortMonths),
      formats: Array.from(formats).sort(),
      vendors: Array.from(vendors).sort(),
    };
  }, [data, filters]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (filters.city !== 'Все' && d.city !== filters.city) return false;
      if (filters.year !== 'Все' && String(d.year) !== filters.year) return false;
      if (filters.month !== 'Все' && d.month !== filters.month) return false;
      if (filters.format !== 'Все' && d.format !== filters.format) return false;
      if (filters.vendor !== 'Все' && d.vendor !== filters.vendor) return false;
      return true;
    });
  }, [data, filters]);

  const mapData = useMemo(() => {
     return filteredData.slice(0, 5000);
  }, [filteredData]);

  const tableData = useMemo(() => {
    if (selectedMapPointId) {
      return filteredData.filter(d => d.id === selectedMapPointId);
    }
    return [...filteredData]
      .sort((a, b) => b.grp - a.grp)
      .slice(0, 20);
  }, [filteredData, selectedMapPointId]);
  
  const kpis = useMemo(() => {
    if (filteredData.length === 0) return { 
      avgGrp: 0, totalOtsMillions: 0, uniqueSurfaces: 0, 
      totalSurfaces: 0, percentHighGrp: 0, 
      digitalCount: 0, digitalShare: 0 
    };
    
    const totalGrp = filteredData.reduce((acc, curr) => acc + curr.grp, 0);
    const avgGrp = totalGrp / filteredData.length;
    const totalOtsRaw = filteredData.reduce((acc, curr) => acc + curr.ots, 0); 
    const totalOtsMillions = totalOtsRaw / 1000;
    const uniqueSurfaces = new Set(filteredData.map(d => d.address)).size; 
    const totalSurfaces = filteredData.length;
    const highGrpCount = filteredData.filter(d => d.grp > avgGrp).length;
    const percentHighGrp = (highGrpCount / filteredData.length) * 100;
    const digitalCount = filteredData.filter(d => {
      const fmt = d.format.toUpperCase();
      return fmt.startsWith('D') || fmt === 'MF';
    }).length;
    const digitalShare = totalSurfaces > 0 ? (digitalCount / totalSurfaces) * 100 : 0;

    return { avgGrp, totalOtsMillions, uniqueSurfaces, totalSurfaces, percentHighGrp, digitalCount, digitalShare };
  }, [filteredData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setSelectedMapPointId(null);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExcelExport = () => {
    if (isMapReady) {
      exportToExcel(filteredData, 'OOH_Analytics', true);
    } else {
      const confirmed = window.confirm(
        "Внимание: Вы не выбрали Город, Год и Месяц.\n\n" +
        "Полная выгрузка может содержать миллионы строк и браузер может зависнуть.\n" +
        "Нажмите «ОК», чтобы скачать только KPI (Сводку).\n" +
        "Нажмите «Отмена», чтобы вернуться и выбрать фильтры."
      );

      if (confirmed) {
        exportToExcel(filteredData, 'OOH_Analytics', false);
      }
    }
  };

  if (error) return <div className="p-10 text-red-600 text-center font-bold">Ошибка: {error}</div>;
  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col gap-4"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /><p className="text-gray-600 font-medium">Загрузка данных...</p></div>);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200 z-20 sticky top-0">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">OOH Media Analytics</h1>
            <div className="flex gap-4">
                <button onClick={() => setActiveTab(TabView.ANALYTICS)} className={`px-6 py-3 rounded-lg text-lg font-bold transition-all border-2 ${activeTab === TabView.ANALYTICS ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200'}`}>Analytics</button>
                <button onClick={() => setActiveTab(TabView.MAP)} className={`px-6 py-3 rounded-lg text-lg font-bold transition-all border-2 flex items-center gap-2 ${activeTab === TabView.MAP ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200'}`}>Map {!isMapReady && <Lock size={16} className="text-gray-400" />}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10">
        <div className="flex flex-wrap gap-4 items-end p-1">
           <FilterDropdown label="Город" value={filters.city} options={options.cities} onChange={(v) => handleFilterChange('city', v)} />
           <FilterDropdown label="Год" value={filters.year} options={options.years} onChange={(v) => handleFilterChange('year', v)} />
           <FilterDropdown label="Месяц" value={filters.month} options={options.months} onChange={(v) => handleFilterChange('month', v)} />
           <FilterDropdown label="Формат" value={filters.format} options={options.formats} onChange={(v) => handleFilterChange('format', v)} />
           <FilterDropdown label="Продавец" value={filters.vendor} options={options.vendors} onChange={(v) => handleFilterChange('vendor', v)} />
           
           <div className="ml-auto mb-1 flex gap-2">
             <button 
               onClick={handleExcelExport}
               disabled={filteredData.length === 0}
               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               title="Скачать Excel (Сводка + Детали)"
             >
               <Download size={16} />
               <span className="hidden sm:inline">Excel</span>
             </button>

             <button 
               onClick={() => setFilters({city: 'Все', year: 'Все', month: 'Все', format: 'Все', vendor: 'Все'})} 
               className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors"
             >
               Сбросить
             </button>
           </div>
        </div>
      </div>

      <main className="flex-grow p-6 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <KPICard value={formatNumberRussian(kpis.avgGrp)} label="Средний GRP" />
          <KPICard value={`${formatNumberRussian(kpis.totalOtsMillions, 1)} млн`} label="Общий OTS" subtext="контактов" />
          <KPICard value={formatCompactRussian(kpis.totalSurfaces)} label="Всего поверхностей" subtext={`(Уникальных адресов: ${kpis.uniqueSurfaces.toLocaleString('ru-RU')})`} />
          <KPICard value={`${formatCompactRussian(kpis.digitalCount)} (${Math.round(kpis.digitalShare)}%)`} label="Цифровых поверхностей (доля DOOH + MF)" />
          <KPICard value={`${Math.round(kpis.percentHighGrp)}%`} label="% конструкций выше среднего GRP" />
        </div>

        {activeTab === TabView.ANALYTICS && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] lg:h-[350px]">
              <div className="lg:col-span-2 h-full"><TrendChart data={filteredData} onFilterClick={handleChartClick} /></div>
              <div className="h-full"><FormatBarChart data={filteredData} onFilterClick={handleChartClick} /></div>
            </div>
            <div className="w-full"><VendorTreemap data={filteredData} onFilterClick={handleChartClick} /></div>
          </div>
        )}

        {activeTab === TabView.MAP && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {isMapReady ? (
              <>
                <div className="relative">
                  <MapViz 
                    data={mapData} 
                    onPointClick={(id) => setSelectedMapPointId(id || null)}
                    selectedPointId={selectedMapPointId}
                  />
                  {filteredData.length > 5000 && (
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full shadow-md z-[400] border border-yellow-300">
                      Показано 5000 из {filteredData.length} точек
                    </div>
                  )}
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-medium text-gray-700">Детализация</h3>
                      {selectedMapPointId && (
                        <button 
                          onClick={() => setSelectedMapPointId(null)}
                          className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200 transition-colors font-medium"
                        >
                          Сбросить выбор ✕
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedMapPointId ? 'Выбрана 1 поверхность' : `Топ 20 по GRP (Всего: ${filteredData.length})`}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Продавец</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Формат</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer" title="Сортировка по умолчанию">GRP ↓</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">OTS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.map((record) => (
                          <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${selectedMapPointId === record.id ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-2 text-xs text-gray-900">{record.city}</td>
                            <td className="px-6 py-2 text-xs text-gray-500 truncate max-w-xs" title={record.address}>{record.address}</td>
                            <td className="px-6 py-2 text-xs text-gray-500">{record.vendor}</td>
                            <td className="px-6 py-2 text-xs text-gray-500">{record.format}</td>
                            <td className="px-6 py-2 text-xs text-gray-900 text-right font-medium">{formatNumberRussian(record.grp)}</td>
                            <td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.ots)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tableData.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">Нет данных для отображения</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded-md flex flex-col items-center justify-center h-[400px] shadow-sm">
                 <div className="bg-yellow-100 p-4 rounded-full mb-4"><MapIcon className="h-10 w-10 text-yellow-600" /></div>
                 <h3 className="text-xl font-bold text-yellow-800 mb-2">Для карты нужен точный выбор</h3>
                 <p className="text-yellow-700 text-center max-w-md mb-6">Карта не может отобразить все 2 миллиона точек сразу.</p>
                 <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-sm border border-yellow-200"><AlertTriangle className="h-5 w-5 text-orange-500" /><span className="font-medium text-gray-700">Пожалуйста, выберите <strong>Город</strong>, <strong>Год</strong> и <strong>Месяц</strong> в фильтрах выше.</span></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* КОМПОНЕНТЫ АНАЛИТИКИ VERCEL */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
};

export default App;
