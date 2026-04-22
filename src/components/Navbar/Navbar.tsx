import React from 'react';
import { UserPlus, Shield, ArrowLeftRight, LogOut, BarChart2, Upload } from 'lucide-react';
import { SorocaIcon, TribuIcon } from '../customIcons/customIcons';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';

export interface NavbarProps {
  activeView: string;
  onChangeView: (view: string) => void;
  onLogoClick?: () => void;
  context: AppContext;
  onContextSwitch?: (newContext: 'TRIBU' | 'SOROCA') => void;
  onLogout?: () => void;
}

const contextStyles: Record<AppContext, { sidebar: string; accent: string }> = {
  TRIBU: { sidebar: 'bg-indigo-900 border-indigo-800', accent: 'text-indigo-400' },
  SOROCA: { sidebar: 'bg-emerald-900 border-emerald-800', accent: 'text-emerald-400' },
  GLOBAL: { sidebar: 'bg-slate-900 border-slate-800', accent: 'text-blue-400' },
};

const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onChangeView,
  onLogoClick,
  context,
  onContextSwitch,
  onLogout,
}) => {
  const { sidebar, accent } = contextStyles[context];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-72 fixed h-full z-20 shadow-2xl transition-colors duration-500 ${sidebar} text-white`}>
        {/* Logo */}
        <div
          className="p-8 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={onLogoClick}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-white/10 backdrop-blur-sm">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">TRIVIUM</h1>
            <span className={`text-[10px] font-bold tracking-widest uppercase opacity-70 ${accent}`}>
              {context === 'GLOBAL' ? 'Sistema Integral' : context}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-6 py-2 space-y-2">
          <button
            onClick={() => onChangeView('registration')}
            className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
              activeView === 'registration'
                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={18} />
            <span className="text-sm font-medium">Ingreso</span>
          </button>

          <button
            onClick={() => onChangeView('csv-upload')}
            className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
              activeView === 'csv-upload'
                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={18} />
            <span className="text-sm font-medium">Carga CSV</span>
          </button>

          <button
            onClick={() => onChangeView('estadisticas')}
            className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
              activeView === 'estadisticas'
                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 size={18} />
            <span className="text-sm font-medium">Estadísticas</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/10 space-y-3">
          {onContextSwitch && (
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ArrowLeftRight size={10} /> Cambiar Entorno
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onContextSwitch('TRIBU')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${
                    context === 'TRIBU'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <TribuIcon size={14} /> TRIBU
                </button>
                <button
                  onClick={() => onContextSwitch('SOROCA')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border ${
                    context === 'SOROCA'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <SorocaIcon size={14} /> SOROCA
                </button>
              </div>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-200"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className={`md:hidden fixed top-0 w-full ${sidebar} text-white z-40 px-5 py-4 flex justify-between items-center shadow-lg`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
          <Shield size={20} />
          <span className="font-bold tracking-tight">
            TRIVIUM <span className="opacity-50 text-xs ml-1">{context}</span>
          </span>
        </div>
        {onContextSwitch && (
          <button
            onClick={() => onContextSwitch(context === 'TRIBU' ? 'SOROCA' : 'TRIBU')}
            className="bg-white/10 p-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeftRight size={16} />
          </button>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-40">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-2 flex justify-center gap-4">
          <button
            onClick={() => onChangeView('registration')}
            className="flex flex-col items-center justify-center min-w-[50px] py-2 transition-all duration-300 group"
          >
            <div
              className={`transition-all duration-300 transform ${
                activeView === 'registration' ? '-translate-y-1 text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            >
              <UserPlus size={activeView === 'registration' ? 24 : 20} strokeWidth={activeView === 'registration' ? 2.5 : 2} />
            </div>
            <div
              className={`mt-1.5 rounded-full transition-all duration-300 ${
                activeView === 'registration'
                  ? 'w-1.5 h-1.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                  : 'w-1 h-1 bg-slate-700 group-hover:bg-slate-500'
              }`}
            />
          </button>

          <button
            onClick={() => onChangeView('csv-upload')}
            className="flex flex-col items-center justify-center min-w-[50px] py-2 transition-all duration-300 group"
          >
            <div
              className={`transition-all duration-300 transform ${
                activeView === 'csv-upload' ? '-translate-y-1 text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            >
              <Upload size={activeView === 'csv-upload' ? 24 : 20} strokeWidth={activeView === 'csv-upload' ? 2.5 : 2} />
            </div>
            <div
              className={`mt-1.5 rounded-full transition-all duration-300 ${
                activeView === 'csv-upload'
                  ? 'w-1.5 h-1.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                  : 'w-1 h-1 bg-slate-700 group-hover:bg-slate-500'
              }`}
            />
          </button>

          <button
            onClick={() => onChangeView('estadisticas')}
            className="flex flex-col items-center justify-center min-w-[50px] py-2 transition-all duration-300 group"
          >
            <div
              className={`transition-all duration-300 transform ${
                activeView === 'estadisticas' ? '-translate-y-1 text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            >
              <BarChart2 size={activeView === 'estadisticas' ? 24 : 20} strokeWidth={activeView === 'estadisticas' ? 2.5 : 2} />
            </div>
            <div
              className={`mt-1.5 rounded-full transition-all duration-300 ${
                activeView === 'estadisticas'
                  ? 'w-1.5 h-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'w-1 h-1 bg-slate-700 group-hover:bg-slate-500'
              }`}
            />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;