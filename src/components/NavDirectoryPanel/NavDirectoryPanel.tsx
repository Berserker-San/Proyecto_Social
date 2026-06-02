import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ValienteListItem } from '../../lib/utils/valienteHelpers';
import { getNombreCompleto } from '../../lib/utils/valienteHelpers';
import ValienteDirectoryRow from './ValienteDirectoryRow';
import { TribuIcon, SorocaIcon } from '../customIcons/customIcons';

// =========================================================
// TIPOS
// =========================================================

type ProgramFilter = 'ALL' | 'TRIBU' | 'SOROCA';

export interface NavDirectoryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectValiente: (id: number) => void;
  selectedValienteId: number | null;
  context: 'GLOBAL' | 'TRIBU' | 'SOROCA';
}

// =========================================================
// HELPERS
// =========================================================

/**
 * Determina el filtro inicial de programa según el contexto de la app.
 */
function getInitialFilter(context: NavDirectoryPanelProps['context']): ProgramFilter {
  if (context === 'TRIBU') return 'TRIBU';
  if (context === 'SOROCA') return 'SOROCA';
  return 'ALL';
}

/**
 * Filtra la lista de valientes en memoria por término de búsqueda y programa.
 */
function filterValientes(
  valientes: ValienteListItem[],
  searchTerm: string,
  programFilter: ProgramFilter
): ValienteListItem[] {
  const term = searchTerm.trim().toLowerCase();

  return valientes.filter((v) => {
    // Filtro por programa
    if (programFilter !== 'ALL') {
      const codes = v.programas?.map((p) => p.programa.codigo) ?? [];
      if (!codes.includes(programFilter)) return false;
    }

    // Filtro por búsqueda
    if (term) {
      const nombre = getNombreCompleto(v).toLowerCase();
      const doc = (v.numero_documento ?? '').toLowerCase();
      const nombres = (v.nombres ?? '').toLowerCase();
      const apellidos = (v.apellidos ?? '').toLowerCase();
      if (
        !nombre.includes(term) &&
        !doc.includes(term) &&
        !nombres.includes(term) &&
        !apellidos.includes(term)
      ) {
        return false;
      }
    }

    return true;
  });
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

const NavDirectoryPanel: React.FC<NavDirectoryPanelProps> = ({
  isOpen,
  onToggle,
  onSelectValiente,
  selectedValienteId,
  context,
}) => {
  const [valientes, setValientes] = useState<ValienteListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<ProgramFilter>(
    getInitialFilter(context)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // -------------------------------------------------------
  // Carga de datos — solo la primera vez que se abre
  // -------------------------------------------------------

  const loadValientes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('valiente')
      .select(
        'id, nombres, apellidos, nombre_completo, numero_documento, tipo_documento, foto_url, estado, programas:valiente_programa(programa(codigo))'
      )
      .order('nombres', { ascending: true });

    if (queryError) {
      setError('No se pudo cargar la lista de valientes. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // Mapear al tipo ValienteListItem
    const items: ValienteListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombre_completo: row.nombre_completo,
      numero_documento: row.numero_documento,
      tipo_documento: row.tipo_documento,
      foto_url: row.foto_url,
      estado: row.estado,
      programas: (row.programas as unknown as Array<{ programa: { codigo: string } }>) ?? [],
    }));

    setValientes(items);
    setHasLoaded(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadValientes();
    }
  }, [isOpen, hasLoaded, loadValientes]);

  // -------------------------------------------------------
  // Lista filtrada
  // -------------------------------------------------------

  const filteredValientes = filterValientes(valientes, searchTerm, programFilter);

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-white/10">
      {/* Header del panel */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Directorio
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar directorio"
        >
          <X size={16} />
        </button>
      </div>

      {/* Campo de búsqueda */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o documento…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-white/40 hover:text-white transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Botones de filtro por programa */}
      <div className="flex gap-1.5 px-3 pb-3">
        <FilterButton
          active={programFilter === 'ALL'}
          onClick={() => setProgramFilter('ALL')}
          label="Todos"
        />
        <FilterButton
          active={programFilter === 'TRIBU'}
          onClick={() => setProgramFilter('TRIBU')}
          label="TRIBU"
          icon={<TribuIcon size={12} />}
        />
        <FilterButton
          active={programFilter === 'SOROCA'}
          onClick={() => setProgramFilter('SOROCA')}
          label="SOROCA"
          icon={<SorocaIcon size={12} />}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => {
              setHasLoaded(false);
              loadValientes();
            }}
          />
        )}

        {!loading && !error && filteredValientes.length === 0 && (
          <EmptyState hasSearch={searchTerm.trim().length > 0} />
        )}

        {!loading && !error &&
          filteredValientes.map((v) => (
            <ValienteDirectoryRow
              key={v.id}
              valiente={v}
              isSelected={v.id === selectedValienteId}
              onClick={() => onSelectValiente(v.id)}
            />
          ))}
      </div>
    </div>
  );
};

// =========================================================
// SUB-COMPONENTES
// =========================================================

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, label, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
      active
        ? 'bg-white/15 text-white border border-white/20'
        : 'text-white/50 hover:text-white/80 hover:bg-white/8 border border-transparent',
    ].join(' ')}
  >
    {icon}
    {label}
  </button>
);

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
    <p className="text-xs text-white/40">Cargando valientes…</p>
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 gap-3 text-center">
    <p className="text-xs text-red-400">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/80 transition-colors border border-white/10"
    >
      Reintentar
    </button>
  </div>
);

interface EmptyStateProps {
  hasSearch: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasSearch }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <p className="text-xs text-white/40">
      {hasSearch
        ? 'No se encontraron resultados para tu búsqueda.'
        : 'No se encontraron valientes.'}
    </p>
  </div>
);

export default NavDirectoryPanel;
