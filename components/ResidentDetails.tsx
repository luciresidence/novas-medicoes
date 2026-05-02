
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { storage } from '../data';
import { Apartment } from '../types';

const ResidentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setIsLoading(true);
        // Fetch Apartment basic info
        const aptRef = doc(db, 'apartments', id);
        const aptSnap = await getDoc(aptRef);

        if (aptSnap.exists()) {
          const aptData = aptSnap.data() as any;
          setApartment({
            id: aptSnap.id,
            ...aptData,
            residentName: aptData.resident_name,
            residentRole: aptData.resident_role,
            avatarUrl: aptData.avatar_url
          });
        }

        // Fetch latest approved registration for this apartment
        const regsSnap = await getDocs(query(
          collection(db, 'resident_registrations'),
          where('apartment_id', '==', id)
        ));

        const approvedRegs = regsSnap.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
          .filter((reg: any) => reg.status === 'APROVADO')
          .sort((a: any, b: any) => {
            const aTime = new Date(a.created_at).getTime() || 0;
            const bTime = new Date(b.created_at).getTime() || 0;
            return bTime - aTime;
          });

        if (approvedRegs.length > 0) {
          setRegistration(approvedRegs[0]);
        }
        setIsLoading(false);
      };
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-background-dark">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!apartment) return null;

  const handleWhatsApp = () => {
    if (registration?.phone) {
      const phone = registration.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${phone}`, '_blank');
    } else {
      alert('Telefone não cadastrado');
    }
  };

  const handleCall = () => {
    if (registration?.phone) {
      window.location.href = `tel:${registration.phone}`;
    } else {
      alert('Telefone não cadastrado');
    }
  };

  return (
    <div className="pb-32 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark px-4 py-4 flex items-center justify-between border-b dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 text-primary">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Detalhes da Unidade</h2>
        <button
          onClick={() => navigate(`/units/${id}/edit`)}
          className="text-primary font-black px-2 py-1 text-[10px] uppercase tracking-widest bg-primary/5 rounded-lg border border-primary/10"
        >
          Editar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center pt-8 pb-8 bg-white dark:bg-surface-dark mb-4 border-b dark:border-gray-800">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase text-center px-4">{apartment.residentName || 'Unidade Vazia'}</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] mt-1">Apt {apartment.number} - Bloco {apartment.block}</p>
          <div className="mt-4 px-4 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-full text-[9px] font-black uppercase tracking-widest">
            {apartment.residentRole || 'Sem Vínculo'}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-8 grid grid-cols-3 gap-3">
          <button
            onClick={handleCall}
            className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-sm active:scale-95 transition-all border border-slate-50 dark:border-gray-800"
          >
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Ligar</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-sm active:scale-95 transition-all border border-slate-50 dark:border-gray-800"
          >
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">WhatsApp</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-surface-dark rounded-[24px] shadow-sm active:scale-95 transition-all border border-slate-50 dark:border-gray-800"
          >
            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-2xl">history</span>
            </div>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Histórico</span>
          </button>
        </div>

        {/* Info List */}
        <div className="px-4 space-y-4 mb-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadastro Completo</h3>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md">Status: Ativo</span>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[32px] shadow-sm border border-slate-50 dark:border-gray-800 overflow-hidden divide-y dark:divide-gray-800">
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{registration?.cpf || '---'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nascimento</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {registration?.birth_date ? new Date(registration.birth_date).toLocaleDateString('pt-BR') : '---'}
                </p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vaga de Garagem</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{registration?.garage_spot || '---'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{registration?.phone || '---'}</p>
              </div>
            </div>

            {(registration?.owner_name || registration?.owner_phone) && (
              <div className="p-5 border-t dark:border-gray-800">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Proprietário (Inquilino)</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">person_pin</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {registration?.owner_name || '---'}
                    </p>
                  </div>
                  {registration?.owner_phone && (
                    <div className="flex items-center gap-2 ml-7">
                      <span className="material-symbols-outlined text-xs text-slate-400">call</span>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {registration.owner_phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável Financeiro</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">payments</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {registration?.is_financial_responsible ? 'O Próprio Morador' : registration?.financial_responsible_name || '---'}
                  </p>
                </div>
                {!registration?.is_financial_responsible && registration?.financial_responsible_cpf && (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-7">
                    CPF: {registration.financial_responsible_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </p>
                )}
              </div>
            </div>

            {registration?.additional_residents?.length > 0 && (
              <div className="p-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Moradores Adicionais</p>
                <div className="space-y-2">
                  {registration.additional_residents.map((res: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-lg">person</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">{res.name}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase">CPF: {res.cpf || '---'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Fixed Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-12 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t dark:border-gray-800 max-w-md mx-auto z-40">
        <button
          onClick={() => navigate(`/readings/${id}`)}
          className="w-full bg-primary text-white h-16 rounded-3xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          Registrar Nova Leitura
        </button>
      </div>
    </div>
  );
};

export default ResidentDetails;
