import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getNombreCompleto } from '../../lib/utils/valienteHelpers';
import type { ValienteListItem } from '../../lib/utils/valienteHelpers';
import { SorocaIcon, TribuIcon } from '../../components/customIcons/customIcons';

type ProgramFilter = 'ALL' | 'TRIBU' | 'SOROCA';
type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';

interface ValientesListViewProps {
  onSelectValiente: (id: number) => void;
  context: AppContext;
}

const ValientesListView: React.FC<ValientesListViewProps> = ({ onSelectValiente, context }) => {
  const [valientes, setValientes] = useState<ValienteListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<ProgramFilter>(
    context === 'TRIBU' ? 'TRIBU' : context === 'SOROCA' ? 'SOROCA' : 'ALL'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchValientes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('valiente')
        .select(
          'id, nombres, apellidos, nombre_completo, numero_documento, tipo_documento, foto_url, estado, programas:valiente_programa(programa(codigo))'
        )
        .order('nombres', { ascending: true });

      if (data) {
        setValientes(data as ValienteListItem[]);
      }
      setLoading(false);
    };

    fetchValientes();
  }, []);

  const filtered = useMemo(() => {
    return valientes.filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        v.nombres.toLowerCase().includes(term) ||
        v.apellidos.toLowerCase().includes(term) ||
        v.numero_documento.toLowerCase().includes(term);

      const codes = v.programas?.map((p) => p.programa.codigo) ?? [];
      const matchesProgram =
        programFilter === 'ALL' || codes.includes(programFilter);

      return matchesSearch && matchesProgram;
    });
  }, [valientes, searchTerm, programFilter]);

  const getInitials = (v: ValienteListItem) => {
    const firstN = v.nombres?.charAt(0) ?? '';
    const firstA = v.apellidos?.charAt(0) ?? '';
    return `${firstN}${firstA}`.toUpperCase();
  };

  const getProgramCodes = (v: ValienteListItem) =>
    v.programas?.map((p) => p.programa.codigo) ?? [];

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 pt-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Directorio Unificado</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? 'Cargando...' : `${filtered.length} valiente${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Filter buttons */}
          <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm">
            <button
              onClick={() => setProgramFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                programFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setProgramFilter('SOROCA')}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 rounded transition-colors ${
                programFilter === 'SOROCA'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <SorocaIcon size={12} /> SOROCA
            </button>
            <button
              onClick={() => setProgramFilter('TRIBU')}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 rounded transition-colors ${
                programFilter === 'TRIBU'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TribuIcon size={12} /> TRIBU
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <Filter size={16} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No se encontraron valientes</p>
            {searchTerm && (
              <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Valiente
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Contexto
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const codes = getProgramCodes(v);
                return (
                  <tr
                    key={v.id}
                    className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => onSelectValiente(v.id)}
                  >
                    {/* Valiente column */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {v.foto_url ? (
                          <img
                            src={v.foto_url}
                            alt={getNombreCompleto(v)}
                            className="w-9 h-9 rounded-full object-cover bg-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-slate-600">
                              {getInitials(v)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-slate-800 leading-tight">
                            {getNombreCompleto(v)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {v.tipo_documento} {v.numero_documento}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contexto column */}
                    <td className="px-6 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {codes.includes('SOROCA') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                            <SorocaIcon size={10} />
                            SOROCA
                          </span>
                        )}
                        {codes.includes('TRIBU') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                            <TribuIcon size={10} />
                            TRIBU
                          </span>
                        )}
                        {codes.length === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Arrow column */}
                    <td className="px-6 py-3 text-right">
                      <ChevronRight size={16} className="text-slate-400 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ValientesListView;
