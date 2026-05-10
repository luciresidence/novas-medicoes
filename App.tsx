
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebaseConfig';
import Navigation from './components/Navigation';
import ImagePreview from './components/ImagePreview';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ApartmentList = lazy(() => import('./components/ApartmentList'));
const ReadingForm = lazy(() => import('./components/ReadingForm'));
const ResidentDetails = lazy(() => import('./components/ResidentDetails'));
const History = lazy(() => import('./components/History'));
const UnitList = lazy(() => import('./components/UnitList'));
const UnitRegistration = lazy(() => import('./components/UnitRegistration'));
const Settings = lazy(() => import('./components/Settings'));
const Login = lazy(() => import('./components/Login'));
const ResidentRegistration = lazy(() => import('./components/ResidentRegistration'));
const RegistrationManager = lazy(() => import('./components/RegistrationManager'));
const Reports = lazy(() => import('./components/Reports'));

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user && !['/login', '/cadastro'].includes(location.pathname)) {
        navigate('/login');
      }
      if (user && location.pathname === '/login') {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const hideNav = location.pathname === '/login' || location.pathname === '/cadastro';

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark overflow-x-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto relative no-scrollbar flex flex-col">
        <div className="mx-auto w-full max-w-[500px] flex-1 flex flex-col bg-slate-50 dark:bg-background-dark shadow-2xl shadow-black/5 min-[501px]:border-x dark:border-gray-800">
          <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<ResidentRegistration />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/readings" element={<ApartmentList />} />
              <Route path="/readings/:id" element={<ReadingForm />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<History onImageClick={setPreviewImage} />} />
              <Route path="/units" element={<UnitList />} />
              <Route path="/units/new" element={<UnitRegistration />} />
              <Route path="/units/:id/edit" element={<UnitRegistration />} />
              <Route path="/requests" element={<RegistrationManager />} />
              <Route path="/residents/:id" element={<ResidentDetails />} />
              <Route path="/settings" element={<Settings toggleDarkMode={toggleDarkMode} isDarkMode={darkMode} onLogout={handleLogout} />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      {!hideNav && <Navigation />}
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
};

export default App;
