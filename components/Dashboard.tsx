
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

interface FirestoreReading {
  date: string;
  type: 'water' | 'gas';
  current_value?: number;
  previous_value?: number;
  apartment_id: string;
}

interface FirestoreApartment {
  number: string;
  block: string;
}

const Logo = () => (
  <div className="flex flex-col items-center">
    <svg width="100" height="75" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <ellipse cx="85" cy="70" rx="35" ry="50" fill="#a66384" fillOpacity="0.7" transform="rotate(-15 85 70)" />
      <ellipse cx="115" cy="70" rx="35" ry="50" fill="#802e53" fillOpacity="0.8" transform="rotate(15 115 70)" />
    </svg>
    <h1 className="text-lg font-bold text-primary uppercase tracking-tighter -mt-3">Luci Berkembrock</h1>
    <div className="h-[2px] w-24 bg-primary/20 my-1"></div>
    <p className="text-[8px] font-semibold text-primary/60 uppercase tracking-[4px]">Residence</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [insight, setInsight] = useState<string>('Analisando dados do mês...');
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<{ water: any[], gas: any[] }>({ water: [], gas: [] });
  const [summary, setSummary] = useState({
    water: 0,
    gas: 0,
    waterChange: 0,
    gasChange: 0
  });

  useEffect(() => {
    const fetchInitialDate = async () => {
      try {
        const readsSnap = await getDocs(query(collection(db, 'readings'), orderBy('date', 'desc')));
        const data = readsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreReading) }));

        if (data && data.length > 0) {
          const lastDate = new Date(data[0].date);
          setCurrentDate(new Date(lastDate.getFullYear(), lastDate.getMonth(), 1));
        }
      } catch (err: any) {
        console.error("Erro na data inicial:", err);
      }
    };
    fetchInitialDate();
  }, []);

  const fetchDashboardData = async (date: Date) => {
    setLoading(true);
    setDebugError(null);
    setInsight('Analisando dados do mês...');

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

    try {
      // 1. Fetch current month readings
      const readsSnap = await getDocs(query(
        collection(db, 'readings'),
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth)
      ));
      const currentReadings = readsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreReading) }));

      const prevMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const startOfPrevMonth = prevMonthDate.toISOString();
      const endOfPrevMonth = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59).toISOString();

      const prevSnap = await getDocs(query(
        collection(db, 'readings'),
        where('date', '>=', startOfPrevMonth),
        where('date', '<=', endOfPrevMonth)
      ));
      const prevReadings = prevSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreReading) }));

      const calculateTotal = (readings: any[], type: 'water' | 'gas') => {
        return (readings || [])
          .filter(r => r.type === type && r.current_value)
          .reduce((acc, r) => acc + (Number(r.current_value) - Number(r.previous_value)), 0);
      };

      const currentWater = calculateTotal(currentReadings || [], 'water');
      const currentGas = calculateTotal(currentReadings || [], 'gas');
      const prevWater = calculateTotal(prevReadings || [], 'water');
      const prevGas = calculateTotal(prevReadings || [], 'gas');

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      const waterChange = calculateChange(currentWater, prevWater);
      const gasChange = calculateChange(currentGas, prevGas);

      setSummary({
        water: currentWater,
        gas: currentGas,
        waterChange,
        gasChange
      });

      // 3. Análise interna de consumo
      if (currentWater > 0 || currentGas > 0) {
        setInsight('Análise automática desativada.');
      } else {
        setInsight('Sem dados de leitura para este mês.');
      }

      // 4. Rankings Logic
      const apartmentsSnap = await getDocs(collection(db, 'apartments'));
      const apartments = apartmentsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreApartment) }));

      if (apartments && currentReadings) {
        const calcRank = (type: 'water' | 'gas') => {
          return (currentReadings || [])
            .filter(r => r.type === type && r.current_value)
            .map(r => {
              const apt = apartments.find(a => String(a.id) === String(r.apartment_id));
              return {
                unit: apt ? `${apt.number}${apt.block}` : '?',
                usage: Number(r.current_value) - Number(r.previous_value)
              };
            })
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 3);
        };
        setRankings({ water: calcRank('water'), gas: calcRank('gas') });
      }
    } catch (err: any) {
      setDebugError(`Erro de Conexão: ${err.message || 'Falha ao buscar dados do Dashboard'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formattedMonth = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="scroll-container flex-1 bg-background-light dark:bg-background-dark">
      <div className="pt-safe pb-32">
        <header className="px-6 py-6 bg-white dark:bg-surface-dark border-b dark:border-gray-800 flex flex-col items-center shadow-sm">
          <Logo />
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[2px] mt-3">Monitoramento Geral</p>
        </header>

        <div className="p-4 space-y-5">
          {/* Debug Error Block */}
          {debugError && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl mb-4">
              <p className="font-bold uppercase text-xs tracking-widest mb-1 items-center flex gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                Falha no Painel
              </p>
              <pre className="text-[10px] font-bold uppercase tracking-tighter whitespace-pre-wrap leading-tight">{debugError}</pre>
            </div>
          )}

          {/* Month Picker Functional */}
          <div className="flex items-center justify-between bg-white dark:bg-surface-dark px-4 py-3.5 rounded-3xl shadow-sm border dark:border-gray-800">
            <button
              onClick={handlePrevMonth}
              className="size-9 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
              <span className="font-bold text-[11px] uppercase tracking-widest text-primary shrink-0">
                {formattedMonth}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="size-9 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-400 active:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Gemini Insight Banner */}
          <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-[2.5rem] border border-primary/20 flex gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150">
              <span className="material-symbols-outlined text-5xl">auto_awesome</span>
            </div>
            <span className="material-symbols-outlined text-primary dark:text-primary animate-pulse flex-shrink-0">
              {loading ? 'sync' : 'auto_awesome'}
            </span>
            <div>
              <p className="text-[8px] font-bold text-primary dark:text-primary uppercase tracking-[2px] mb-1">IA Insight</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 leading-relaxed italic">
                "{insight}"
              </p>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-5 rounded-[2.5rem] bg-white dark:bg-surface-dark shadow-sm border border-slate-50 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-lg fill-1">water_drop</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Água</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold tracking-tighter">
                  {summary.water.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">m³</span>
              </div>
              <div className={`flex items-center gap-1 mt-2 font-bold text-[8px] uppercase ${summary.waterChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-[10px]">
                  {summary.waterChange <= 0 ? 'trending_down' : 'trending_up'}
                </span>
                <span className="truncate">
                  {summary.waterChange > 0 ? '+' : ''}{summary.waterChange.toFixed(1)}% {summary.waterChange <= 0 ? 'Estável' : 'Alerta'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-[2.5rem] bg-white dark:bg-surface-dark shadow-sm border border-slate-50 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-gas flex-shrink-0">
                  <span className="material-symbols-outlined text-lg fill-1">local_fire_department</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Gás</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold tracking-tighter">
                  {summary.gas.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">m³</span>
              </div>
              <div className={`flex items-center gap-1 mt-2 font-bold text-[8px] uppercase ${summary.gasChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-[10px]">
                  {summary.gasChange <= 0 ? 'trending_down' : 'trending_up'}
                </span>
                <span className="truncate">
                  {summary.gasChange > 0 ? '+' : ''}{summary.gasChange.toFixed(1)}% {summary.gasChange <= 0 ? 'Estável' : 'Alerta'}
                </span>
              </div>
            </div>
          </div>

          {/* Rankings Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-2">Ranking de Consumo</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Water Ranking */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-sm fill-1">water_drop</span>
                  <span className="text-[9px] font-bold text-slate-800 dark:text-gray-300 uppercase tracking-widest">Top 3 Água</span>
                </div>
                <div className="space-y-3">
                  {rankings.water.length > 0 ? rankings.water.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-200">Unidade {item.unit}</span>
                      </div>
                      <span className="text-xs font-black text-primary">{item.usage.toFixed(1)} m³</span>
                    </div>
                  )) : <p className="text-[10px] text-slate-400 text-center py-2 italic font-medium">Sem dados suficentes</p>}
                </div>
              </div>

              {/* Gas Ranking */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-gas text-sm fill-1">local_fire_department</span>
                  <span className="text-[9px] font-bold text-slate-800 dark:text-gray-300 uppercase tracking-widest">Top 3 Gás</span>
                </div>
                <div className="space-y-3">
                  {rankings.gas.length > 0 ? rankings.gas.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-gas text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-200">Unidade {item.unit}</span>
                      </div>
                      <span className="text-xs font-black text-gas">{item.usage.toFixed(1)} m³</span>
                    </div>
                  )) : <p className="text-[10px] text-slate-400 text-center py-2 italic font-medium">Sem dados suficentes</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
