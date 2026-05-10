
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Início', icon: 'home', path: '/dashboard' },
    { label: 'Medições', icon: 'assignment_turned_in', path: '/readings' },
    { label: 'Histórico', icon: 'history', path: '/history' },
    { label: 'Unidades', icon: 'domain', path: '/units' },
    { label: 'Formulário', icon: 'how_to_reg', path: '/requests' },
    { label: 'Perfil', icon: 'person', path: '/settings' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-20 px-1 sm:px-2">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all active:opacity-60 ${isActive ? 'text-primary' : 'text-gray-400'}`}
            >
              <div className={`flex flex-col items-center transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                <span className={`material-symbols-outlined text-3xl mb-1 ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-black uppercase tracking-tighter">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
