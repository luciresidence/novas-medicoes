import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { reportService } from '../services/reportService';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const referenceDate = dateParam ? new Date(dateParam) : new Date();

  const [apartments, setApartments] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formattedMonth = referenceDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const aptsSnap = await getDocs(collection(db, 'apartments'));
        const aptsData = aptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApartments(aptsData);

        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59);

        const qReads = query(
          collection(db, 'readings'),
          where('date', '>=', startOfMonth.toISOString().split('T')[0]),
          where('date', '<=', endOfMonth.toISOString().split('T')[0] + 'T23:59:59')
        );

        const readsSnap = await getDocs(qReads);
        const readsData = readsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReadings(readsData);
      } catch (err: any) {
        console.error(err);
        setError('Falha ao carregar dados de relatórios.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [referenceDate.toISOString()]);

  const waterCount = readings.filter(r => r.type === 'water').length;
  const gasCount = readings.filter(r => r.type === 'gas').length;

  return (
    <div className="pb-32 pt-safe flex-1 bg-white min-h-screen">
      <div className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate('/readings')}
            className="size-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div className="text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-slate-400">Relatórios</p>
            <h1 className="text-xl font-black uppercase tracking-[0.25em] text-[#7a1b3c]">{formattedMonth}</h1>
          </div>
          <div className="size-11 rounded-full bg-[#7a1b3c] text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">description</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-3">Resumo de leituras</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] bg-white p-4 text-center shadow-xs">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Unidades</p>
                <p className="mt-3 text-2xl font-black text-[#7a1b3c]">{apartments.length}</p>
              </div>
              <div className="rounded-[24px] bg-white p-4 text-center shadow-xs">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Leituras</p>
                <p className="mt-3 text-2xl font-black text-[#7a1b3c]">{readings.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-[24px] bg-blue-50 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-blue-600">Água</p>
                <p className="mt-3 text-2xl font-black text-blue-600">{waterCount}</p>
              </div>
              <div className="rounded-[24px] bg-orange-50 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-600">Gás</p>
                <p className="mt-3 text-2xl font-black text-orange-600">{gasCount}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[32px] border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!error && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Ações do relatório</p>
              <button
                onClick={() => reportService.generateMonthlyPDF(readings, apartments, formattedMonth)}
                disabled={loading || readings.length === 0}
                className="w-full h-16 rounded-[24px] bg-[#7a1b3c] text-white font-black uppercase tracking-[0.35em] disabled:opacity-50"
              >
                Baixar PDF
              </button>
              <button
                onClick={() => reportService.generateMonthlyExcel(readings, apartments)}
                disabled={loading || readings.length === 0}
                className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-[0.35em] disabled:opacity-50"
              >
                Baixar Excel
              </button>
              {readings.length === 0 && (
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.35em] text-center">Nenhuma leitura encontrada para este mês.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
