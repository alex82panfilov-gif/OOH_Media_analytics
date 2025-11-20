import React, { useState, useMemo, useEffect } from 'react';
import { OOHRecord, FilterState, TabView } from './types';
import { loadRealData, formatNumberRussian, formatCompactRussian } from './utils/data';
import { TrendChart, FormatBarChart, VendorTreemap } from './components/Charts';
import { MapViz } from './components/MapViz';
import { Loader2, AlertTriangle, Map as MapIcon, Lock } from 'lucide-react';

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

  // Обработчик кликов по графикам
  const handleChartClick = (type: 'date' | 'format' | 'vendor', value: any) => {
    if (type === 'date') {
      // При клике на график динамики устанавливаем и Год, и Месяц
      setFilters(prev => ({ ...prev, year: value.year, month: value.month }));
    } else if (type === 'format') {
      setFilters(prev => ({ ...prev, format: value }));
    } else if (type === 'vendor') {
      setFilters(prev => ({ ...prev, vendor: value }));
    }
  };

  const isMapReady = filters.city !== 'Все' && filters.year !== 'Все' && filters.month !== 'Все';

// --- ОБНОВЛЕННАЯ ЛОГИКА ФИЛЬТРАЦИИ ---
  const options = useMemo(() => {
    if (data.length === 0) {
      return { cities: [], years: [], months: [], formats: [], vendors: [] };
    }

    // Создаем Sets для сбора уникальных значений
    const cities = new Set<string>();
    const years = new Set<string>();
    const months = new Set<string>();
    const formats = new Set<string>();
    const vendors = new Set<string>();

    // Проходим по всем данным ОДИН раз
    data.forEach(d => {
      const strYear = String(d.year);

      // Проверяем совпадение строки с текущими фильтрами
      // Если фильтр "Все" или значение совпадает — считаем, что условие выполнено
      const matchCity = filters.city === 'Все' || d.city === filters.city;
      const matchYear = filters.year === 'Все' || strYear === filters.year;
      const matchMonth = filters.month === 'Все' || d.month === filters.month;
      const matchFormat = filters.format === 'Все' || d.format === filters.format;
      const matchVendor = filters.vendor === 'Все' || d.vendor === filters.vendor;

      // ЛОГИКА:
      // Чтобы добавить Город в список доступных, запись должна подходить по ВСЕМ остальным критериям (Год, Месяц, Формат, Продавец),
      // но нам не важно, совпадает ли сам Город (чтобы список не схлопывался до одного выбранного значения).
      
      // 1. Собираем Города (учитываем все фильтры, кроме City)
      if (matchYear && matchMonth && matchFormat && matchVendor) {
        cities.add(d.city);
      }

      // 2. Собираем Года (учитываем все, кроме Year)
      if (matchCity && matchMonth && matchFormat && matchVendor) {
        years.add(strYear);
      }

      // 3. Собираем Месяцы (учитываем все, кроме Month)
      if (matchCity && matchYear && matchFormat && matchVendor) {
        months.add(d.month);
      }

      // 4. Собираем Форматы (учитываем все, кроме Format)
      if (matchCity && matchYear && matchMonth && matchVendor) {
        formats.add(d.format);
      }

      // 5. Собираем Продавцов (учитываем все, кроме Vendor)
      if (matchCity && matchYear && matchMonth && matchFormat) {
        vendors.add(d.vendor);
      }
    });

    // Функция сортировки месяцев (опционально, чтобы не было хаоса)
    // Можно использовать упрощенный порядок из Charts, но здесь сделаем простой
    const monthOrder = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const sortMonths = (a: string, b: string) => {
       const ia = monthOrder.findIndex(m => a.toLowerCase().includes(m));
       const ib = monthOrder.findIndex(m => b.toLowerCase().includes(m));
       return ia - ib;
    };

    return {
      cities: Array.from(cities).sort(),
      years: Array.from(years).sort(),
      months: Array.from(months).sort(sortMonths), // Применяем сортировку месяцев
      formats: Array.from(formats).sort(),
      vendors: Array.from(vendors).sort(),
    };
  }, [data, filters]); // Важно: пересчитываем при изменении data И filters
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

    // --- НОВАЯ ЛОГИКА: Считаем цифру (Digital + MF) ---
    const digitalCount = filteredData.filter(d => {
      const fmt = d.format.toUpperCase(); // На всякий случай приводим к верхнему регистру
      // Форматы на "D" (DBB, DCF...) или "MF" (Медиафасады)
      return fmt.startsWith('D') || fmt === 'MF';
    }).length;

    const digitalShare = totalSurfaces > 0 ? (digitalCount / totalSurfaces) * 100 : 0;

    return { avgGrp, totalOtsMillions, uniqueSurfaces, totalSurfaces, percentHighGrp, digitalCount, digitalShare };
  }, [filteredData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (error) return <div className="p-10 text-red-600 text-center font-bold">Ошибка: {error}</div>;
  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col gap-4"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /><p className="text-gray-600 font-medium">Загрузка данных...</p></div>);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
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
        {/* Изменили grid-cols-4 на grid-cols-5 для больших экранов (xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <KPICard value={formatNumberRussian(kpis.avgGrp)} label="Средний GRP" />
          
          <KPICard value={`${formatNumberRussian(kpis.totalOtsMillions, 1)} млн`} label="Общий OTS" subtext="контактов" />
          
          <KPICard value={formatCompactRussian(kpis.totalSurfaces)} label="Всего поверхностей" subtext={`(Уникальных адресов: ${kpis.uniqueSurfaces.toLocaleString('ru-RU')})`} />
          
          {/* НОВАЯ 4-я карточка: Цифровой инвентарь */}
          <KPICard 
            value={`${formatCompactRussian(kpis.digitalCount)} (${Math.round(kpis.digitalShare)}%)`} 
            label="Цифровых поверхностей (доля DOOH + MF)" 
          />
          
          {/* 5-я карточка (сдвинулась) */}
          <KPICard value={`${Math.round(kpis.percentHighGrp)}%`} label="% конструкций выше среднего GRP" />
        </div>

        {activeTab === TabView.ANALYTICS && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] lg:h-[350px]">
              {/* Передаем функцию клика в графики */}
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
                <div className="relative"><MapViz data={mapData} />{filteredData.length > 5000 && (<div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full shadow-md z-[1000] border border-yellow-300">Показано 5000 из {filteredData.length} точек</div>)}</div>
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center"><h3 className="text-sm font-medium text-gray-700">Детализация</h3><span className="text-xs text-gray-500">Всего: {filteredData.length}</span></div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Город</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Продавец</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Формат</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GRP</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">OTS</th></tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.slice(0, 20).map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50"><td className="px-6 py-2 text-xs text-gray-900">{record.city}</td><td className="px-6 py-2 text-xs text-gray-500 truncate max-w-xs" title={record.address}>{record.address}</td><td className="px-6 py-2 text-xs text-gray-500">{record.vendor}</td><td className="px-6 py-2 text-xs text-gray-500">{record.format}</td><td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.grp)}</td><td className="px-6 py-2 text-xs text-gray-900 text-right">{formatNumberRussian(record.ots)}</td></tr>
                        ))}
                      </tbody>
                    </table>
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
    </div>
  );
};

export default App;
