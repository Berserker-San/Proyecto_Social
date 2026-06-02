import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck, HeartPulse, GraduationCap, Home, Users, Zap, Shield, Activity,
  Search, ChevronRight, MapPin, Leaf, FileText, AlertCircle, Pencil,
  Plus, Trash2, ChevronDown, ChevronUp, Calendar, Save, X,
  Download, Eye, Flame, Wind, Droplets, Mountain, Sparkles,
} from 'lucide-react';
import { SorocaIcon, TribuIcon } from '../../components/customIcons/customIcons';
import { getValienteById, calcularEdad, getHistorialValiente } from '../../lib/services/valientes.service';
import {
  getAcompanamientosByValiente,
  crearAcompanamiento,
  eliminarAcompanamiento,
} from '../../lib/services/acompanamiento.service';
import { toggleAutorizacion } from '../../lib/services/acudientes.service';
import {
  asignarInsignia,
  INSIGNIAS_SOROCA,
  type InsigniaSoroca,
} from '../../lib/services/perfiles.service';
import {
  getDocumentosValiente,
  getUrlDescarga,
  TIPO_DOC_LABEL,
} from '../../lib/services/documentos.service';
import { getNombreCompleto } from '../../lib/utils/valienteHelpers';
import { useAuth } from '../../lib/hooks/useAuth';
import type { Valiente, ValienteCompleto, AcompanamientoConNahual, ValienteDocumento, HistorialValiente } from '../../types/database.types';

// =========================================================
// PROPS
// =========================================================

interface ValienteProfileViewProps {
  valienteId: number;
  allValientes: Valiente[];
  onSelectValiente: (id: number) => void;
  onBack: () => void;
  onEdit?: (valienteId: number) => void;
  context: 'GLOBAL' | 'TRIBU' | 'SOROCA';
}

// =========================================================
// HELPERS INTERNOS
// =========================================================

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

function getSorocaLogoPath(tipoPrograma: string | null | undefined): string {
  if (!tipoPrograma) return '/images/logo-soroca.png';
  
  const tipo = tipoPrograma.toLowerCase().trim();
  
  // Mapear el tipo de programa al nombre del archivo
  const logoMap: Record<string, string> = {
    'soñar': '/images/soroca-sonar.png',
    'sonar': '/images/soroca-sonar.png',
    'romper': '/images/soroca-romper.png',
    'cambiar': '/images/soroca-cambiar.png',
    'mundo cotidiano': '/images/logo-soroca.png', // Pendiente, usar logo general por ahora
  };
  
  return logoMap[tipo] || '/images/logo-soroca.png';
}

function getContextStyles(
  valiente: ValienteCompleto,
  context: 'GLOBAL' | 'TRIBU' | 'SOROCA'
) {
  const isSoroca =
    valiente.programas?.some((p) => p.programa?.codigo === 'SOROCA') ||
    context === 'SOROCA';
  const isTribu =
    valiente.programas?.some((p) => p.programa?.codigo === 'TRIBU') ||
    context === 'TRIBU';

  if (isSoroca) {
    return {
      gradient: 'from-emerald-700 to-teal-900',
      watermarkIcon: <SorocaIcon className="text-white opacity-10" size={150} />,
      primaryColor: 'text-emerald-900',
      accentBg: 'bg-emerald-50',
    };
  }
  if (isTribu) {
    return {
      gradient: 'from-indigo-800 to-purple-900',
      watermarkIcon: <TribuIcon className="text-white opacity-10" size={150} />,
      primaryColor: 'text-indigo-900',
      accentBg: 'bg-indigo-50',
    };
  }
  return {
    gradient: 'from-slate-600 to-slate-800',
    watermarkIcon: null,
    primaryColor: 'text-slate-900',
    accentBg: 'bg-slate-50',
  };
}

// =========================================================
// SUB-COMPONENTES
// =========================================================

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">{children}</div>
  </div>
);

