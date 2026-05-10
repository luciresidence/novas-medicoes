import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const ApartmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const currentReferenceDate = dateParam ? new Date(dateParam) : new Date();

  const [apartments, setApartments] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'pendentes' | 'parciais' | 'concluidos'>('todos');

  const getBlockTheme = (block: string | undefined) => {
    if (block?.toUpperCase() === 'B') {
      return {
        badge: 'bg-emerald-100 text-emerald-600',
        role: 'text-emerald-700/60 border-emerald-100 bg-emerald-50/50',
        unitText: 'text-emerald-700'
      };
    }
    return {
      badge: 'bg-[#fff1f4] text-[#7a1b3c]',
      role: 'text-rose-700/50 border-rose-100 bg-rose-50/30',
      unitText: 'text-[#1a202c]'
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const aptsSnap = await getDocs(collection(db, 'apartments'));
        const aptsData = aptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const startOfMonth = new Date(currentReferenceDate.getFullYear(), currentReferenceDate.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(currentReferenceDate.getFullYear(), currentReferenceDate.getMonth() + 1, 0, 23, 59, 59);

        const qReads = query(
          collection(db, 'readings'),
          where('date', '>=', startOfMonth.toISOString().split('T')[0]),
          where('date', '<=', endOfMonth.toISOString().split('T')[0] + 'T23:59:59')
        );
        const readsSnap = await getDocs(qReads);
        const readsData = readsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sortedApts = aptsData.sort((a: any, b: any) => {
          const nameA = (a.resident_name || a.residentName || '').toUpperCase();
          const nameB = (b.resident_name || b.residentName || '').toUpperCase();
          if (nameA.includes('CONDOMÍNIO')) return -1;
          if (nameB.includes('CONDOMÍNIO')) return 1;
          const numA = parseInt(a.number || 0);
          const numB = parseInt(b.number || 0);
          if (a.block !== b.block) return (a.block || '').localeCompare(b.block || '');
          return numA - numB;
        });

        setApartments(sortedApts);
        setReadings(readsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateParam]);

  const apartmentStatus = apartments.map(apt => {
    const aptReadings = readings.filter(r => r.apartment_id === apt.id);
    const hasWater = aptReadings.some(r => r.type === 'water');
    const hasGas = aptReadings.some(r => r.type === 'gas');
    return {
      ...apt,
      hasWater,
      hasGas,
      status: hasWater && hasGas ? 'concluidos' : (!hasWater && !hasGas ? 'pendentes' : 'parciais') as 'concluidos' | 'pendentes' | 'parciais'
    };
  });

  const filteredApartments = apartmentStatus.filter(apt => {
    const searchMatch =
      (apt.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.resident_name || apt.residentName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const filterMatch = filterMode === 'todos' || apt.status === filterMode;
    return searchMatch && filterMatch;
  });

  const readingsByApartment = readings.reduce<Record<string, { water: boolean; gas: boolean }>>((acc, reading) => {
    const apartmentId = reading.apartment_id;
    if (!apartmentId) return acc;
    if (!acc[apartmentId]) acc[apartmentId] = { water: false, gas: false };
    if (reading.type === 'water') acc[apartmentId].water = true;
    if (reading.type === 'gas') acc[apartmentId].gas = true;
    return acc;
  }, {});

  const completedReadings = apartments.reduce((sum, apt) => {
    const apartmentReadings = readingsByApartment[apt.id] || { water: false, gas: false };
    return sum + (apartmentReadings.water ? 1 : 0) + (apartmentReadings.gas ? 1 : 0);
  }, 0);

  const totalExpectedReadings = apartments.length * 2;
  const progress = totalExpectedReadings > 0
    ? Math.min(100, Math.round((completedReadings / totalExpectedReadings) * 100))
    : 0;

  if (loading) return <div className="p-10 text-center font-bold text-[#7a1b3c]">Carregando...</div>;

  return (
    <div className="pb-32 pt-safe flex-1 bg-white min-h-screen">
      <div className="max-w-md mx-auto">
        <header className="p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-[#7a1b3c] uppercase italic leading-none tracking-tighter">Medições</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] mt-1">Leituras Luci Berkembrock</p>
            </div>
            <button
              onClick={() => navigate(`/reports?date=${currentReferenceDate.toISOString()}`)}
              className="size-12 bg-[#7a1b3c] rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-[#7a1b3c]/20"
            >
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <button onClick={() => {
              const newDate = new Date(currentReferenceDate);
              newDate.setMonth(newDate.getMonth() - 1);
              navigate(`?date=${newDate.toISOString()}`);
            }} className="text-slate-300"><span className="material-symbols-outlined text-xl">chevron_left</span></button>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Mês de Referência</p>
              <p className="text-sm font-black text-slate-700 uppercase">{currentReferenceDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <button onClick={() => {
              const newDate = new Date(currentReferenceDate);
              newDate.setMonth(newDate.getMonth() + 1);
              navigate(`?date=${newDate.toISOString()}`);
            }} className="text-slate-300"><span className="material-symbols-outlined text-xl">chevron_right</span></button>
          </div>

          <div className="space-y-1.5 px-1">
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <span>Progresso do Mês</span>
              <span className="text-[#7a1b3c]">
               {progress}%
              </span>
            </div>
            <div className="h-[2px] bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7a1b3c] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">search</span>
            <input
              type="text"
              placeholder="Buscar apto ou morador..."
              className="w-full h-14 pl-14 pr-6 bg-[#f4f7fa] rounded-3xl border-none font-bold text-slate-600 placeholder:text-slate-300 focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
            {[
              { key: 'todos', label: 'TODOS', icon: 'menu' },
              { key: 'pendentes', label: 'PENDENTES', icon: 'pending_actions' },
              { key: 'parciais', label: 'PARCIAIS', icon: 'dark_mode' },
              { key: 'concluidos', label: 'CONCLUÍDOS', icon: 'check_circle' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterMode(tab.key as any)}
                className={`min-w-[8rem] flex-shrink-0 h-12 rounded-[24px] border px-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all flex items-center justify-center gap-2 ${filterMode === tab.key ? 'bg-[#7a1b3c] border-[#7a1b3c] text-white shadow-lg shadow-[#7a1b3c]/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${filterMode === tab.key ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                </span>
                <span className="leading-none text-[10px] whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="px-6 space-y-4 border-t border-slate-50 pt-6">
          {filteredApartments.map(apt => {
            const aptReadings = readings.filter(r => r.apartment_id === apt.id);
            const hasWater = aptReadings.some(r => r.type === 'water');
            const hasGas = aptReadings.some(r => r.type === 'gas');

            return (
              <button
                key={apt.id}
                onClick={() => navigate(`/readings/${apt.id}?date=${currentReferenceDate.toISOString()}`)}
                className="w-full flex items-center gap-5 p-5 bg-white rounded-[35px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] active:scale-[0.97] transition-all text-left"
              >
                {(() => {
                  const theme = getBlockTheme(apt.block);
                  return (
                    <>
                      <div className={`size-16 rounded-[24px] flex flex-col items-center justify-center font-black shrink-0 ${theme.badge}`}>
                        <span className="text-xl italic leading-none">{apt.number}</span>
                        <span className="text-[7px] uppercase opacity-60 tracking-tighter">BL {apt.block || 'A'}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-black truncate uppercase text-sm tracking-tighter mb-1 ${theme.unitText}`}>
                          {apt.resident_name || apt.residentName}
                        </h3>
                        <span className={`text-[8px] font-black uppercase tracking-[2px] border px-2 py-0.5 rounded-md ${theme.role}`}>
                          {apt.resident_role || 'PROPRIETÁRIO'}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                     <span className="text-[7px] font-black uppercase text-slate-300 tracking-widest">Água</span>
                     <div className={`size-4 rounded-full border-2 border-slate-100 flex items-center justify-center ${hasWater ? 'bg-blue-500 border-blue-500' : ''}`}>
                       {hasWater && <span className="material-symbols-outlined text-[8px] text-white font-bold">check</span>}
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[7px] font-black uppercase text-slate-300 tracking-widest">Gás</span>
                     <div className={`size-4 rounded-full border-2 border-slate-100 flex items-center justify-center ${hasGas ? 'bg-orange-500 border-orange-500' : ''}`}>
                       {hasGas && <span className="material-symbols-outlined text-[8px] text-white font-bold">check</span>}
                     </div>
                  </div>
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default ApartmentList;
