import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck, HeartPulse, GraduationCap, Home, Users, Zap, Shield, Activity,
  Search, ChevronRight, MapPin, Leaf, FileText, Edit2, AlertCircle,
} from 'lucide-react';
import { SorocaIcon, TribuIcon } from '../../components/customIcons/customIcons';
import { getValienteById, calcularEdad } from '../../lib/services/valientes.service';
import { getNombreCompleto } from '../../lib/utils/valienteHelpers';
import type { Valiente, ValienteCompleto } from '../../types/database.types';

// =========================================================
// PROPS
// =========================================================

interface ValienteProfileViewProps {
  valienteId: number;
  allValientes: Valiente[];
  onSelectValiente: (id: number) => void;
  onBack: () => void;
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

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

const ValienteProfileView: React.FC<ValienteProfileViewProps> = ({
  valienteId,
  allValientes,
  onSelectValiente,
  onBack,
  context,
}) => {
  const [valiente, setValiente] = useState<ValienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Historial: usar programas como eventos de línea de tiempo
  const timelineEvents = (valiente.programas ?? [])
    .filter((p) => p.fecha_ingreso)
    .sort(
      (a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime()
    );

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
                <GridItem
                  label="Redes Sociales"
                  value={
                    valiente.redes_sociales
                      ? JSON.stringify(valiente.redes_sociales)
                      : null
                  }
                />
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
              <GridItem label="EPS" value={valiente.salud?.eps_id ? `EPS #${valiente.salud.eps_id}` : null} />
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
            <div className="space-y-6">
              <Section title="Escolaridad">
                <GridItem label="Nivel" value={valiente.educacion?.nivel_educativo} />
                <GridItem label="Institución" value={valiente.educacion?.nombre_institucion} />
                <GridItem label="Programa/Curso" value={valiente.educacion?.programa_academico} />
                <GridItem label="Grado Actual" value={valiente.educacion?.grado_actual} />
                <GridItem label="Jornada" value={valiente.educacion?.jornada} />
                <GridItem
                  label="¿Está Estudiando?"
                  value={valiente.educacion?.esta_estudiando ? 'Sí' : 'No'}
                />
              </Section>
              <Section title="Ocupación">
                <GridItem
                  label="¿Trabaja?"
                  value={valiente.ocupacion?.esta_trabajando ? 'Sí' : 'No'}
                />
                {valiente.ocupacion?.esta_trabajando && (
                  <GridItem label="Lugar de Trabajo" value={valiente.ocupacion?.lugar_trabajo} full />
                )}
                <GridItem label="Cargo" value={valiente.ocupacion?.cargo} />
                <GridItem label="Tipo de Empleo" value={valiente.ocupacion?.tipo_empleo} />
              </Section>
            </div>
          )}

