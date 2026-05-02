
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data';

interface SettingsProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  onLogout: () => Promise<void>;
}

type SettingsView = 'main' | 'profile' | 'password';

const Settings: React.FC<SettingsProps> = ({ toggleDarkMode, isDarkMode, onLogout }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<SettingsView>('main');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // User Profile State
  const [user, setUser] = useState({
    name: 'Carregando...',
    role: 'Administrador',
    condo: 'Luci Berkembrock',
    avatarUrl: ''
  });
  const [editUser, setEditUser] = useState(user);

  useEffect(() => {
    const storedProfile = storage.getUserProfile ? storage.getUserProfile() : null;
    const defaultData = {
      name: storedProfile?.name || 'Administrador',
      role: storedProfile?.role || 'Administrador',
      condo: storedProfile?.condo || 'Luci Berkembrock',
      avatarUrl: storedProfile?.avatarUrl || ''
    };
    setUser(defaultData);
    setEditUser(defaultData);
  }, []);

  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUser(editUser);
      storage.saveUserProfile(editUser);
      showMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setView('main'), 1000);
    } catch (err: any) {
      showMessage(`Erro ao salvar: ${err.message}`, 'error');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) {
      showMessage('Preencha os campos obrigatórios', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showMessage('As senhas não coincidem!', 'error');
      return;
    }
    showMessage('Senha alterada com sucesso!');
    setPasswords({ current: '', new: '', confirm: '' });
    setTimeout(() => setView('main'), 1000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        const newUser = { ...user, avatarUrl: newAvatar };

        try {
          storage.saveUserProfile(newUser);
          setUser(newUser);
          setEditUser(newUser);
          showMessage('Foto atualizada!');
        } catch (err: any) {
          showMessage('Erro ao salvar foto', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    showMessage(`Notificações ${newState ? 'ativadas' : 'desativadas'}`);
  };

  if (view === 'profile') {
    return (
      <div className="pb-24 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark transition-colors duration-200">
        <header className="px-4 py-4 flex items-center bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-2 -ml-2 text-slate-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 dark:text-white mr-6">Gerenciar Perfil</h1>
        </header>

        <form onSubmit={handleSaveProfile} className="p-4 space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nome Completo</label>
              <input
                type="text"
                value={editUser.name}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Cargo</label>
              <input
                type="text"
                value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Condomínio</label>
              <input
                type="text"
                value={editUser.condo}
                onChange={e => setEditUser({ ...editUser, condo: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {msg && (
            <div className={`p-4 rounded-2xl text-center text-sm font-bold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            Salvar Alterações
          </button>
        </form>
      </div>
    );
  }

  if (view === 'password') {
    return (
      <div className="pb-24 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark transition-colors duration-200">
        <header className="px-4 py-4 flex items-center bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-2 -ml-2 text-slate-500">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 dark:text-white mr-6">Alterar Senha</h1>
        </header>

        <form onSubmit={handleChangePassword} className="p-4 space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Senha Atual</label>
              <input
                type="password"
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
            <div className="h-[1px] bg-slate-100 dark:bg-gray-800 my-2"></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nova Senha</label>
              <input
                type="password"
                value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {msg && (
            <div className={`p-4 rounded-2xl text-center text-sm font-bold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}

          <button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            Atualizar Senha
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-safe flex-1 flex flex-col bg-slate-50 dark:bg-background-dark transition-colors duration-200">
      {/* Header */}
      <header className="px-4 py-4 flex items-center bg-white dark:bg-surface-dark border-b dark:border-gray-800 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 dark:text-white mr-6">Configurações</h1>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[32px] shadow-sm flex flex-col items-center gap-4 relative overflow-hidden text-center">
          <div className="relative group">
            <div className="size-24 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-md bg-slate-100">
              <img
                src={user.avatarUrl}
                className="w-full h-full object-cover"
                alt={user.name}
              />
            </div>
            <label className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 active:scale-90 transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-sm">edit</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">{user.role} • {user.condo}</p>
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">CONTA</h3>
          <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm divide-y dark:divide-gray-800 overflow-hidden">
            <button
              onClick={() => setView('profile')}
              className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Gerenciar Perfil</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors">chevron_right</span>
            </button>
            <button
              onClick={() => setView('password')}
              className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Alterar Senha</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">PREFERÊNCIAS</h3>
          <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Notificações</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative flex items-center ${notificationsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-gray-700'}`}
              >
                <div className={`size-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Modo Escuro</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative flex items-center ${isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-gray-700'}`}
              >
                <div className={`size-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Message */}
        {msg && (
          <div className={`fixed bottom-24 left-4 right-4 p-4 rounded-2xl text-center text-sm font-semibold shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ${msg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {msg.text}
          </div>
        )}

        {/* About Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">SOBRE</h3>
          <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm divide-y dark:divide-gray-800 overflow-hidden">
            <button
              onClick={() => showMessage('Ajuda & Suporte será implementado em breve!')}
              className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined">help</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Ajuda & Suporte</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors">chevron_right</span>
            </button>
            <button
              onClick={() => showMessage('Termos de Uso será implementado em breve!')}
              className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Termos de Uso</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors">chevron_right</span>
            </button>
            <button
              onClick={() => showMessage('Política de Privacidade será implementado em breve!')}
              className="w-full p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-gray-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Política de Privacidade</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 transition-colors">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full h-16 bg-white dark:bg-surface-dark border border-slate-100 dark:border-gray-800 rounded-[24px] shadow-sm font-bold text-red-500 flex items-center justify-center gap-2 active:bg-red-50 dark:active:bg-red-900/10 transition-colors mt-2"
        >
          <span className="material-symbols-outlined rotate-180">logout</span>
          Sair da Conta
        </button>

        {/* Version Footer */}
        <footer className="text-center py-4 mb-8">
          <p className="text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-widest pl-2">Gestão de Consumo App</p>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Versão 1.0.2 (Build 240)</p>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
