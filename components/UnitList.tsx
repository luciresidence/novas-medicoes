
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { storage } from '../data';
import { Apartment } from '../types';

const LogoSmall = () => (
  <div className="flex items-center gap-2">
    <svg width="40" height="30" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="85" cy="70" rx="35" ry="50" fill="#a66384" fillOpacity="0.7" transform="rotate(-15 85 70)" />
      <ellipse cx="115" cy="70" rx="35" ry="50" fill="#802e53" fillOpacity="0.8" transform="rotate(15 115 70)" />
    </svg>
    <div className="flex flex-col">
      <h1 className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none">Luci Berkembrock</h1>
      <p className="text-[6px] font-bold text-primary/60 uppercase tracking-[2px] mt-0.5">Residence</p>
    </div>
  </div>
);

const UnitList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [units, setUnits] = useState<Apartment[]>([]);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const unitsSnap = await getDocs(collection(db, 'apartments'));
        const data = unitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (data) {
          console.log(`Recebidos ${data.length} apartamentos`);
          if (data.length === 0) {
            setDebugError("O banco retornou ZERO apartamentos. Verifique se as tabelas estão populadas.");
          }
          
          const mappedUnits = data.map(apt => ({
            ...apt,
            residentName: apt.resident_name || 'Unidade Vazia',
            residentRole: apt.resident_role || 'Residente',
            avatarUrl: apt.avatar_url || ''
          }));

          // Ordenação customizada
          const sortedUnits = mappedUnits.sort((a, b) => {
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            const isNumericA = !isNaN(parseInt(a.number));
            const isNumericB = !isNaN(parseInt(b.number));

            if (!isNumericA && isNumericB) return -1;
            if (isNumericA && !isNumericB) return 1;

            if (!isNumericA && !isNumericB) {
              return (a.number || '').localeCompare(b.number || '');
            }

            if (a.block !== b.block) {
              return (a.block || '').localeCompare(b.block || '');
            }

            return numA - numB;
          });

          setUnits(sortedUnits);
        }
      } catch (err: any) {
        setDebugError(`Erro de Execução: ${err.message || 'Falha desconhecida'}`);
      }
    };
    fetchUnits();
  }, []);

  const filtered = units.filter(ap =>
    ap.number.includes(searchTerm) || (ap.residentName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-32 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark">
      <header className="px-5 py-6 bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <LogoSmall />
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[2px]">Gestão de Unidades</p>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* Search */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">search</span>
          <input
            type="text"
            placeholder="Apto ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-dark border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
          />
        </div>

        {/* Cadastro Unidade Button below search */}
        <button
          onClick={() => navigate('/units/new')}
          className="w-full h-16 bg-primary text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          Cadastro Unidade
        </button>

        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Ativas ({filtered.length})</h3>
        </div>

        {/* List */}
        <div className="space-y-4">
          {debugError && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl mb-4">
              <p className="font-bold">Erro técnico capturado:</p>
              <pre className="text-xs whitespace-pre-wrap">{debugError}</pre>
            </div>
          )}

          {filtered.length === 0 && !debugError ? (
            <div className="py-24 text-center">
              <div className="size-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-slate-200 mb-4">
                <span className="material-symbols-outlined text-4xl">domain</span>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma unidade ativa</p>
            </div>
          ) : (
            filtered.map((ap) => (
              <div
                key={ap.id}
                onClick={() => navigate(`/residents/${ap.id}`)}
                className="bg-white dark:bg-surface-dark p-5 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-gray-800 active:scale-[0.98] transition-all relative group overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-2xl bg-slate-50 dark:bg-gray-800 flex flex-col items-center justify-center border border-slate-100 dark:border-gray-700 shadow-inner flex-shrink-0">
                    <span className={`text-lg font-black leading-none tracking-tighter ${ap.block === 'B' ? 'text-[#166534]' : 'text-primary'}`}>{ap.number}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Bl {ap.block}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 dark:text-white truncate text-lg uppercase tracking-tighter leading-tight">
                      {ap.residentName || 'Unidade Vazia'}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${ap.residentRole === 'Proprietário'
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                        }`}>
                        {ap.residentRole || 'Sem Vínculo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-slate-300">contacts</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Informações OK</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/units/${ap.id}/edit`);
                      }}
                      className="size-10 rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitList;
