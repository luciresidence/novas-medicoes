
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';

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

const ALLOWED_EMAIL = 'luci.residence@gmail.com';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email?.toLowerCase();

      if (email !== ALLOWED_EMAIL.toLowerCase()) {
        setError('Esta conta Google não está autorizada.');
        setIsLoading(false);
        return;
      }

      setSuccess('Login realizado com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Erro ao realizar login com Google.');
      setIsLoading(false);
    }
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

          <div className="space-y-4">
            <div className="rounded-[32px] bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Use o Google autorizado</p>
              <p className="mt-2 text-sm text-slate-600">Entre com a conta permitida para acessar o sistema.</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-16 bg-[#4285F4] text-white rounded-[24px] font-bold uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 shadow-xl shadow-slate-400/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:grayscale-[0.5]"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-lg">G</span>
                  Entrar com Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
