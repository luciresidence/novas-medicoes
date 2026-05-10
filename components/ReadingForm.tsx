import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Apartment } from '../types';

const ReadingForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const referenceDate = dateParam ? new Date(dateParam) : new Date();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [allApartments, setAllApartments] = useState<any[]>([]);
  const [allMonthReadings, setAllMonthReadings] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showAptList, setShowAptList] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const gasSectionRef = useRef<HTMLDivElement | null>(null);

  const [waterValue, setWaterValue] = useState('');
  const [waterSaved, setWaterSaved] = useState(false);
  const [waterCollapsed, setWaterCollapsed] = useState(false);
  const [prevWater, setPrevWater] = useState(0);
  const [waterId, setWaterId] = useState<string | null>(null);

  const [gasValue, setGasValue] = useState('');
  const [gasSaved, setGasSaved] = useState(false);
  const [gasCollapsed, setGasCollapsed] = useState(false);
  const [prevGas, setPrevGas] = useState(0);
  const [gasId, setGasId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setShowAptList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        // Reset all states at the beginning
        setWaterValue('');
        setGasValue('');
        setWaterSaved(false);
        setGasSaved(false);
        setWaterId(null);
        setGasId(null);
        setPrevWater(0);
        setPrevGas(0);

        const docRef = doc(db, "apartments", id as string);
        const docSnap = await getDoc(docRef);
        const aptData = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as any : null;

        if (aptData) {
          setApartment({
            ...aptData,
            residentName: aptData.resident_name || aptData.residentName,
            residentRole: aptData.resident_role || aptData.residentRole,
            avatarUrl: aptData.avatar_url || aptData.avatarUrl
          });
        }

        const querySnapshot = await getDocs(collection(db, "apartments"));
        const allApts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        if (allApts.length > 0) {
          const sortedApts = allApts.sort((a, b) => {
            const numA = parseInt(a.number);
            const numB = parseInt(b.number);
            if (a.block !== b.block) return (a.block || '').localeCompare(b.block || '');
            return (numA || 0) - (numB || 0);
          });

          setAllApartments(sortedApts);
          const idx = sortedApts.findIndex(a => a.id === id);
          setCurrentIndex(idx);
        }

        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59);

        const allReadsQuery = query(
          collection(db, 'readings'),
          where('date', '>=', startOfMonth.toISOString().split('T')[0]),
          where('date', '<=', endOfMonth.toISOString().split('T')[0] + 'T23:59:59')
        );
        const allReadsSnap = await getDocs(allReadsQuery);
        const allReadsData = allReadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        setAllMonthReadings(allReadsData);

        const reads = allReadsData.filter((r: any) => r.apartment_id === id);

        if (reads.length > 0) {
          const water = reads.find(r => r.type === 'water');
          if (water) {
            setWaterValue(String(water.current_value || ''));
            setWaterSaved(true);
            setWaterCollapsed(true);
            setWaterId(water.id);
          } else {
            setWaterValue('');
            setWaterSaved(false);
            setWaterCollapsed(false);
            setWaterId(null);
          }

          const gas = reads.find(r => r.type === 'gas');
          if (gas) {
            setGasValue(String(gas.current_value || ''));
            setGasSaved(true);
            setGasCollapsed(true);
            setGasId(gas.id);
          } else {
            setGasValue('');
            setGasSaved(false);
            setGasCollapsed(false);
            setGasId(null);
          }
        }

        const qPrev = query(
          collection(db, 'readings'),
          where('apartment_id', '==', id)
        );
        
        const querySnapPrev = await getDocs(qPrev);
        const prevReads = querySnapPrev.docs
          .map(doc => doc.data() as any)
          .filter((r: any) => r.date < startOfMonth.toISOString().split('T')[0])
          .sort((a, b) => b.date.localeCompare(a.date));

        if (prevReads.length > 0) {
          const prevWaterRead = prevReads.find((r: any) => r.type === 'water');
          setPrevWater(prevWaterRead ? Number(prevWaterRead.current_value || 0) : 0);
          const prevGasRead = prevReads.find((r: any) => r.type === 'gas');
          setPrevGas(prevGasRead ? Number(prevGasRead.current_value || 0) : 0);
        }
      };
      fetchData();
    }
  }, [id, referenceDate.toISOString()]);

  if (!apartment) return <div className="p-10 text-center text-slate-500 font-bold">Carregando...</div>;

  const handleSaveWater = async () => {
    if (id && waterValue !== '') {
      const currentVal = parseFloat(waterValue);
      const payload = {
        apartment_id: id,
        type: 'water',
        previous_value: prevWater,
        current_value: currentVal,
        date: referenceDate.toISOString().split('T')[0],
        status: 'LIDO'
      };

      try {
        if (waterId) {
          await updateDoc(doc(db, 'readings', waterId), payload);
        } else {
          const docRef = await addDoc(collection(db, 'readings'), payload);
          setWaterId(docRef.id);
        }
        setWaterSaved(true);
        setWaterCollapsed(true);
      } catch (e: any) {
        alert('Erro ao salvar: ' + e.message);
      }
    }
  };

  const handleDeleteWater = async () => {
    if (waterId && confirm('Excluir leitura de ÁGUA?')) {
      try {
        await deleteDoc(doc(db, 'readings', waterId));
        setWaterValue('');
        setWaterId(null);
        setWaterSaved(false);
      } catch (e: any) {
        alert('Erro ao excluir: ' + e.message);
      }
    }
  };

  const handleSaveGas = async () => {
    if (id && gasValue !== '') {
      const currentVal = parseFloat(gasValue);
      const payload = {
        apartment_id: id,
        type: 'gas',
        previous_value: prevGas,
        current_value: currentVal,
        date: referenceDate.toISOString().split('T')[0],
        status: 'LIDO'
      };

      try {
        if (gasId) {
          await updateDoc(doc(db, 'readings', gasId), payload);
        } else {
          const docRef = await addDoc(collection(db, 'readings'), payload);
          setGasId(docRef.id);
        }
        setGasSaved(true);
        setGasCollapsed(true);
      } catch (e: any) {
        alert('Erro ao salvar: ' + e.message);
      }
    }
  };

  const handleDeleteGas = async () => {
    if (gasId && confirm('Excluir leitura de GÁS?')) {
      try {
        await deleteDoc(doc(db, 'readings', gasId));
        setGasValue('');
        setGasId(null);
        setGasSaved(false);
      } catch (e: any) {
        alert('Erro ao excluir: ' + e.message);
      }
    }
  };

  return (
    <div className="pb-safe pt-safe flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-dark p-5 md:p-6 border-b dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button onClick={() => { if (currentIndex > 0) navigate(`/readings/${allApartments[currentIndex - 1].id}?date=${referenceDate.toISOString()}`, { replace: true }); }} disabled={currentIndex <= 0} className="size-10 h-14 rounded-full bg-slate-100 dark:bg-gray-800 text-primary disabled:opacity-30 flex items-center justify-center">
            <span className="material-symbols-outlined text-base font-bold">arrow_back</span>
          </button>
          <div ref={listRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowAptList(prev => !prev)}
              className="w-full rounded-[28px] border border-slate-200 bg-white px-6 py-4 min-h-[88px] text-left shadow-lg shadow-slate-200/30 transition hover:border-slate-300"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">APTO</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black uppercase tracking-[0.36em] text-slate-900 leading-none">{apartment?.number || 'COND.'}</span>
                <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-500">BL {apartment?.block || 'A'}</span>
                <span className="material-symbols-outlined text-xl text-slate-400">expand_more</span>
              </div>
            </button>

            {showAptList && (
              <div className="fixed inset-0 bg-slate-50 dark:bg-background-dark z-[100] overflow-y-auto pb-safe">
                <div className="sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Unidades</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selecione para medir</p>
                  </div>
                  <button onClick={() => setShowAptList(false)} className="size-10 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined font-bold">close</span>
                  </button>
                </div>
                <div className="p-6 space-y-8">
                  {Object.entries(
                    allApartments.reduce((acc, apt) => {
                      const block = apt.block || 'A';
                      if (!acc[block]) acc[block] = [];
                      acc[block].push(apt);
                      return acc;
                    }, {} as Record<string, any[]>)
                  ).sort().map(([blockName, apts]) => (
                    <div key={blockName} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-gray-800"></div>
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#7a1b3c]">Bloco {blockName}</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-gray-800"></div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {(apts as any[]).map(apt => {
                          const aptReads = allMonthReadings.filter(r => r.apartment_id === apt.id);
                          const hasWater = aptReads.some(r => r.type === 'water');
                          const hasGas = aptReads.some(r => r.type === 'gas');
                          const isCurrent = apt.id === apartment?.id;
                          
                          return (
                            <button
                              key={apt.id}
                              onClick={() => {
                                setShowAptList(false);
                                navigate(`/readings/${apt.id}?date=${referenceDate.toISOString()}`);
                              }}
                              className={`aspect-square rounded-[20px] flex flex-col items-center justify-center relative transition-transform active:scale-95 ${
                                isCurrent 
                                  ? 'bg-[#7a1b3c] text-white shadow-lg shadow-[#7a1b3c]/30' 
                                  : 'bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-800 shadow-sm'
                              }`}
                            >
                              <span className="text-xl font-black tracking-tighter">{apt.number || '00'}</span>
                              
                              <div className="absolute top-2 right-2 flex gap-1">
                                <div className={`size-2 rounded-full ${hasWater ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                <div className={`size-2 rounded-full ${hasGas ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => { if (currentIndex < allApartments.length - 1) navigate(`/readings/${allApartments[currentIndex + 1].id}?date=${referenceDate.toISOString()}`, { replace: true }); }} disabled={currentIndex === -1 || currentIndex >= allApartments.length - 1} className="size-10 h-14 rounded-full bg-slate-100 dark:bg-gray-800 text-primary disabled:opacity-30 flex items-center justify-center">
            <span className="material-symbols-outlined text-base font-bold">arrow_forward</span>
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#7a1b3c]">
            Referência: {referenceDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="p-5 space-y-6">
        <section className={`transition-all duration-500 ${waterSaved ? 'opacity-80 scale-[0.98]' : ''}`}>
          <div className="bg-white dark:bg-surface-dark rounded-[40px] p-7 shadow-sm border border-white dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-2xl fill-1">water_drop</span>
                </div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-base">Medição de Água</h2>
              </div>
              {waterId && (
                <button onClick={handleDeleteWater} className="size-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                </button>
              )}
            </div>

            {waterCollapsed && waterSaved ? (
              <div className="mt-6 flex flex-col gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Água LIDO</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{parseFloat(waterValue).toFixed(2)} m³</p>
                    <p className="text-xs text-slate-500 mt-1">Consumo: {(parseFloat(waterValue) - prevWater).toFixed(2)} m³</p>
                  </div>
                  <button onClick={() => setWaterCollapsed(false)} className="h-12 rounded-[20px] bg-white border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[0.35em] text-slate-700 shadow-sm hover:bg-slate-100">
                    Editar
                  </button>
                </div>
                <div className="rounded-[24px] bg-blue-50 dark:bg-blue-900/10 p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-200 text-center">Medição de Água Salva!</p>
                  <button onClick={() => setShowAptList(true)} className="w-full h-12 bg-white dark:bg-slate-800 rounded-xl text-xs font-black text-blue-600 uppercase tracking-[2px] shadow-sm">
                    Selecionar Próxima Unidade
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3 px-1">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual (m³)</label>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Anterior</span>
                    <div className="text-xs font-black text-primary italic">{prevWater.toFixed(2)} m³</div>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block">Leitura Atual</label>
                    <input type="number" step="0.01" value={waterValue} onChange={(e) => { setWaterValue(e.target.value); setWaterSaved(false); setWaterCollapsed(false); }} placeholder="0.00" className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-4 text-center dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block">Consumo</label>
                    <div className="w-full h-20 bg-blue-50 dark:bg-blue-900/10 rounded-[24px] flex items-center justify-center border-2 border-blue-100">
                      <span className="text-xl font-black text-blue-600">
                        {waterValue ? (parseFloat(waterValue) - prevWater).toFixed(2) : '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveWater} disabled={waterValue === ''} className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs transition-all ${waterSaved ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                  {waterSaved ? 'Salvo com Sucesso' : 'Salvar Água'}
                </button>
              </div>
            )}
          </div>
        </section>

        <section ref={gasSectionRef} className={`transition-all duration-500 ${gasSaved ? 'opacity-80 scale-[0.98]' : ''}`}>
          <div className="bg-white dark:bg-surface-dark rounded-[40px] p-7 shadow-sm border border-white dark:border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                  <span className="material-symbols-outlined text-2xl fill-1">local_fire_department</span>
                </div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-base">Medição de Gás</h2>
              </div>
              {gasId && (
                <button onClick={handleDeleteGas} className="size-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                </button>
              )}
            </div>

            {gasCollapsed && gasSaved ? (
              <div className="mt-6 flex flex-col gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Gás LIDO</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{parseFloat(gasValue).toFixed(3)} m³</p>
                    <p className="text-xs text-slate-500 mt-1">Consumo: {(parseFloat(gasValue) - prevGas).toFixed(3)} m³</p>
                  </div>
                  <button onClick={() => setGasCollapsed(false)} className="h-12 rounded-[20px] bg-white border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[0.35em] text-slate-700 shadow-sm hover:bg-slate-100">
                    Editar
                  </button>
                </div>
                <div className="rounded-[24px] bg-green-50 dark:bg-green-900/10 p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-200 text-center">Leituras concluídas!</p>
                  <button onClick={() => setShowAptList(true)} className="w-full h-12 bg-white dark:bg-slate-800 rounded-xl text-xs font-black text-green-600 uppercase tracking-[2px] shadow-sm">
                    Selecionar Próxima Unidade
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 px-1">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Atual (m³)</label>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leitura Anterior</span>
                    <div className="text-xs font-black text-orange-600 italic">{prevGas.toFixed(3)} m³</div>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block">Leitura Atual</label>
                    <input type="number" step="0.001" value={gasValue} onChange={(e) => { setGasValue(e.target.value); setGasSaved(false); setGasCollapsed(false); }} placeholder="0.000" className="w-full h-20 bg-slate-50 dark:bg-gray-800 border-none rounded-[24px] text-3xl font-black px-4 text-center dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 inline-block">Consumo</label>
                    <div className="w-full h-20 bg-orange-50 dark:bg-orange-900/10 rounded-[24px] flex items-center justify-center border-2 border-orange-100">
                      <span className="text-xl font-black text-orange-600">
                        {gasValue ? (parseFloat(gasValue) - prevGas).toFixed(3) : '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveGas} disabled={gasValue === ''} className={`w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-xs transition-all ${gasSaved ? 'bg-green-500 text-white' : 'bg-orange-600/20 text-orange-600'}`}>
                  {gasSaved ? 'Salvo com Sucesso' : 'Salvar Gás'}
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="text-center py-4">
          <button onClick={() => navigate('/readings')} className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[4px] text-xs shadow-2xl">
            Voltar para Lista
          </button>
        </div>
      </main>

      <footer className="text-center p-8 opacity-30">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[5px]">Validação de Consumo • Luci Berkembrock</p>
      </footer>
    </div>
  );
};

export default ReadingForm;
