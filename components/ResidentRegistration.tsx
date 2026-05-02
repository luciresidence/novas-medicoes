import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';

interface Apartment {
    id: string;
    number: string;
    block: string;
}

interface AdditionalResident {
    name: string;
    cpf: string;
    birthDate: string;
    phone: string;
}

const ResidentRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [success, setSuccess] = useState(false);

    // Form State
    const [selectedApartment, setSelectedApartment] = useState('');
    const [fullName, setFullName] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [phone, setPhone] = useState('');
    const [residentType, setResidentType] = useState('Proprietário');
    const [garageSpot, setGarageSpot] = useState('');
    const [isFinancialResponsible, setIsFinancialResponsible] = useState(true);
    const [financialResponsibleName, setFinancialResponsibleName] = useState('');
    const [financialResponsibleCpf, setFinancialResponsibleCpf] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [additionalResidents, setAdditionalResidents] = useState<AdditionalResident[]>([]);

    useEffect(() => {
        fetchApartments();
    }, []);

    const fetchApartments = async () => {
        setIsLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'apartments'), orderBy('number')));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApartments(data as Apartment[]);
        } catch (error: any) {
            setErrors(prev => ({ ...prev, general: 'Erro ao carregar unidades.' }));
        }
        setIsLoading(false);
    };

    const handleAddResident = () => {
        setAdditionalResidents([...additionalResidents, { name: '', cpf: '', birthDate: '', phone: '' }]);
    };

    const handleRemoveResident = (index: number) => {
        setAdditionalResidents(additionalResidents.filter((_, i) => i !== index));
    };

    const handleUpdateAdditional = (index: number, field: keyof AdditionalResident, value: string) => {
        const updated = [...additionalResidents];
        let finalValue = value;

        if (field === 'cpf') finalValue = formatCPF(value);
        if (field === 'phone') finalValue = formatPhone(value);

        updated[index][field] = finalValue;
        setAdditionalResidents(updated);

        // Clear error if field is filled
        if (finalValue.trim()) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`additional_${index}_${field}`];
                return newErrors;
            });
        }
    };

    // Validation Helpers
    const validateCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        if (cleanCPF.length !== 11) return false;

        // Basic invalid patterns
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

        // Checksum validation
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

        return true;
    };

    const validatePhone = (phone: string) => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        // BR Phone: 10 or 11 digits (DD + Number)
        return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    };

    // Input Masks
    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    // Real-time Handlers
    const handleCpfChange = (value: string) => {
        const formatted = formatCPF(value);
        setCpf(formatted);

        if (formatted.length === 14) {
            if (!validateCPF(formatted)) {
                setErrors(prev => ({ ...prev, cpf: 'CPF inválido. Verifique os números.' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.cpf;
                    return newErrors;
                });
            }
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.cpf;
                return newErrors;
            });
        }
    };

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhone(value);
        setPhone(formatted);

        const cleanLen = formatted.replace(/\D/g, '').length;
        if (cleanLen >= 10 && cleanLen <= 11) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.phone;
                return newErrors;
            });
        }
    };

    const handleGarageChange = (value: string) => {
        setGarageSpot(value);
        if (value.trim()) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.garageSpot;
                return newErrors;
            });
        }
    };

    const handleBirthDateChange = (value: string) => {
        setBirthDate(value);
        if (value) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.birthDate;
                return newErrors;
            });
        }
    };

    const validateStepData = (currentStep: number) => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (currentStep === 1) {
            if (!selectedApartment) {
                newErrors.selectedApartment = 'Selecione uma unidade.';
                isValid = false;
            }
        }

        if (currentStep === 2) {
            if (!fullName.trim()) {
                newErrors.fullName = 'Nome é obrigatório.';
                isValid = false;
            }
            if (!validateCPF(cpf)) {
                newErrors.cpf = 'CPF inválido.';
                isValid = false;
            }
            if (!birthDate) {
                newErrors.birthDate = 'Data obrigatória.';
                isValid = false;
            }
            if (!validatePhone(phone)) {
                newErrors.phone = 'Telefone inválido.';
                isValid = false;
            }
            if (!garageSpot.trim()) {
                newErrors.garageSpot = 'Vaga é obrigatória.';
                isValid = false;
            }
            if (!isFinancialResponsible) {
                if (!financialResponsibleName.trim()) {
                    newErrors.financialResponsibleName = 'Informe o responsável.';
                    isValid = false;
                }
                if (!validateCPF(financialResponsibleCpf)) {
                    newErrors.financialResponsibleCpf = 'CPF inválido.';
                    isValid = false;
                }
            }

            if (residentType === 'Inquilino') {
                if (!ownerName.trim()) {
                    newErrors.ownerName = 'Informe o proprietário.';
                    isValid = false;
                }
                if (!validatePhone(ownerPhone)) {
                    newErrors.ownerPhone = 'Telefone inválido.';
                    isValid = false;
                }
            }
        }

        if (currentStep === 3) {
            additionalResidents.forEach((res, idx) => {
                if (!res.name.trim()) {
                    newErrors[`additional_${idx}_name`] = 'Nome obrigatório';
                    isValid = false;
                }
                if (!res.birthDate) {
                    newErrors[`additional_${idx}_birthDate`] = 'Data obrigatória';
                    isValid = false;
                }
            });
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    const handleNextStep = () => {
        if (validateStepData(step)) {
            setStep(step + 1);
        }
    };

    const handleSubmit = async () => {
        // Only allow submission on step 3
        if (step !== 3) {
            return;
        }

        setErrors({});

        if (!validateStepData(step)) return;

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'resident_registrations'), {
                apartment_id: selectedApartment,
                full_name: fullName,
                cpf: cpf.replace(/[^\d]/g, ''),
                birth_date: birthDate,
                phone: phone.replace(/[^\d]/g, ''),
                resident_type: residentType,
                garage_spot: garageSpot,
                is_financial_responsible: isFinancialResponsible,
                financial_responsible_name: isFinancialResponsible ? null : financialResponsibleName,
                financial_responsible_cpf: isFinancialResponsible ? null : financialResponsibleCpf.replace(/[^\d]/g, ''),
                owner_name: residentType === 'Inquilino' ? ownerName : null,
                owner_phone: residentType === 'Inquilino' ? ownerPhone.replace(/[^\d]/g, '') : null,
                additional_residents: additionalResidents,
                status: 'PENDENTE',
                created_at: new Date().toISOString()
            });
            setSuccess(true);
        } catch (error: any) {
            setErrors(prev => ({ ...prev, general: 'Erro ao enviar: ' + (error.message || 'Falha no envio') }));
        }

        setIsSubmitting(false);
    };

    if (success) {
        return (
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] p-10 text-center shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Cadastro Enviado!</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Suas informações foram recebidas com sucesso. A administração do condomínio irá revisar os dados em breve.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 pb-20 overflow-y-auto">
            <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-primary to-primary-dark text-white">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Atualização Cadastral</h1>
                    <p className="text-white/70 text-xs sm:text-sm font-medium">Mantenha seus dados atualizados no Luci Berkembrock Residence</p>

                    <div className="flex gap-2 mt-6 sm:mt-8">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-white' : 'bg-white/20'}`}
                            />
                        ))}
                    </div>
                </div>

                <form className="p-8 space-y-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Qual a sua unidade?</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Identifique seu apartamento primeiro</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apto./Bloco</label>
                                    <select
                                        value={selectedApartment}
                                        onChange={(e) => {
                                            setSelectedApartment(e.target.value);
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.selectedApartment;
                                                return newErrors;
                                            });
                                        }}
                                        className={`w-full h-14 px-5 rounded-2xl border ${errors.selectedApartment ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50'} dark:bg-slate-900 dark:border-slate-700 text-slate-700 dark:text-white font-semibold text-sm focus:ring-4 focus:ring-primary/5 transition-all outline-none`}
                                    >
                                        <option value="">Selecione a Unidade</option>
                                        {apartments.map((ap) => (
                                            <option key={ap.id} value={ap.id}>
                                                Apto. {ap.number} - Bloco {ap.block}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.selectedApartment && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.selectedApartment}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dados do Morador Principal</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Preencha as informações do titular</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            if (e.target.value.trim()) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.fullName;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        className={`input-field ${errors.fullName ? '!border-red-400 !bg-red-50' : ''}`}
                                        placeholder="Nome como consta no documento"
                                    />
                                    {errors.fullName && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.fullName}</span>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                                        <input
                                            type="text"
                                            value={cpf}
                                            onChange={(e) => handleCpfChange(e.target.value)}
                                            maxLength={14}
                                            className={`input-field ${errors.cpf ? '!border-red-400 !bg-red-50' : ''}`}
                                            placeholder="000.000.000-00"
                                        />
                                        {errors.cpf && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.cpf}</span>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => handleBirthDateChange(e.target.value)}
                                            className={`input-field ${errors.birthDate ? '!border-red-400 !bg-red-50' : ''}`}
                                        />
                                        {errors.birthDate && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.birthDate}</span>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        maxLength={15}
                                        className={`input-field ${errors.phone ? '!border-red-400 !bg-red-50' : ''}`}
                                        placeholder="(00) 00000-0000"
                                    />
                                    {errors.phone && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.phone}</span>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vínculo</label>
                                        <select
                                            value={residentType}
                                            onChange={(e) => setResidentType(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="Proprietário">Proprietário</option>
                                            <option value="Inquilino">Inquilino</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vaga de Garagem</label>
                                        <input
                                            type="text"
                                            value={garageSpot}
                                            onChange={(e) => handleGarageChange(e.target.value)}
                                            className={`input-field ${errors.garageSpot ? '!border-red-400 !bg-red-50' : ''}`}
                                            placeholder="Nº da Vaga"
                                        />
                                        {errors.garageSpot && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.garageSpot}</span>}
                                    </div>
                                </div>

                                {residentType === 'Inquilino' && (
                                    <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Informações do Proprietário</h4>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Proprietário</label>
                                            <input
                                                type="text"
                                                value={ownerName}
                                                onChange={(e) => {
                                                    setOwnerName(e.target.value);
                                                    if (e.target.value.trim()) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.ownerName;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                className={`input-field ${errors.ownerName ? '!border-red-400 !bg-red-50' : ''}`}
                                                placeholder="Nome completo do proprietário"
                                            />
                                            {errors.ownerName && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.ownerName}</span>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp do Proprietário</label>
                                            <input
                                                type="tel"
                                                value={ownerPhone}
                                                onChange={(e) => {
                                                    const formatted = formatPhone(e.target.value);
                                                    setOwnerPhone(formatted);
                                                    const cleanLen = formatted.replace(/\D/g, '').length;
                                                    if (cleanLen >= 10 && cleanLen <= 11) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.ownerPhone;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                maxLength={15}
                                                className={`input-field ${errors.ownerPhone ? '!border-red-400 !bg-red-50' : ''}`}
                                                placeholder="(00) 00000-0000"
                                            />
                                            {errors.ownerPhone && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.ownerPhone}</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsFinancialResponsible(!isFinancialResponsible)}
                                            className={`size-6 rounded-lg border-2 transition-all flex items-center justify-center ${isFinancialResponsible
                                                ? 'bg-primary border-primary text-white'
                                                : 'border-slate-200 dark:border-slate-600'
                                                }`}
                                        >
                                            {isFinancialResponsible && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                        </button>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Sou o responsável pelo boleto do condomínio
                                        </span>
                                    </div>
                                </div>

                                {!isFinancialResponsible && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Responsável Financeiro</label>
                                            <input
                                                type="text"
                                                value={financialResponsibleName}
                                                onChange={(e) => {
                                                    setFinancialResponsibleName(e.target.value);
                                                    if (e.target.value.trim()) {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.financialResponsibleName;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                className={`input-field ${errors.financialResponsibleName ? '!border-red-400 !bg-red-50' : ''}`}
                                                placeholder="Nome completo para emissão do boleto"
                                            />
                                            {errors.financialResponsibleName && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.financialResponsibleName}</span>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF do Responsável Financeiro</label>
                                            <input
                                                type="text"
                                                value={financialResponsibleCpf}
                                                onChange={(e) => {
                                                    const formatted = formatCPF(e.target.value);
                                                    setFinancialResponsibleCpf(formatted);
                                                    if (formatted.length === 14) {
                                                        if (!validateCPF(formatted)) {
                                                            setErrors(prev => ({ ...prev, financialResponsibleCpf: 'CPF inválido.' }));
                                                        } else {
                                                            setErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors.financialResponsibleCpf;
                                                                return newErrors;
                                                            });
                                                        }
                                                    } else {
                                                        setErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.financialResponsibleCpf;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                maxLength={14}
                                                className={`input-field ${errors.financialResponsibleCpf ? '!border-red-400 !bg-red-50' : ''}`}
                                                placeholder="000.000.000-00"
                                            />
                                            {errors.financialResponsibleCpf && <span className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.financialResponsibleCpf}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Outros Moradores</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cadastre as demais pessoas na unidade</p>
                            </div>

                            <div className="space-y-4">
                                {additionalResidents.map((res, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 relative group">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveResident(idx)}
                                            className="absolute -top-2 -right-2 size-8 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>

                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    value={res.name}
                                                    onChange={(e) => handleUpdateAdditional(idx, 'name', e.target.value)}
                                                    placeholder="Nome Completo"
                                                    className={`w-full bg-transparent border-b ${errors[`additional_${idx}_name`] ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} py-2 text-sm font-semibold outline-none focus:border-primary transition-colors`}
                                                />
                                                {errors[`additional_${idx}_name`] && <span className="text-red-500 text-[10px] font-bold uppercase">{errors[`additional_${idx}_name`]}</span>}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={res.cpf}
                                                    onChange={(e) => handleUpdateAdditional(idx, 'cpf', e.target.value)}
                                                    placeholder="CPF (opcional)"
                                                    className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold outline-none focus:border-primary transition-colors"
                                                />
                                                <div className="space-y-1">
                                                    <input
                                                        type="date"
                                                        value={res.birthDate}
                                                        onChange={(e) => handleUpdateAdditional(idx, 'birthDate', e.target.value)}
                                                        className={`w-full bg-transparent border-b ${errors[`additional_${idx}_birthDate`] ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'} py-2 text-sm font-semibold outline-none focus:border-primary transition-colors`}
                                                    />
                                                    {errors[`additional_${idx}_birthDate`] && <span className="text-red-500 text-[10px] font-bold uppercase">{errors[`additional_${idx}_birthDate`]}</span>}
                                                </div>
                                            </div>
                                            <input
                                                type="tel"
                                                value={res.phone}
                                                onChange={(e) => handleUpdateAdditional(idx, 'phone', e.target.value)}
                                                placeholder="WhatsApp (opcional)"
                                                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddResident}
                                    className="w-full h-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary/50 transition-all font-bold text-xs uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined">person_add</span>
                                    Adicionar outro morador
                                </button>
                            </div>
                        </div>
                    )}

                    {errors.general && (
                        <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-red-100 animate-in slide-in-from-top-2">
                            {errors.general}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="h-16 px-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                            >
                                Voltar
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="flex-1 h-16 bg-primary text-white rounded-3xl font-bold uppercase tracking-[3px] text-xs shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                Próximo Passo
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={isSubmitting}
                                className="flex-1 h-16 bg-emerald-500 text-white rounded-3xl font-bold uppercase tracking-[3px] text-xs shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Finalizar Cadastro
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
        .input-field {
          width: 100%;
          height: 3.5rem;
          padding: 0 1.25rem;
          border-radius: 1rem;
          border-width: 1px;
          border-color: #f1f5f9;
          background-color: #f8fafc;
          font-weight: 600;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .dark .input-field {
          background-color: #0f172a;
          border-color: #334155;
          color: white;
        }
        .input-field:focus {
          ring: 4px;
          --tw-ring-color: rgba(128, 46, 83, 0.05);
        }
        @media (max-width: 640px) {
          .input-field {
            height: 3.2rem;
            padding: 0 1rem;
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
};

export default ResidentRegistration;
