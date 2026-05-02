import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Registration {
    id: string;
    apartment_id: string;
    full_name: string;
    cpf: string;
    birth_date: string;
    phone: string;
    resident_type: string;
    garage_spot: string;
    is_financial_responsible: boolean;
    financial_responsible_name: string;
    financial_responsible_cpf: string;
    owner_name: string;
    owner_phone: string;
    additional_residents: any[];
    status: string;
    created_at: string;
    apartments: {
        number: string;
        block: string;
    };
}

const RegistrationManager: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [debugError, setDebugError] = useState<string | null>(null);
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [editFullName, setEditFullName] = useState('');
    const [editCpf, setEditCpf] = useState('');
    const [editBirthDate, setEditBirthDate] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editResidentType, setEditResidentType] = useState('');
    const [editGarageSpot, setEditGarageSpot] = useState('');
    const [editIsFinancialResponsible, setEditIsFinancialResponsible] = useState(true);
    const [editFinancialResponsibleName, setEditFinancialResponsibleName] = useState('');
    const [editFinancialResponsibleCpf, setEditFinancialResponsibleCpf] = useState('');
    const [editOwnerName, setEditOwnerName] = useState('');
    const [editOwnerPhone, setEditOwnerPhone] = useState('');
    const [editAdditionalResidents, setEditAdditionalResidents] = useState<any[]>([]);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    useEffect(() => {
        if (selectedReg && isEditing) {
            setEditFullName(selectedReg.full_name);
            setEditCpf(selectedReg.cpf);
            setEditBirthDate(selectedReg.birth_date);
            setEditPhone(selectedReg.phone);
            setEditResidentType(selectedReg.resident_type);
            setEditGarageSpot(selectedReg.garage_spot);
            setEditIsFinancialResponsible(selectedReg.is_financial_responsible);
            setEditFinancialResponsibleName(selectedReg.financial_responsible_name || '');
            setEditFinancialResponsibleCpf(selectedReg.financial_responsible_cpf || '');
            setEditOwnerName(selectedReg.owner_name || '');
            setEditOwnerPhone(selectedReg.owner_phone || '');
            setEditAdditionalResidents(selectedReg.additional_residents || []);
        }
    }, [selectedReg, isEditing]);

    const fetchRegistrations = async () => {
        try {
            setIsLoading(true);
            setDebugError(null);

            const aptsSnap = await getDocs(collection(db, 'apartments'));
            const aptsData = aptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const aptMap = new Map(aptsData.map((apt: any) => [apt.id, apt]));

            const regsSnap = await getDocs(query(
                collection(db, 'resident_registrations'),
                where('status', '==', 'PENDENTE')
            ));

            const registrationsData = regsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                apartments: aptMap.get((doc.data() as any).apartment_id) || { number: '??', block: '??' }
            }))
            .sort((a: any, b: any) => {
                const aTime = new Date(a.created_at).getTime() || 0;
                const bTime = new Date(b.created_at).getTime() || 0;
                return bTime - aTime;
            });

            setRegistrations(registrationsData || []);
        } catch (err: any) {
            setDebugError(`Erro de Rede/Execução: ${err.message || 'Falha na conexão'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const regRef = doc(db, 'resident_registrations', id);
        await updateDoc(regRef, { status });

        fetchRegistrations();
        setSelectedReg(null);
        setIsEditing(false);
    };

    const handleSaveEdits = async () => {
        if (!selectedReg) return;

        setIsSaving(true);
        const regRef = doc(db, 'resident_registrations', selectedReg.id);
        await updateDoc(regRef, {
            full_name: editFullName,
            cpf: editCpf,
            birth_date: editBirthDate,
            phone: editPhone,
            resident_type: editResidentType,
            garage_spot: editGarageSpot,
            is_financial_responsible: editIsFinancialResponsible,
            financial_responsible_name: editIsFinancialResponsible ? null : editFinancialResponsibleName,
            financial_responsible_cpf: editIsFinancialResponsible ? null : editFinancialResponsibleCpf.replace(/\D/g, ''),
            owner_name: editResidentType === 'Inquilino' ? editOwnerName : null,
            owner_phone: editResidentType === 'Inquilino' ? editOwnerPhone.replace(/\D/g, '') : null,
            additional_residents: editAdditionalResidents
        });

        const updatedReg = {
            ...selectedReg,
            full_name: editFullName,
            cpf: editCpf,
            birth_date: editBirthDate,
            phone: editPhone,
            resident_type: editResidentType,
            garage_spot: editGarageSpot,
            is_financial_responsible: editIsFinancialResponsible,
            financial_responsible_name: editIsFinancialResponsible ? null : editFinancialResponsibleName,
            financial_responsible_cpf: editIsFinancialResponsible ? null : editFinancialResponsibleCpf.replace(/\D/g, ''),
            owner_name: editResidentType === 'Inquilino' ? editOwnerName : null,
            owner_phone: editResidentType === 'Inquilino' ? editOwnerPhone.replace(/\D/g, '') : null,
            additional_residents: editAdditionalResidents
        } as Registration;
        setSelectedReg(updatedReg);
        setIsEditing(false);
        fetchRegistrations();
        setIsSaving(false);
    };

    const handleApplyToUnit = async (reg: Registration) => {
        const aptRef = doc(db, 'apartments', reg.apartment_id);
        await updateDoc(aptRef, {
            resident_name: reg.full_name,
            resident_role: reg.resident_type
        });

        handleUpdateStatus(reg.id, 'APROVADO');
    };

    const handleCloseModal = () => {
        setSelectedReg(null);
        setIsEditing(false);
    };

    const handleDeleteRegistration = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este formulário? A unidade não será apagada, apenas o cadastro do morador.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'resident_registrations', id));
            fetchRegistrations();
            setSelectedReg(null);
            setIsEditing(false);
        } catch (err: any) {
            alert('Erro ao excluir o formulário. Tente novamente.');
        }
    };

    const formatCPF = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        }
        return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    };

    return (
        <div className="flex flex-col flex-1 bg-slate-50 dark:bg-background-dark">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-surface-dark border-b dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Formulário</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {registrations.filter(r => r.status === 'PENDENTE').length} Pendentes para revisão
                    </p>
                </div>
                <button
                    onClick={() => window.open('/cadastro', '_blank')}
                    className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Abrir Formulário de Cadastro"
                >
                    <span className="material-symbols-outlined">link</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {debugError && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl mb-4">
                        <p className="font-bold uppercase text-xs tracking-widest mb-1 items-center flex gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            Erro nos Formulários
                        </p>
                        <pre className="text-[10px] items-center font-bold uppercase tracking-tighter whitespace-pre-wrap leading-tight">{debugError}</pre>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : registrations.length === 0 ? (
                    <div className="text-center p-12">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    registrations.map((reg) => (
                        <div
                            key={reg.id}
                            onClick={() => setSelectedReg(reg)}
                            className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-primary/5 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                    Apto {reg.apartments.number} - Bloco {reg.apartments.block}
                                </div>
                                <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${reg.status === 'PENDENTE' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {reg.status}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{reg.full_name}</h3>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                                {new Date(reg.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Modal / Sidebar for details */}
            {selectedReg && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b dark:border-gray-800 flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Unidade {selectedReg.apartments.number}</div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">
                                    {isEditing ? 'Editando Dados' : selectedReg.full_name}
                                </h2>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRegistration(selectedReg.id)}
                                            className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            title="Excluir Formulário"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </>
                                )}
                                <button onClick={handleCloseModal} className="size-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {isEditing ? (
                                // Edit Mode
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={editFullName}
                                            onChange={(e) => setEditFullName(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                                            <input
                                                type="text"
                                                value={editCpf}
                                                onChange={(e) => setEditCpf(formatCPF(e.target.value))}
                                                maxLength={14}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nascimento</label>
                                            <input
                                                type="date"
                                                value={editBirthDate}
                                                onChange={(e) => setEditBirthDate(e.target.value)}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                                            maxLength={15}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                                            <select
                                                value={editResidentType}
                                                onChange={(e) => setEditResidentType(e.target.value)}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            >
                                                <option value="Proprietário">Proprietário</option>
                                                <option value="Inquilino">Inquilino</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vaga</label>
                                            <input
                                                type="text"
                                                value={editGarageSpot}
                                                onChange={(e) => setEditGarageSpot(e.target.value)}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditIsFinancialResponsible(!editIsFinancialResponsible)}
                                                className={`size-6 rounded-lg border-2 transition-all flex items-center justify-center ${editIsFinancialResponsible
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border-slate-200 dark:border-slate-600'
                                                    }`}
                                            >
                                                {editIsFinancialResponsible && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                            </button>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Responsável pelo boleto
                                            </span>
                                        </div>

                                        {!editIsFinancialResponsible && (
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Responsável Financeiro</label>
                                                    <input
                                                        type="text"
                                                        value={editFinancialResponsibleName}
                                                        onChange={(e) => setEditFinancialResponsibleName(e.target.value)}
                                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF do Responsável</label>
                                                    <input
                                                        type="text"
                                                        value={editFinancialResponsibleCpf}
                                                        onChange={(e) => setEditFinancialResponsibleCpf(formatCPF(e.target.value))}
                                                        maxLength={14}
                                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {editResidentType === 'Inquilino' && (
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietário</h4>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Proprietário</label>
                                                <input
                                                    type="text"
                                                    value={editOwnerName}
                                                    onChange={(e) => setEditOwnerName(e.target.value)}
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone do Proprietário</label>
                                                <input
                                                    type="tel"
                                                    value={editOwnerPhone}
                                                    onChange={(e) => setEditOwnerPhone(formatPhone(e.target.value))}
                                                    maxLength={15}
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outros Moradores</h4>
                                            <button
                                                type="button"
                                                onClick={() => setEditAdditionalResidents([...editAdditionalResidents, { name: '', birthDate: '', cpf: '' }])}
                                                className="text-[9px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-md"
                                            >
                                                + Adicionar
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {editAdditionalResidents.map((res, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800 relative space-y-3 shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditAdditionalResidents(editAdditionalResidents.filter((_, i) => i !== idx))}
                                                        className="absolute top-2 right-2 size-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-transform"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome</label>
                                                        <input
                                                            type="text"
                                                            value={res.name}
                                                            onChange={(e) => {
                                                                const updated = [...editAdditionalResidents];
                                                                updated[idx] = { ...updated[idx], name: e.target.value };
                                                                setEditAdditionalResidents(updated);
                                                            }}
                                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                                                            <input
                                                                type="text"
                                                                value={res.cpf || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editAdditionalResidents];
                                                                    updated[idx] = { ...updated[idx], cpf: formatCPF(e.target.value) };
                                                                    setEditAdditionalResidents(updated);
                                                                }}
                                                                maxLength={14}
                                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nascimento</label>
                                                            <input
                                                                type="date"
                                                                value={res.birthDate || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editAdditionalResidents];
                                                                    updated[idx] = { ...updated[idx], birthDate: e.target.value };
                                                                    setEditAdditionalResidents(updated);
                                                                }}
                                                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {editAdditionalResidents.length === 0 && (
                                                <div className="text-[9px] text-slate-400 uppercase font-bold text-center py-2">Nenhum morador adicional</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // View Mode
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.cpf || 'Não informado'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nascimento</label>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {selectedReg.birth_date ? new Date(selectedReg.birth_date).toLocaleDateString('pt-BR') : '-'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.resident_type}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vaga</label>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedReg.garage_spot}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável Financeiro</label>
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-800">
                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {selectedReg.is_financial_responsible ? 'O próprio morador' : (
                                                    <div className="space-y-1">
                                                        <div>{selectedReg.financial_responsible_name}</div>
                                                        <div className="text-[10px] text-slate-400">CPF: {selectedReg.financial_responsible_cpf ? formatCPF(selectedReg.financial_responsible_cpf) : '-'}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedReg.resident_type === 'Inquilino' && (selectedReg.owner_name || selectedReg.owner_phone) && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proprietário</label>
                                            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedReg.owner_name || 'Nome não informado'}</div>
                                                    {selectedReg.owner_phone && (
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            Tel: {formatPhone(selectedReg.owner_phone)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedReg.additional_residents.length > 0 && (
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outros Moradores ({selectedReg.additional_residents.length})</label>
                                            <div className="space-y-3">
                                                {selectedReg.additional_residents.map((res: any, i: number) => (
                                                    <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-surface-dark shadow-sm">
                                                        <div className="text-sm font-bold text-slate-800 dark:text-white">{res.name}</div>
                                                        <div className="flex gap-4 mt-1">
                                                            <span className="text-[10px] text-slate-400 font-medium">CPF: {res.cpf || '-'}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">DN: {res.birthDate ? new Date(res.birthDate).toLocaleDateString('pt-BR') : '-'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-gray-700 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEdits}
                                        disabled={isSaving}
                                        className="flex-[2] h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg">save</span>
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReg.id, 'REJEITADO')}
                                        className="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-gray-700 text-[10px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Rejeitar
                                    </button>
                                    <button
                                        onClick={() => handleApplyToUnit(selectedReg)}
                                        className="flex-[2] h-14 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Aprovar e Atualizar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div >
            )
            }
        </div >
    );
};

export default RegistrationManager;