const GridItem = ({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <div className="text-xs text-slate-500 font-semibold mb-0.5">{label}</div>
    <div className="text-sm text-slate-800 font-medium truncate">{value || 'N/A'}</div>
  </div>
);

const DocStatus = ({ label, check }: { label: string; check: boolean | null | undefined }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-600">{label}</span>
    {check ? (
      <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">OK</span>
    ) : (
      <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded">Pendiente</span>
    )}
  </div>
);

const AvatarFallback = ({ nombre, size = 'lg' }: { nombre: string; size?: 'sm' | 'lg' }) => {
  const initials = getInitials(nombre);
  const sizeClass = size === 'lg' ? 'w-32 h-32 text-3xl' : 'w-6 h-6 text-xs';
  return (
    <div
      className={`${sizeClass} rounded-xl bg-slate-200 border-4 border-white shadow-md flex items-center justify-center font-bold text-slate-600`}
    >
      {initials}
    </div>
  );
};

// Configuración visual de cada insignia SOROCA
const INSIGNIA_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Ascua:  { color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-300', icon: <Sparkles size={22} className="text-orange-500" /> },
  Fuego:  { color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300',    icon: <Flame    size={22} className="text-red-500"    /> },
  Tierra: { color: 'text-amber-800',  bg: 'bg-amber-50',   border: 'border-amber-300',  icon: <Mountain size={22} className="text-amber-600"  /> },
  Agua:   { color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-300',   icon: <Droplets size={22} className="text-blue-500"   /> },
  Aire:   { color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-300',    icon: <Wind     size={22} className="text-sky-500"    /> },
};

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

const ValienteProfileView: React.FC<ValienteProfileViewProps> = ({
  valienteId,
  allValientes,
  onSelectValiente,
  onBack,
  onEdit,
  context,
}) => {
  const [valiente, setValiente] = useState<ValienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Estado para acompañamientos
  const [acompanamientos, setAcompanamientos] = useState<AcompanamientoConNahual[]>([]);
  const [loadingAcomp, setLoadingAcomp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingAcomp, setSavingAcomp] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formAcomp, setFormAcomp] = useState({
    fecha: new Date().toISOString().split('T')[0],
    lugar: '',
    motivo_tema: '',
    nota: '',
    compromisos_acuerdos: '',
    fecha_proximo_encuentro: '',
  });

  const { usuarioSistema } = useAuth();

  // Estado para insignias SOROCA
  const [insigniaSeleccionada, setInsigniaSeleccionada] = useState<InsigniaSoroca | ''>('');
  const [fechaInsignia, setFechaInsignia] = useState(new Date().toISOString().split('T')[0]);
  const [savingInsignia, setSavingInsignia] = useState(false);
  const [insigniaActual, setInsigniaActual] = useState<string | null>(null);

  // Estado para documentos
  const [documentos, setDocumentos] = useState<ValienteDocumento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [descargando, setDescargando] = useState<number | null>(null);

  // Estado para autorización firmada
  const [autorizacion, setAutorizacion] = useState<boolean>(false);
  const [togglingAuth, setTogglingAuth] = useState(false);

  // Estado para historial
  const [historial, setHistorial] = useState<HistorialValiente[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Cargar datos al montar o cuando cambia valienteId
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setValiente(null);

    getValienteById(valienteId)
      .then((data) => {
        if (!cancelled) {
          setValiente(data ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Error al cargar el perfil');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [valienteId]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar acompañamientos al abrir el tab Nahual
  useEffect(() => {
    if (activeTab !== 'nahual' || !valienteId) return;
    setLoadingAcomp(true);
    getAcompanamientosByValiente(valienteId)
      .then(setAcompanamientos)
      .catch(console.error)
      .finally(() => setLoadingAcomp(false));
  }, [activeTab, valienteId]);

  const handleSaveAcomp = async () => {
    if (!usuarioSistema?.id) return;
    setSavingAcomp(true);
    try {
      const nuevo = await crearAcompanamiento({
        valiente_id: valienteId,
        nahual_id: usuarioSistema.id,
        fecha: formAcomp.fecha,
        lugar: formAcomp.lugar || null,
        motivo_tema: formAcomp.motivo_tema || null,
        nota: formAcomp.nota || null,
        compromisos_acuerdos: formAcomp.compromisos_acuerdos || null,
        fecha_proximo_encuentro: formAcomp.fecha_proximo_encuentro || null,
      });
      setAcompanamientos(prev => [{ ...nuevo, nahual: { nombre: usuarioSistema.nombre, email: usuarioSistema.email } }, ...prev]);
      setShowForm(false);
      setFormAcomp({ fecha: new Date().toISOString().split('T')[0], lugar: '', motivo_tema: '', nota: '', compromisos_acuerdos: '', fecha_proximo_encuentro: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAcomp(false);
    }
  };

  const handleDeleteAcomp = async (id: number) => {
    if (!confirm('¿Eliminar este acompañamiento?')) return;
    await eliminarAcompanamiento(id);
    setAcompanamientos(prev => prev.filter(a => a.id !== id));
  };

  // Sincronizar insignia actual cuando carga el valiente
  useEffect(() => {
    if (valiente?.perfil_soroca?.simbolo) {
      setInsigniaActual(valiente.perfil_soroca.simbolo);
    }
  }, [valiente]);

  // Sincronizar autorización firmada cuando carga el valiente
  useEffect(() => {
    const firmada = valiente?.acudientes?.[0]?.acudiente?.tiene_autorizacion_firmada ?? false;
    setAutorizacion(!!firmada);
  }, [valiente]);

  const handleToggleAutorizacion = async () => {
    const acudienteId = valiente?.acudientes?.[0]?.acudiente?.id;
    if (!acudienteId) return;
    setTogglingAuth(true);
    try {
      const nuevo = !autorizacion;
      await toggleAutorizacion(acudienteId, nuevo);
      setAutorizacion(nuevo);
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingAuth(false);
    }
  };

  // Cargar documentos al montar (necesario para el sidebar de Documentos)
  useEffect(() => {
    if (!valienteId) return;
    getDocumentosValiente(valienteId)
      .then(setDocumentos)
      .catch(console.error);
  }, [valienteId]);

  // Recargar documentos también al abrir el tab Red Apoyo (por si se subió algo)
  useEffect(() => {
    if (activeTab !== 'family' || !valienteId) return;
    setLoadingDocs(true);
    getDocumentosValiente(valienteId)
      .then(setDocumentos)
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, [activeTab, valienteId]);

  // Cargar historial al abrir el tab Historial
  useEffect(() => {
    if (activeTab !== 'history' || !valienteId) return;
    setLoadingHistorial(true);
    getHistorialValiente(valienteId)
      .then(setHistorial)
      .catch(console.error)
      .finally(() => setLoadingHistorial(false));
  }, [activeTab, valienteId]);

  const handleAsignarInsignia = async () => {
    if (!insigniaSeleccionada || !fechaInsignia) return;
    setSavingInsignia(true);
    try {
      await asignarInsignia(
        valienteId,
        insigniaSeleccionada,
        fechaInsignia,
        usuarioSistema?.id ?? null
      );
      setInsigniaActual(insigniaSeleccionada);
      setInsigniaSeleccionada('');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingInsignia(false);
    }
  };

  const handleDescargar = async (doc: ValienteDocumento) => {
    if (!doc.url_archivo) return;
    setDescargando(doc.id);
    try {
      const url = await getUrlDescarga(doc.url_archivo);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    } finally {
      setDescargando(null);
    }
  };

  // Buscador de navegación rápida
  const filteredValientes =
    searchTerm.length >= 2
      ? allValientes
          .filter(
            (v) =>
              v.id !== valienteId &&
              getNombreCompleto(v).toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
      : [];

  const handleSelectFromResult = (id: number) => {
    onSelectValiente(id);
    setSearchTerm('');
    setShowResults(false);
  };

  // ── Estados de carga / error ──────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-slate-700 font-medium">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
        >
          ← Volver al Directorio
        </button>
      </div>
    );
  }

  if (!valiente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="text-amber-500" size={40} />
        <p className="text-slate-700 font-medium">Valiente no encontrado</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
        >
          ← Volver al Directorio
        </button>
      </div>
    );
  }

  // ── Derivaciones de display ───────────────────────────────
  const nombreCompleto = getNombreCompleto(valiente);
  const edad = calcularEdad(valiente.fecha_nacimiento);
  const isSoroca = valiente.programas?.some((p) => p.programa?.codigo === 'SOROCA') ?? false;
  const isTribu = valiente.programas?.some((p) => p.programa?.codigo === 'TRIBU') ?? false;
  const contextStyle = getContextStyles(valiente, context);

  const barrio = valiente.ubicacion?.barrio_id
    ? `Barrio ${valiente.ubicacion.barrio_id}`
    : valiente.ubicacion?.direccion ?? null;

  const acudientePrincipal = valiente.acudientes?.[0]?.acudiente ?? null;

  // Documentos (aproximación)
  const docIdCopy = valiente.estado !== 'INACTIVO';
  const docEpsCert = valiente.salud?.eps_id != null;
  const docConsent = valiente.acudientes?.[0]?.acudiente?.tiene_autorizacion_firmada ?? false;

  // Tabs
  const tabs = [
    { id: 'general', label: 'Identidad', icon: UserCheck },
    { id: 'health', label: 'Salud', icon: HeartPulse },
    { id: 'academic', label: 'Educación', icon: GraduationCap },
    { id: 'socio', label: 'Entorno', icon: Home },
    { id: 'family', label: 'Red Apoyo', icon: Users },
    { id: 'ser', label: 'El Ser', icon: Zap },
    { id: 'nahual', label: 'Nahual', icon: Shield },
    { id: 'history', label: 'Historial', icon: Activity },
  ];

  // Historial: combinar eventos de historial_valiente + ingresos/egresos de programas
  type TimelineItem =
    | { kind: 'historial'; data: HistorialValiente }
    | { kind: 'programa_ingreso'; data: ValienteCompleto['programas'][number]; date: string }
    | { kind: 'programa_egreso'; data: ValienteCompleto['programas'][number]; date: string };

  const timelineItems: TimelineItem[] = [
    ...historial.map((h) => ({ kind: 'historial' as const, data: h })),
    ...(valiente.programas ?? [])
      .filter((p) => p.fecha_ingreso)
      .map((p) => ({ kind: 'programa_ingreso' as const, data: p, date: p.fecha_ingreso })),
    ...(valiente.programas ?? [])
      .filter((p) => p.fecha_egreso)
      .map((p) => ({ kind: 'programa_egreso' as const, data: p, date: p.fecha_egreso! })),
  ].sort((a, b) => {
    const dateA = a.kind === 'historial' ? a.data.fecha_evento : a.date;
    const dateB = b.kind === 'historial' ? b.data.fecha_evento : b.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* ── Header de navegación ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium"
        >
          <ChevronRight className="rotate-180 mr-1" size={16} /> Directorio
        </button>

        {/* Buscador de navegación rápida */}
        <div className="relative flex-1 md:w-64" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Ir a otro valiente..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
          />
          {showResults && filteredValientes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
              {filteredValientes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectFromResult(v.id)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b flex items-center gap-2"
                >
                  {v.foto_url ? (
                    <img src={v.foto_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {getInitials(getNombreCompleto(v))}
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-700">{getNombreCompleto(v)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        {/* Banner de gradiente */}
        <div className={`h-32 bg-gradient-to-r ${contextStyle.gradient} relative`}>
          {contextStyle.watermarkIcon && (
            <div className="absolute top-1/2 left-10 -translate-y-1/2 pointer-events-none">
              {contextStyle.watermarkIcon}
            </div>
          )}
          <div className="absolute bottom-4 right-6 flex gap-2">
            {isSoroca && (
              <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg font-bold text-sm">
                SOROCA
              </span>
            )}
            {isTribu && (
              <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg font-bold text-sm">
                TRIBU
              </span>
            )}
          </div>
        </div>

        {/* Foto + datos básicos */}
        <div className="px-6 pb-6 pt-4 relative">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="-mt-16 relative">
              {valiente.foto_url ? (
                <img
                  src={valiente.foto_url}
                  alt={nombreCompleto}
                  className="w-32 h-32 rounded-xl border-4 border-white shadow-md bg-slate-200 object-cover"
                />
              ) : (
                <AvatarFallback nombre={nombreCompleto} size="lg" />
              )}
            </div>
            <div className="flex-1 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">
                  {nombreCompleto}{' '}
                  <span className="text-lg text-slate-400 font-normal">
                    ({valiente.apodo || 'Sin apodo'})
                  </span>
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    valiente.estado === 'ACTIVO'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {valiente.estado}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(valienteId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Pencil size={13} /> Editar perfil
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-500 flex flex-wrap gap-x-4">
                <span>
                  {valiente.tipo_documento} {valiente.numero_documento}
                </span>
                <span>•</span>
                <span>{edad} Años</span>
                {barrio && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {barrio}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs en pill */}
        <div className="flex justify-center py-4 bg-slate-50 border-t border-slate-100 overflow-x-auto">
          <div className="flex gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenido principal + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* TAB: IDENTIDAD */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Section title="Datos Básicos">
                <GridItem label="Nacionalidad" value={valiente.nacionalidad} />
                <GridItem label="Lugar Nacimiento" value={valiente.lugar_nacimiento} />
                <GridItem label="Apodo" value={valiente.apodo} />
                <GridItem label="Sexo" value={valiente.sexo} />
                <GridItem label="Identidad Género" value={valiente.identidad_genero} />
                <GridItem label="Trabaja/Estudia" value={valiente.trabaja_estudia} />
              </Section>
              <Section title="Contacto">
                <GridItem label="Dirección" value={valiente.ubicacion?.direccion} full />
                <GridItem label="Email" value={valiente.email} />
                <GridItem label="Celular" value={valiente.celular} />
              </Section>
            </div>
          )}

          {/* TAB: SALUD */}
          {activeTab === 'health' && (
            <Section title="Salud">
              <GridItem label="EPS" value={(valiente.salud as any)?.eps?.nombre ?? (valiente.salud?.eps_id ? `EPS #${valiente.salud.eps_id}` : null)} />
              <GridItem label="Tipo de Sangre" value={valiente.salud?.tipo_sangre} />
              <GridItem
                label="Alergias"
                value={valiente.salud?.tiene_alergias ? valiente.salud.alergias || 'Sí' : 'No'}
              />
              <GridItem
                label="Discapacidad"
                value={
                  valiente.salud?.tiene_discapacidad
                    ? valiente.salud.tipo_discapacidad || 'Sí'
                    : 'No'
                }
              />
              <GridItem label="Diagnóstico Médico" value={valiente.salud?.diagnostico_medico} full />
              <GridItem label="Medicamentos Actuales" value={valiente.salud?.medicamentos_actuales} full />
              <GridItem label="Tratamiento en Curso" value={valiente.salud?.tratamiento_en_curso} full />
            </Section>
          )}

          {/* TAB: EDUCACIÓN */}
          {activeTab === 'academic' && (
            <Section title="Escolaridad">
              <GridItem label="Nivel" value={valiente.educacion?.nivel_educativo} />
              <GridItem label="Institución" value={(valiente.educacion as any)?.institucion_educativa?.nombre ?? null} />
              <GridItem label="Grado Actual" value={valiente.educacion?.grado_actual} />
              <GridItem label="Materia Favorita" value={valiente.educacion?.materia_favorita} />
              <GridItem label="Materia Difícil" value={valiente.educacion?.materia_dificil} />
            </Section>
          )}

          {/* TAB: ENTORNO */}
          {activeTab === 'socio' && (
            <Section title="Entorno">
              <GridItem label="Estrato" value={valiente.ubicacion?.estrato} />
              <GridItem
                label="Comuna"
                value={
                  (valiente.ubicacion as any)?.comuna?.nombre
                    ? `${(valiente.ubicacion as any).comuna.nombre}`
                    : valiente.ubicacion?.comuna_id
                    ? `${valiente.ubicacion.comuna_id}`
                    : null
                }
              />
              <GridItem label="Etnia" value={valiente.contexto_familiar?.etnia} />
              <GridItem
                label="Víctima Conflicto"
                value={valiente.contexto_familiar?.es_victima_conflicto ? 'Sí' : 'No'}
              />
              <GridItem
                label="Composición Familiar"
                value={valiente.contexto_familiar?.composicion_familiar}
                full
              />
              <GridItem
                label="Personas en el Hogar"
                value={valiente.contexto_familiar?.numero_personas_hogar}
              />
              <GridItem
                label="Ingreso Mensual Hogar"
                value={valiente.contexto_familiar?.ingreso_mensual_hogar}
              />
            </Section>
          )}

          {/* TAB: RED APOYO */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              <Section title="Acudiente Principal">
                <GridItem label="Nombre" value={acudientePrincipal?.nombre_completo} />
                <GridItem label="Celular" value={acudientePrincipal?.celular} />
                <GridItem label="Parentesco" value={valiente.acudientes?.[0]?.parentesco} />
                <GridItem label="Email" value={acudientePrincipal?.email} />
                {/* Toggle de autorización firmada */}
                <div className="md:col-span-2 flex items-center justify-between py-2 border-t border-slate-50 mt-1">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold mb-0.5">Autorización Firmada</div>
                    <div className="text-sm text-slate-600">
                      {autorizacion
                        ? 'Documento físico recibido'
                        : 'Pendiente de recibir'}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAutorizacion}
                    disabled={togglingAuth || !acudientePrincipal}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50
                      ${autorizacion ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    title={autorizacion ? 'Marcar como pendiente' : 'Marcar como recibida'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                        ${autorizacion ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </Section>

              {/* Documentos adjuntos */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                  Documentos Adjuntos
                </h3>

                {loadingDocs ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-slate-400" />
                  </div>
                ) : documentos.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    No hay documentos cargados para este valiente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documentos.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-slate-400 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-slate-700">
                              {TIPO_DOC_LABEL[doc.tipo_documento] ?? doc.tipo_documento}
                            </div>
                            {doc.nombre_archivo && (
                              <div className="text-xs text-slate-400 truncate max-w-xs">
                                {doc.nombre_archivo}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doc.esta_verificado && (
                            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              Verificado
                            </span>
                          )}
                          <button
                            onClick={() => handleDescargar(doc)}
                            disabled={descargando === doc.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {descargando === doc.id
                              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <Download size={13} />
                            }
                            {descargando === doc.id ? 'Abriendo...' : 'Ver / Descargar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: EL SER */}
          {activeTab === 'ser' && (
            <div className="space-y-6">
              <Section title="Aficiones y Gustos">
                <GridItem label="Hobbies" value={valiente.hobbies} full />
                <GridItem label="Trabaja/Estudia" value={valiente.trabaja_estudia} />
              </Section>

              {/* Insignias SOROCA */}
              {isSoroca && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                    Insignia SOROCA
                  </h3>

                  {/* Insignia actual */}
                  {insigniaActual && INSIGNIA_CONFIG[insigniaActual] && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 mb-5 ${INSIGNIA_CONFIG[insigniaActual].bg} ${INSIGNIA_CONFIG[insigniaActual].border}`}>
                      {INSIGNIA_CONFIG[insigniaActual].icon}
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Insignia actual</div>
                        <div className={`text-lg font-black ${INSIGNIA_CONFIG[insigniaActual].color}`}>
                          {insigniaActual}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selector de insignia */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      {insigniaActual ? 'Cambiar insignia' : 'Asignar insignia'}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {INSIGNIAS_SOROCA.map(ins => {
                        const cfg = INSIGNIA_CONFIG[ins];
                        const selected = insigniaSeleccionada === ins;
                        return (
                          <button
                            key={ins}
                            onClick={() => setInsigniaSeleccionada(selected ? '' : ins)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-bold
                              ${selected
                                ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-md scale-105`
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            {cfg.icon}
                            {ins}
                          </button>
                        );
                      })}
                    </div>

                    {insigniaSeleccionada && (
                      <div className="flex items-end gap-3 mt-3">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-500 block mb-1">
                            Fecha de asignación
                          </label>
                          <input
                            type="date"
                            value={fechaInsignia}
                            onChange={e => setFechaInsignia(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                        <button
                          onClick={handleAsignarInsignia}
                          disabled={savingInsignia}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <Save size={14} />
                          {savingInsignia ? 'Guardando...' : 'Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {valiente.perfil_soroca && (
                <Section title="Perfil Soroca">
                  <GridItem label="Macro" value={valiente.perfil_soroca.macro} />
                  <GridItem label="Símbolo" value={valiente.perfil_soroca.simbolo} />
                  <GridItem label="Intereses Artísticos" value={valiente.perfil_soroca.intereses_artisticos} full />
                  <GridItem label="Habilidades" value={valiente.perfil_soroca.habilidades} full />
                  <GridItem label="Proyectos Personales" value={valiente.perfil_soroca.proyectos_personales} full />
                </Section>
              )}
            </div>
          )}

          {/* TAB: NAHUAL */}
          {activeTab === 'nahual' && (
            <div className="space-y-4">

              {/* Cabecera con botón nuevo acompañamiento */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Acompañamientos
                </h3>
                <button
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  {showForm ? <X size={14} /> : <Plus size={14} />}
                  {showForm ? 'Cancelar' : 'Nuevo acompañamiento'}
                </button>
              </div>

              {/* Formulario nuevo acompañamiento */}
              {showForm && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                    <Shield size={15} /> Registrar acompañamiento
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">
                        Fecha de la sesión *
                      </label>
                      <input
                        type="date"
                        value={formAcomp.fecha}
                        onChange={e => setFormAcomp(p => ({ ...p, fecha: e.target.value }))}
                        className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">
                        Lugar
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. TRIBU, SOROCA, Parque..."
                        value={formAcomp.lugar}
                        onChange={e => setFormAcomp(p => ({ ...p, lugar: e.target.value }))}
                        className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Motivo / Tema del acompañamiento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Seguimiento escolar, crisis familiar..."
                      value={formAcomp.motivo_tema}
                      onChange={e => setFormAcomp(p => ({ ...p, motivo_tema: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Nota del Nahual
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descripción narrativa de la sesión..."
                      value={formAcomp.nota}
                      onChange={e => setFormAcomp(p => ({ ...p, nota: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Compromisos, acuerdos y tareas
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Acuerdos pactados con el valiente..."
                      value={formAcomp.compromisos_acuerdos}
                      onChange={e => setFormAcomp(p => ({ ...p, compromisos_acuerdos: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white resize-none"
                    />
                  </div>

                  <div className="md:w-1/2">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Fecha próximo encuentro
                    </label>
                    <input
                      type="date"
                      value={formAcomp.fecha_proximo_encuentro}
                      onChange={e => setFormAcomp(p => ({ ...p, fecha_proximo_encuentro: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAcomp}
                      disabled={savingAcomp || !formAcomp.fecha}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={15} />
                      {savingAcomp ? 'Guardando...' : 'Guardar acompañamiento'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de acompañamientos */}
              {loadingAcomp ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : acompanamientos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <Shield className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="text-sm text-slate-400 italic">
                    No hay acompañamientos registrados para este valiente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acompanamientos.map(a => (
                    <div
                      key={a.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Cabecera del card */}
                      <button
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <Calendar size={15} className="text-indigo-400 shrink-0" />
                          <div>
                            <span className="text-sm font-bold text-slate-800">
                              {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'long', year: 'numeric',
                              })}
                            </span>
                            {a.lugar && (
                              <span className="ml-2 text-xs text-slate-400">· {a.lugar}</span>
                            )}
                            {a.motivo_tema && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                                {a.motivo_tema}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.nahual?.nombre && (
                            <span className="text-xs text-indigo-600 font-semibold hidden sm:block">
                              {a.nahual.nombre}
                            </span>
                          )}
                          {expandedId === a.id
                            ? <ChevronUp size={16} className="text-slate-400" />
                            : <ChevronDown size={16} className="text-slate-400" />
                          }
                        </div>
                      </button>

                      {/* Detalle expandido */}
                      {expandedId === a.id && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-50 space-y-3">

                          {a.nahual?.nombre && (
                            <div>
                              <span className="text-xs font-semibold text-slate-400 uppercase">Nahual</span>
                              <p className="text-sm text-slate-700 font-medium">{a.nahual.nombre}</p>
                            </div>
                          )}

                          {a.motivo_tema && (
                            <div>
                              <span className="text-xs font-semibold text-slate-400 uppercase">Motivo / Tema</span>
                              <p className="text-sm text-slate-700">{a.motivo_tema}</p>
                            </div>
                          )}

                          {a.nota && (
                            <div>
                              <span className="text-xs font-semibold text-slate-400 uppercase">Nota del Nahual</span>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-indigo-50 rounded-lg p-3 mt-1">
                                {a.nota}
                              </p>
                            </div>
                          )}

                          {a.compromisos_acuerdos && (
                            <div>
                              <span className="text-xs font-semibold text-slate-400 uppercase">Compromisos y acuerdos</span>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-3 mt-1">
                                {a.compromisos_acuerdos}
                              </p>
                            </div>
                          )}

                          {a.fecha_proximo_encuentro && (
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                              <Calendar size={14} />
                              <span className="font-semibold">Próximo encuentro:</span>
                              {new Date(a.fecha_proximo_encuentro + 'T12:00:00').toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'long', year: 'numeric',
                              })}
                            </div>
                          )}

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleDeleteAcomp(a.id)}
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTORIAL */}
          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6">Línea de Tiempo</h3>

              {loadingHistorial ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
                </div>
              ) : timelineItems.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sin eventos registrados.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:bg-slate-200">
                  {timelineItems.map((item, idx) => {
                    if (item.kind === 'historial') {
                      const h = item.data;
                      const esImportante = h.es_importante ?? false;
                      return (
                        <div key={`h-${h.id}`} className="relative pl-8">
                          <div
                            className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white ${
                              esImportante ? 'bg-amber-400' : 'bg-slate-300'
                            }`}
                          />
                          <div className="text-xs text-slate-400">
                            {new Date(h.fecha_evento + 'T12:00:00').toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })}
                            {h.categoria && (
                              <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">
                                {h.categoria}
                              </span>
                            )}
                          </div>
                          {h.titulo && (
                            <div className="font-bold text-slate-800 text-sm mt-0.5">{h.titulo}</div>
                          )}
                          {h.descripcion && (
                            <div className="text-sm text-slate-600 mt-0.5">{h.descripcion}</div>
                          )}
                        </div>
                      );
                    }

                    if (item.kind === 'programa_ingreso') {
                      const p = item.data;
                      return (
                        <div key={`pi-${p.id}`} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-emerald-400 border-4 border-white" />
                          <div className="text-xs text-slate-400">
                            {new Date(p.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })}
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase">
                              Ingreso
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 text-sm mt-0.5">
                            Ingreso a {p.programa?.nombre ?? p.programa?.codigo ?? 'Programa'}
                          </div>
                          {p.motivacion && (
                            <div className="text-sm text-slate-600 mt-0.5">{p.motivacion}</div>
                          )}
                        </div>
                      );
                    }

                    if (item.kind === 'programa_egreso') {
                      const p = item.data;
                      return (
                        <div key={`pe-${p.id}`} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-red-300 border-4 border-white" />
                          <div className="text-xs text-slate-400">
                            {new Date(p.fecha_egreso! + 'T12:00:00').toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })}
                            <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">
                              Egreso
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 text-sm mt-0.5">
                            Egreso de {p.programa?.nombre ?? p.programa?.codigo ?? 'Programa'}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-6">

          {/* Universo Soroca */}
          {isSoroca && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 bg-emerald-50/30">
              <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <Leaf size={18} /> Universo Soroca
              </h3>
              <div className="text-center p-4">
                <div className="flex justify-center mb-2">
                  <img 
                    src={getSorocaLogoPath(valiente.programas?.find(p => p.programa?.codigo === 'SOROCA')?.nivel)} 
                    alt="Logo Soroca" 
                    className="w-16 h-16 object-contain" 
                  />
                </div>
                {/* Mostrar tipo de programa SOROCA */}
                {valiente.programas?.find(p => p.programa?.codigo === 'SOROCA')?.nivel && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="text-xs text-emerald-700 font-semibold mb-1">Tipo de Programa</div>
                    <div className="text-sm font-bold text-emerald-900">
                      {valiente.programas.find(p => p.programa?.codigo === 'SOROCA')?.nivel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Elementos Tribu */}
          {isTribu && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/30">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Shield size={18} /> Elementos Tribu
              </h3>
              <div className="space-y-3">
                {/* Mostrar disciplina */}
                {valiente.perfil_deportivo?.disciplina && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="text-xs text-indigo-600 font-semibold mb-1">Disciplina</div>
                    <div className="text-lg font-black text-indigo-900">
                      {valiente.perfil_deportivo.disciplina}
                    </div>
                  </div>
                )}

                {/* Información deportiva */}
                {valiente.perfil_deportivo && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-200">
                    <div className="text-xs text-indigo-600 font-semibold mb-2">Información Deportiva</div>
                    <div className="space-y-1 text-sm text-indigo-900">
                      {valiente.perfil_deportivo.talla_guayos && (
                        <div className="flex justify-between">
                          <span className="text-indigo-600">Talla Guayos:</span>
                          <span className="font-bold">{valiente.perfil_deportivo.talla_guayos}</span>
                        </div>
                      )}
                      {valiente.perfil_deportivo.talla_camisa && (
                        <div className="flex justify-between">
                          <span className="text-indigo-600">Talla Camiseta:</span>
                          <span className="font-bold">{valiente.perfil_deportivo.talla_camisa}</span>
                        </div>
                      )}
                      {valiente.perfil_deportivo.talla_pantalon && (
                        <div className="flex justify-between">
                          <span className="text-indigo-600">Talla Pantalón:</span>
                          <span className="font-bold">{valiente.perfil_deportivo.talla_pantalon}</span>
                        </div>
                      )}
                      {valiente.perfil_deportivo.tiene_experiencia_previa !== null && (
                        <div className="mt-2 pt-2 border-t border-indigo-100">
                          <span className="text-indigo-600">Experiencia previa:</span>
                          <span className="font-bold ml-1">
                            {valiente.perfil_deportivo.tiene_experiencia_previa ? 'Sí' : 'No'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {!valiente.perfil_deportivo && (
                  <p className="text-sm text-indigo-400 italic">Iniciando camino.</p>
                )}
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} /> Documentos
            </h3>
            <div className="space-y-2">
              <DocStatus
                label="Documento ID"
                check={documentos.some(d => d.tipo_documento === 'identidad')}
              />
              <DocStatus
                label="Certificado EPS"
                check={documentos.some(d => d.tipo_documento === 'eps')}
              />
              <DocStatus
                label="Consentimiento"
                check={documentos.some(d => d.tipo_documento === 'consentimiento')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValienteProfileView;
