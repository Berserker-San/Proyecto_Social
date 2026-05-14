
import React, { useState, useRef, useEffect } from 'react';
import { Valiente, Alert, TimelineEntry } from '../types';
import { Phone, MapPin, Award, Activity, AlertCircle, ChevronRight, HeartPulse, UserCheck, Calendar, Power, Edit2, Check, Home, Users, Briefcase, GraduationCap, Search, X, Shield, Lock, Leaf, Globe, Zap, Hammer, FileText } from 'lucide-react';
import { RugbyIcon, UltimateIcon, SorocaIcon, TribuIcon } from './CustomIcons';
import { BADGE_DEFINITIONS, SOROCA_SYMBOLS } from '../data';

interface ValienteProfileProps {
  valiente: Valiente;
  allValientes: Valiente[]; 
  onSelectValiente: (id: string) => void; 
  alerts: Alert[];
  timeline: TimelineEntry[];
  isNahualAuth: boolean;
  onBack: () => void;
  onAction: (action: string, data?: any) => void;
  onToggleStatus: (id: string) => void;
  onLogout?: () => void; 
  onUpdateValiente?: (valiente: Valiente) => void; 
}

interface GridItemProps {
    label: string;
    value: any;
    full?: boolean;
    isEditing?: boolean;
    onChange?: (val: any) => void;
    options?: string[];
    type?: string;
}

