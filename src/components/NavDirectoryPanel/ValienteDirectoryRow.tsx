import React from 'react';
import type { ValienteListItem } from '../../lib/utils/valienteHelpers';
import { getNombreCompleto, getProgramaCodes } from '../../lib/utils/valienteHelpers';

// =========================================================
// HELPERS INTERNOS
// =========================================================

/**
 * Genera un color de fondo determinista a partir de un string (nombre).
 * Devuelve una clase Tailwind de color de fondo.
 */
function getAvatarColorClass(name: string): string {
  const colors = [
    'bg-violet-600',
    'bg-blue-600',
    'bg-cyan-600',
    'bg-teal-600',
    'bg-green-600',
    'bg-amber-600',
    'bg-orange-600',
    'bg-rose-600',
    'bg-pink-600',
    'bg-fuchsia-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Genera las iniciales del valiente: primera letra de nombres + primera letra de apellidos.
 */
function getInitials(v: ValienteListItem): string {
  const firstNombre = v.nombres?.trim().charAt(0).toUpperCase() ?? '';
  const firstApellido = v.apellidos?.trim().charAt(0).toUpperCase() ?? '';
  return `${firstNombre}${firstApellido}`;
}

// =========================================================
// BADGE DE PROGRAMA
// =========================================================

const PROGRAM_BADGE_STYLES: Record<string, string> = {
  TRIBU: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  SOROCA: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const DEFAULT_BADGE_STYLE = 'bg-white/10 text-white/60 border border-white/10';

interface ProgramBadgeProps {
  code: string;
}

const ProgramBadge: React.FC<ProgramBadgeProps> = ({ code }) => {
  const style = PROGRAM_BADGE_STYLES[code] ?? DEFAULT_BADGE_STYLE;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${style}`}>
      {code}
    </span>
  );
};

// =========================================================
// PROPS
// =========================================================

export interface ValienteDirectoryRowProps {
  valiente: ValienteListItem;
  isSelected: boolean;
  onClick: () => void;
}

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

const ValienteDirectoryRow: React.FC<ValienteDirectoryRowProps> = ({
  valiente,
  isSelected,
  onClick,
}) => {
  const nombreCompleto = getNombreCompleto(valiente);
  const programCodes = getProgramaCodes(valiente);
  const isInactive =
    valiente.estado === 'INACTIVO' || valiente.estado === 'EGRESADO';
  const initials = getInitials(valiente);
  const avatarColor = getAvatarColorClass(nombreCompleto);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200',
        isSelected
          ? 'bg-white/10 border-white/20 shadow-lg'
          : 'border-transparent hover:bg-white/5 hover:border-white/10',
        isInactive ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Avatar / Foto */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden">
        {valiente.foto_url ? (
          <img
            src={valiente.foto_url}
            alt={nombreCompleto}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla, ocultar y mostrar el fallback
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.classList.add(avatarColor);
                parent.innerHTML = `<span class="w-full h-full flex items-center justify-center text-white text-xs font-bold">${initials}</span>`;
              }
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${avatarColor}`}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        {/* Nombre completo */}
        <p className="text-sm font-medium text-white truncate leading-tight">
          {nombreCompleto}
        </p>

        {/* Número de documento */}
        <p className="text-xs text-white/50 truncate leading-tight mt-0.5">
          {valiente.numero_documento}
        </p>

        {/* Badges de programa */}
        {programCodes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {programCodes.map((code) => (
              <ProgramBadge key={code} code={code} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

export default ValienteDirectoryRow;
