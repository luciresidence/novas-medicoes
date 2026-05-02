
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';



const Logo = () => (
  <div className="flex flex-col items-center">
    <svg width="100" height="75" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[120px] sm:h-[90px]">
      <ellipse cx="85" cy="70" rx="35" ry="50" fill="#a66384" fillOpacity="0.7" transform="rotate(-15 85 70)" />
      <ellipse cx="115" cy="70" rx="35" ry="50" fill="#802e53" fillOpacity="0.8" transform="rotate(15 115 70)" />
    </svg>
    <h1 className="text-lg sm:text-xl font-bold text-primary uppercase tracking-tighter -mt-3 sm:-mt-4">Luci Berkembrock</h1>
    <div className="h-[2px] w-24 sm:w-32 bg-primary/20 my-1.5 sm:my-2"></div>
    <p className="text-[8px] sm:text-[10px] font-bold text-primary/60 uppercase tracking-[4px] sm:tracking-[6px]">Residence</p>
  </div>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Preencha e-mail e senha para continuar.');
      setIsLoading(false);
      return;
    }

    setSuccess('Login realizado com sucesso!');
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:bg-slate-100/50">
      <div className="w-full max-w-sm bg-white rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(128,46,83,0.15)] flex flex-col border border-slate-100">
        <div className="bg-white p-6 sm:p-10 pb-4 sm:pb-6 flex flex-col items-center border-b border-slate-50">
          <Logo />
          <div className="mt-6 sm:mt-8 text-center">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-tighter">
              Acesso Restrito
            </h1>
            <p className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase tracking-[2px] sm:tracking-[3px] mt-1">Gestão de Consumo Luci Berkembrock</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-semibold text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-5 pr-12 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-semibold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider p-3 rounded-xl text-center border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-primary text-white rounded-[24px] font-bold uppercase tracking-[3px] text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:grayscale-[0.5]"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