const ValienteProfile: React.FC<ValienteProfileProps> = ({ valiente, allValientes, onSelectValiente, alerts, timeline, isNahualAuth, onBack, onAction, onToggleStatus, onLogout, onUpdateValiente }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Valiente>(valiente);

  useEffect(() => {
      setEditForm(valiente);
      setIsEditing(false);
  }, [valiente]);

  const activeAlerts = alerts.filter(a => a.valienteId === valiente.id && !a.isResolved);
  const sortedTimeline = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Search Logic
  const filteredValientes = searchTerm.length >= 2 
    ? allValientes.filter(v => v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && v.id !== valiente.id).slice(0, 5) 
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFromResult = (id: string) => {
      onSelectValiente(id);
      setSearchTerm('');
      setShowResults(false);
  };

  const handleEditChange = (field: keyof Valiente, value: any) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedEditChange = (parent: keyof Valiente, field: string, value: any) => {
      setEditForm(prev => ({
          ...prev,
          [parent]: { ...prev[parent] as any, [field]: value }
      }));
  };

  const saveChanges = () => {
      if (onUpdateValiente) onUpdateValiente(editForm);
      setIsEditing(false);
  };

  // Define Tabs
  const tabs = [
      { id: 'general', label: 'Identidad', icon: UserCheck },
      { id: 'health', label: 'Salud', icon: HeartPulse },
      { id: 'academic', label: 'Educación', icon: GraduationCap },
      { id: 'socio', label: 'Entorno', icon: Home },
      { id: 'family', label: 'Red Apoyo', icon: Users },
      { id: 'ser', label: 'El Ser', icon: Zap }, // New tab for Hobbies/Projects
      { id: 'nahual', label: 'Nahual', icon: Shield }, // New tab for Dossier Psychosocial
      { id: 'history', label: 'Historial', icon: Activity },
  ];

  // Helper for context styling
  const getContextStyles = () => {
      if (valiente.programs.includes('SOROCA')) {
          return {
              gradient: 'from-emerald-700 to-teal-900',
              icon: <SorocaIcon className="text-white" size={24} />,
              watermark: <SorocaIcon className="text-white opacity-10" size={150} />,
              primaryColor: 'text-emerald-900',
              accentBg: 'bg-emerald-50'
          };
      }
      return { // Tribu Default
          gradient: 'from-indigo-800 to-purple-900',
          icon: <TribuIcon className="text-white" size={24} />,
          watermark: <TribuIcon className="text-white opacity-10" size={150} />,
          primaryColor: 'text-indigo-900',
          accentBg: 'bg-indigo-50'
      };
  };

  const contextStyle = getContextStyles();

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-10">
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium">
            <ChevronRight className="rotate-180 mr-1" size={16} /> Directorio
          </button>
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Ir a otro valiente..." className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm outline-none" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }} />
                  {showResults && filteredValientes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                          {filteredValientes.map(v => (
                              <button key={v.id} onClick={() => handleSelectFromResult(v.id)} className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b flex items-center gap-2">
                                  <img src={v.photoUrl} className="w-6 h-6 rounded-full" alt="" />
                                  <span className="text-sm font-bold text-slate-700">{v.fullName}</span>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
              {onUpdateValiente && (
                  !isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-indigo-600 hover:bg-indigo-50"><Edit2 size={14} /> EDITAR</button>
                  ) : (
                    <div className="flex gap-2">
                        <button onClick={() => { setEditForm(valiente); setIsEditing(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white">CANCELAR</button>
                        <button onClick={saveChanges} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-emerald-600 text-white">GUARDAR</button>
                    </div>
                  )
              )}
          </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className={`h-32 bg-gradient-to-r ${contextStyle.gradient} relative`}>
            <div className="absolute top-1/2 left-10 -translate-y-1/2 pointer-events-none">{contextStyle.watermark}</div>
            <div className="absolute bottom-4 right-6 flex gap-2">
                {valiente.programs.includes('SOROCA') && <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg font-bold text-sm">SOROCA</span>}
                {valiente.programs.includes('TRIBU') && <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg font-bold text-sm">TRIBU</span>}
            </div>
        </div>
        
        <div className="px-6 pb-6 pt-4 relative">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="-mt-16 relative">
                    <img src={valiente.photoUrl} alt={valiente.fullName} className="w-32 h-32 rounded-xl border-4 border-white shadow-md bg-slate-200 object-cover" />
                </div>
                <div className="flex-1 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-slate-900">{valiente.fullName} <span className="text-lg text-slate-400 font-normal">({valiente.nickname || 'Sin apodo'})</span></h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${valiente.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>{valiente.status}</span>
                    </div>
                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4">
                        <span>{valiente.docType} {valiente.documentId}</span>
                        <span>•</span>
                        <span>{valiente.age} Años</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin size={12}/> {valiente.neighborhood}</span>
                    </div>
                </div>
                <div className="flex gap-2 self-end">
                   <button onClick={() => onAction('REPORT_INJURY')} className="btn-action bg-red-50 text-red-700 border-red-100"><HeartPulse size={16}/> Lesión</button>
                   <button onClick={() => onAction('OPEN_NAHUAL')} className="btn-action bg-slate-100 text-slate-700 border-slate-300"><Shield size={16}/> Nahual</button>
                   <button onClick={() => onAction('ADD_BADGE')} className="btn-action bg-amber-50 text-amber-700 border-amber-100"><Award size={16}/> Hito</button>
                </div>
             </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center py-4 bg-slate-50 border-t border-slate-100 overflow-x-auto">
            <div className="flex gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5" size={18} />
          <div><h4 className="text-red-800 font-bold text-sm">Alertas</h4><ul className="text-sm text-red-700 list-disc list-inside">{activeAlerts.map(a => <li key={a.id}>{a.message}</li>)}</ul></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            
            {/* TAB: GENERAL */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-fade-in">
                    <Section title="Datos Básicos">
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('nationality', val)} label="Nacionalidad" value={editForm.nationality} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('placeOfBirth', val)} label="Lugar Nacimiento" value={editForm.placeOfBirth} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('nickname', val)} label="Apodo" value={editForm.nickname} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('sex', val)} label="Sexo" value={editForm.sex} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('genderIdentity', val)} label="Identidad Género" value={editForm.genderIdentity} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('socialMedia', val)} label="Redes Sociales" value={editForm.socialMedia} />
                    </Section>
                    <Section title="Contacto">
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('address', val)} label="Dirección" value={editForm.address} full />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('email', val)} label="Email" value={editForm.email} />
                         <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('phone', val)} label="Celular" value={editForm.phone} />
                    </Section>
                </div>
            )}

            {/* TAB: ACADEMIC */}
            {activeTab === 'academic' && (
                <div className="space-y-6 animate-fade-in">
                     <Section title="Escolaridad">
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('schoolingLevel', val)} label="Nivel" value={editForm.schoolingLevel} />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('institution', val)} label="Institución" value={editForm.institution} />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('academicProgram', val)} label="Programa/Curso" value={editForm.academicProgram} />
                     </Section>
                     <Section title="Ocupación">
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('isWorking', val === 'Sí')} label="¿Trabaja?" value={editForm.isWorking ? 'Sí' : 'No'} />
                        {editForm.isWorking && <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('workDescription', val)} label="Labor" value={editForm.workDescription} full />}
                     </Section>
                </div>
            )}

            {/* TAB: SOCIO */}
            {activeTab === 'socio' && (
                <div className="space-y-6 animate-fade-in">
                    <Section title="Entorno">
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('stratum', val)} label="Estrato" value={editForm.stratum} />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('commune', val)} label="Comuna" value={editForm.commune} />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('ethnicity', val)} label="Etnia" value={editForm.ethnicity} />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('isConflictVictim', val === 'Sí')} label="Víctima Conflicto" value={editForm.isConflictVictim ? 'Sí' : 'No'} />
                    </Section>
                </div>
            )}

            {/* TAB: SER (NEW) */}
            {activeTab === 'ser' && (
                <div className="space-y-6 animate-fade-in">
                    <Section title="Aficiones y Gustos">
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('hobbies', val)} label="Hobbies" value={editForm.hobbies} full />
                        <GridItem isEditing={isEditing} onChange={(val) => handleEditChange('careerInterests', val)} label="Proyecto de Vida" value={editForm.careerInterests} full />
                    </Section>
                </div>
            )}

            {/* TAB: NAHUAL (NEW) */}
            {activeTab === 'nahual' && (
                <div className="space-y-6 animate-fade-in">
                    {!isNahualAuth ? (
                        <div className="bg-slate-100 p-8 rounded-xl text-center">
                            <Lock className="mx-auto mb-2 text-slate-400" size={32} />
                            <p className="text-slate-500 font-bold">Información Protegida</p>
                            <p className="text-xs text-slate-400 mb-4">Requiere acceso Psicosocial</p>
                            <button onClick={() => onAction('OPEN_NAHUAL')} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Autenticar</button>
                        </div>
                    ) : (
                        <>
                            <Section title="Dossier Psicosocial">
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Factores Protectores</label>
                                        <textarea className="w-full p-2 border rounded bg-emerald-50 border-emerald-100 text-sm" rows={2} readOnly value={valiente.protectiveFactors || 'Sin registro'} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Factores de Riesgo</label>
                                        <textarea className="w-full p-2 border rounded bg-red-50 border-red-100 text-sm" rows={2} readOnly value={valiente.riskFactors || 'Sin registro'} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Transformaciones Subjetivas</label>
                                        <textarea className="w-full p-2 border rounded bg-indigo-50 border-indigo-100 text-sm" rows={3} readOnly value={valiente.subjectiveTransformations || 'Sin registro'} />
                                    </div>
                                </div>
                            </Section>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-center">
                                <button onClick={() => onAction('OPEN_NAHUAL')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                    <Edit2 size={16}/> Gestionar Acompañamiento
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* TAB: HEALTH, FAMILY, HISTORY (Existing, simplified) */}
            {activeTab === 'health' && <Section title="Salud"><GridItem label="EPS" value={editForm.eps}/><GridItem label="Alergias" value={editForm.allergyType || 'No'}/></Section>}
            {activeTab === 'family' && <Section title="Acudiente"><GridItem label="Nombre" value={editForm.primaryGuardian?.fullName}/><GridItem label="Celular" value={editForm.primaryGuardian?.phone}/></Section>}
            {activeTab === 'history' && (
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
                    <h3 className="font-bold text-slate-800 mb-6">Línea de Tiempo</h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:bg-slate-200">
                        {sortedTimeline.map((item) => (
                            <div key={item.id} className="relative pl-8">
                                <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-200 border-4 border-white"></div>
                                <div className="text-xs text-slate-400">{item.date}</div>
                                <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                <div className="text-sm text-slate-600">{item.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* SIDEBAR: SYMBOLS & LEVELS */}
        <div className="space-y-6">
            
            {/* SOROCA LEVEL */}
            {valiente.programs.includes('SOROCA') && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 bg-emerald-50/30">
                    <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2"><Leaf size={18} /> Universo Soroca</h3>
                    <div className="text-center p-4">
                        <div className="text-4xl mb-2">{SOROCA_SYMBOLS[valiente.sorocaMacro || '']?.icon || '🌱'}</div>
                        <div className="font-black text-lg text-emerald-800">{valiente.sorocaMacro}</div>
                        <div className="text-sm text-emerald-600">{valiente.sorocaSymbol}</div>
                    </div>
                </div>
            )}

            {/* TRIBU LEVEL */}
            {valiente.programs.includes('TRIBU') && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/30">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2"><Shield size={18} /> Elementos Tribu</h3>
                    <div className="space-y-2">
                        {valiente.badges.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-indigo-100 shadow-sm">
                                <span className="text-xl">{BADGE_DEFINITIONS[b]?.icon || '🏅'}</span>
                                <span className="text-sm font-bold text-indigo-900">{b}</span>
                            </div>
                        ))}
                        {valiente.badges.length === 0 && <p className="text-sm text-indigo-400 italic">Iniciando camino.</p>}
                    </div>
                </div>
            )}

            {/* Documents */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} /> Documentos</h3>
                 <div className="space-y-2">
                     <DocStatus label="Documento ID" check={valiente.documents?.idCopy} />
                     <DocStatus label="Certificado EPS" check={valiente.documents?.epsCert} />
                     <DocStatus label="Consentimiento" check={valiente.documents?.consent} />
                 </div>
            </div>
        </div>
      </div>
      
      <style>{` .btn-action { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; border-width: 1px; } `}</style>
    </div>
  );
};

const Section = ({ title, children }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">{children}</div>
    </div>
);

const GridItem = ({ label, value, full, isEditing, onChange, options, type = 'text' }: GridItemProps) => (
    <div className={full ? 'md:col-span-2' : ''}>
        <div className="text-xs text-slate-500 font-semibold mb-0.5">{label}</div>
        {isEditing ? (
            options ? (
                <select className="w-full p-1.5 border border-slate-700 rounded text-sm" value={String(value)} onChange={(e) => onChange && onChange(e.target.value)}>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
            ) : <input type={type} className="w-full p-1.5 border border-slate-700 rounded text-sm" value={value} onChange={(e) => onChange && onChange(e.target.value)}/>
        ) : <div className="text-sm text-slate-800 font-medium truncate">{value || 'N/A'}</div>}
    </div>
);

const DocStatus = ({ label, check }: any) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600">{label}</span>
        {check ? <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">OK</span> : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded">Pendiente</span>}
    </div>
);

export default ValienteProfile;
