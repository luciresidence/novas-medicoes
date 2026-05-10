
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Apartment } from '../types';

interface FirestoreReading {
  apartment_id: string;
  type: 'water' | 'gas';
  current_value?: number;
  previous_value?: number;
  date: string;
}

interface FirestoreApartment {
  number: string;
  block: string;
  resident_name?: string;
}

interface HistoryProps {
  onImageClick: (url: string) => void;
}

const History: React.FC<HistoryProps> = ({ onImageClick }) => {
  const [readings, setReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setDebugError(null);

        const readsSnap = await getDocs(query(collection(db, 'readings'), orderBy('date', 'desc')));
        const readsData = readsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreReading) }));

        const apartmentsSnap = await getDocs(collection(db, 'apartments'));
        const apartmentsData = apartmentsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FirestoreApartment) }));
        const apartmentMap = new Map(apartmentsData.map((apt: any) => [apt.id, apt]));

        const enriched = readsData.map(read => ({
          ...read,
          apartments: apartmentMap.get(read.apartment_id) || { number: '---', block: '---', resident_name: '---' }
        }));

        setReadings(enriched);
      } catch (err: any) {
        setDebugError(`Erro de Rede/Execução: ${err.message || 'Falha na conexão'}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-safe pt-safe flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="px-4 py-6 md:px-5 md:py-8 bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-bold uppercase tracking-tighter italic text-primary">Histórico</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[4px] mt-1">Registros de Consumo</p>
      </header>

      <div className="p-5 space-y-4">
        {debugError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl mb-4">
            <p className="font-bold uppercase text-xs tracking-widest mb-1 items-center flex gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              Erro de Conexão
            </p>
            <pre className="text-[10px] items-center font-bold uppercase tracking-tighter whitespace-pre-wrap leading-tight">{debugError}</pre>
          </div>
        )}

        {readings.length === 0 && !debugError ? (
          <div className="py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-5xl">history</span>
            <p className="text-[10px] items-center font-bold uppercase tracking-widest mt-2">Nenhum registro encontrado</p>
          </div>
        ) : (
          readings.map((reading) => {
            const apartment = reading.apartments;
            const isWater = reading.type === 'water';
            const displayDate = new Date(reading.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            return (
              <div key={reading.id} className="bg-white dark:bg-surface-dark p-6 rounded-[36px] shadow-sm border border-white dark:border-gray-800 transition-all active:scale-[0.99]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className={`size-14 rounded-2xl flex items-center justify-center ${isWater ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                      <span className="material-symbols-outlined text-3xl fill-1">{isWater ? 'water_drop' : 'local_fire_department'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter text-xl leading-none mb-1">Apto {apartment?.number || '???'}/Bl {apartment?.block || '-'}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{apartment?.resident_name || 'Morador'}</p>
                      <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter">Em {displayDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(reading.current_value).toFixed(1) || '---'}</p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">m³</span>
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-[10px] text-green-500 font-bold">trending_up</span>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                        +{(Number(reading.current_value) - Number(reading.previous_value)).toFixed(1)} de Consumo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-8 text-center opacity-60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] leading-relaxed">
          Relatórios detalhados em PDF estão disponíveis na aba "Medições"
        </p>
      </div>
    </div>
  );
};

export default History;