          {/* TAB: ENTORNO */}
          {activeTab === 'socio' && (
            <Section title="Entorno">
              <GridItem label="Estrato" value={valiente.ubicacion?.estrato} />
              <GridItem
                label="Comuna"
                value={
                  valiente.ubicacion?.comuna_id ? `Comuna ${valiente.ubicacion.comuna_id}` : null
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
            <Section title="Acudiente Principal">
              <GridItem label="Nombre" value={acudientePrincipal?.nombre_completo} />
              <GridItem label="Celular" value={acudientePrincipal?.celular} />
              <GridItem label="Parentesco" value={valiente.acudientes?.[0]?.parentesco} />
              <GridItem label="Email" value={acudientePrincipal?.email} />
              <GridItem label="Ocupación" value={acudientePrincipal?.ocupacion} />
              <GridItem
                label="Autorización Firmada"
                value={acudientePrincipal?.tiene_autorizacion_firmada ? 'Sí' : 'No'}
              />
            </Section>
          )}

          {/* TAB: EL SER */}
          {activeTab === 'ser' && (
            <div className="space-y-6">
              <Section title="Aficiones y Gustos">
                <GridItem label="Hobbies" value={valiente.ocupacion?.hobbies} full />
                <GridItem
                  label="Proyecto de Vida / Intereses Profesionales"
                  value={valiente.ocupacion?.intereses_profesionales}
                  full
                />
                <GridItem
                  label="Actividades Extracurriculares"
                  value={valiente.ocupacion?.actividades_extracurriculares}
                  full
                />
              </Section>
              {valiente.perfil_soroca && (
                <Section title="Perfil Soroca">
                  <GridItem label="Macro" value={valiente.perfil_soroca.macro} />
                  <GridItem label="Símbolo" value={valiente.perfil_soroca.simbolo} />
                  <GridItem
                    label="Intereses Artísticos"
                    value={valiente.perfil_soroca.intereses_artisticos}
                    full
                  />
                  <GridItem
                    label="Habilidades"
                    value={valiente.perfil_soroca.habilidades}
                    full
                  />
                  <GridItem
                    label="Proyectos Personales"
                    value={valiente.perfil_soroca.proyectos_personales}
                    full
                  />
                </Section>
              )}
            </div>
          )}

          {/* TAB: NAHUAL */}
          {activeTab === 'nahual' && (
            <div className="space-y-6">
              <Section title="Dossier Psicosocial">
                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Factores Protectores</label>
                    <textarea
                      className="w-full p-2 border rounded bg-emerald-50 border-emerald-100 text-sm mt-1"
                      rows={2}
                      readOnly
                      value={valiente.contexto_familiar?.factores_protectores || 'Sin registro'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Factores de Riesgo</label>
                    <textarea
                      className="w-full p-2 border rounded bg-red-50 border-red-100 text-sm mt-1"
                      rows={2}
                      readOnly
                      value={valiente.contexto_familiar?.factores_riesgo || 'Sin registro'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Transformaciones Subjetivas
                    </label>
                    <textarea
                      className="w-full p-2 border rounded bg-indigo-50 border-indigo-100 text-sm mt-1"
                      rows={3}
                      readOnly
                      value={
                        valiente.programas?.[0]?.transformaciones_subjetivas || 'Sin registro'
                      }
                    />
                  </div>
                </div>
              </Section>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-center">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                  <Edit2 size={16} /> Gestionar Acompañamiento
                </button>
              </div>
            </div>
          )}

          {/* TAB: HISTORIAL */}
          {activeTab === 'history' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6">Línea de Tiempo</h3>
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sin eventos registrados.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:bg-slate-200">
                  {timelineEvents.map((item) => (
                    <div key={item.id} className="relative pl-8">
                      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-200 border-4 border-white" />
                      <div className="text-xs text-slate-400">{item.fecha_ingreso}</div>
                      <div className="font-bold text-slate-800 text-sm">
                        Ingreso a {item.programa?.nombre ?? item.programa?.codigo ?? 'Programa'}
                      </div>
                      {item.motivacion && (
                        <div className="text-sm text-slate-600">{item.motivacion}</div>
                      )}
                      {item.fecha_egreso && (
                        <div className="text-xs text-slate-400 mt-1">
                          Egreso: {item.fecha_egreso}
                        </div>
                      )}
                    </div>
                  ))}
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
                  <SorocaIcon className="text-emerald-600" size={40} />
                </div>
                <div className="font-black text-lg text-emerald-800">
                  {valiente.perfil_soroca?.macro || 'Sin macro'}
                </div>
                <div className="text-sm text-emerald-600">
                  {valiente.perfil_soroca?.simbolo || 'Sin símbolo'}
                </div>
              </div>
            </div>
          )}

          {/* Elementos Tribu */}
          {isTribu && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/30">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Shield size={18} /> Elementos Tribu
              </h3>
              <div className="space-y-2">
                {/* No hay badges en la BD actual */}
                <p className="text-sm text-indigo-400 italic">Iniciando camino.</p>
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} /> Documentos
            </h3>
            <div className="space-y-2">
              <DocStatus label="Documento ID" check={docIdCopy} />
              <DocStatus label="Certificado EPS" check={docEpsCert} />
              <DocStatus label="Consentimiento" check={docConsent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValienteProfileView;
