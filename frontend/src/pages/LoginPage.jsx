import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const formatErrorMessage = (detail) => {
    if (Array.isArray(detail)) {
      return detail.map(item => item?.msg || item?.detail || 'Error de validación').join(', ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || detail.detail || 'Error al iniciar sesión. Verifique sus credenciales.';
    }
    return 'Error al iniciar sesión. Verifique sus credenciales.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(formatErrorMessage(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Decors */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/80 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/30 mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ExpedienteMed</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sistema de Citas y Expediente Clínico (Clínica México)
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo Quick Access */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Accesos Rápida de Prueba (Demo):
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickLogin('admin', 'Clinica2026!')}
              className="px-2 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/40 rounded-xl text-center font-bold cursor-pointer transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin('dr.ramirez', 'Clinica2026!')}
              className="px-2 py-2 bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 border border-teal-700/40 rounded-xl text-center font-bold cursor-pointer transition-all"
            >
              Dr. Ramírez
            </button>
            <button
              onClick={() => handleQuickLogin('recepcion1', 'Clinica2026!')}
              className="px-2 py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-700/40 rounded-xl text-center font-bold cursor-pointer transition-all"
            >
              Recepción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
