import React, { useState, useEffect } from 'react';
import {
  UserCheck, HeartPulse, GraduationCap, Home, Users, Zap,
  ChevronRight, Save, Loader2, AlertCircle, CheckCircle2, Plus,
} from 'lucide-react';
import { getValienteById, actualizarValiente } from '../../lib/services/valientes.service';
import {
  guardarSalud, guardarEducacion, guardarUbicacion,
  guardarContextoFamiliar, guardarPerfilDeportivo, guardarPerfilSoroca,
} from '../../lib/services/perfiles.service';
import { getCiudades, getComunas, getBarrios, formatComuna } from '../../lib/services/catalogos.service';
import { parseMedicamentos, serializeMedicamentos } from '../../types/database.types';
import { getRangosIngreso } from '../../lib/config/smmlv';
import { supabase } from '../../lib/supabase';
import type { ValienteCompleto, Ciudad, Comuna, Barrio, Medicamento } from '../../types/database.types';

// ── Props ─────────────────────────────────────────────────────────────────

interface ValienteEditViewProps {
  valienteId: number;
  onBack: () => void;
  context: 'GLOBAL' | 'TRIBU' | 'SOROCA';
}

// ── Sub-componentes ───────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Field = ({
  label, name, value, onChange, type = 'text', full, options, rows,
}: {
  label: string; name: string; value: string; full?: boolean;
  type?: string; rows?: number;
  options?: { value: string; label: string }[];
  onChange: (name: string, value: string) => void;
}) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <label className="text-xs text-slate-500 font-semibold mb-1 block uppercase tracking-wide">
      {label}
    </label>
    {options ? (
      <select
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
      >
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : rows ? (
      <textarea
        value={value}
        rows={rows}
        onChange={e => onChange(name, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
      />
    )}
  </div>
);

const TABS = [
  { id: 'general',   label: 'Identidad',  icon: UserCheck     },
  { id: 'health',    label: 'Salud',      icon: HeartPulse    },
  { id: 'academic',  label: 'Educacion',  icon: GraduationCap },
  { id: 'socio',     label: 'Entorno',    icon: Home          },
  { id: 'family',    label: 'Red Apoyo',  icon: Users         },
  { id: 'programas', label: 'Programas',  icon: Zap           },
];

// ── Componente principal ──────────────────────────────────────────────────

const ValienteEditView: React.FC<ValienteEditViewProps> = ({ valienteId, onBack, context }) => {
  const [valiente,  setValiente]  = useState<ValienteCompleto | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [basic, setBasic] = useState({
    nombres: '', apellidos: '', apodo: '', sexo: '', identidad_genero: '',
    fecha_nacimiento: '', celular: '', email: '', nacionalidad: '',
    lugar_nacimiento: '', trabaja_estudia: '', estado: '',
  });

  const [salud, setSalud] = useState({
    tipo_sangre: '', tiene_alergias: 'false', alergias: '',
    tiene_discapacidad: 'false', tipo_discapacidad: '',
    diagnostico_medico: '', medicamentos_actuales: '', tratamiento_en_curso: '',
    regimen_eps: '',
  });

  const [educacion, setEducacion] = useState({
    nivel_educativo: '', grado_actual: '', materia_favorita: '', materia_dificil: '',
  });

  const [ubicacion, setUbicacion] = useState({
    direccion: '',
    estrato: '',
    ciudad_id: '' as string,   // '' = sin seleccionar
    comuna_id: '' as string,
    barrio_id: '' as string,
    barrio_otro: '',           // texto libre cuando barrio_id === 'otro'
  });

  // Catálogos para ubicación
  const [ciudadesCat, setCiudadesCat] = useState<Ciudad[]>([]);
  const [comunasCat,  setComunasCat]  = useState<Comuna[]>([]);
  const [barriosCat,  setBarriosCat]  = useState<Barrio[]>([]);

  // Lista dinámica de medicamentos
  const EMPTY_MED: Medicamento = { nombre: '', dosis: '', frecuencia: '' };
  const [meds, setMeds] = useState<Medicamento[]>([]);
  const [hasMedEdit, setHasMedEdit] = useState(false); // toggle "toma medicamentos"

  const [contextoFamiliar, setContextoFamiliar] = useState({
    composicion_familiar: '', numero_personas_hogar: '',
    ingreso_mensual_hogar: '', etnia: '',
    es_victima_conflicto: 'false', esta_en_ruv: 'false',
  });

  const [acudiente, setAcudiente] = useState({
    nombre_completo: '', celular: '', email: '', parentesco: '',
  });

  const [perfilDep, setPerfilDep] = useState({
    disciplina: '', talla_camisa: '', talla_guayos: '', talla_pantalon: '',
  });

  // ── Estado para pestaña Programas ─────────────────────────────────────
  // Programa a agregar
  const [nuevoProg, setNuevoProg]           = useState<'TRIBU' | 'SOROCA' | ''>('');
  const [nuevaDisciplina, setNuevaDisciplina] = useState('');
  const [nuevoMacro, setNuevoMacro]          = useState('');
  const [savingProg, setSavingProg]          = useState(false);
  const [progMsg, setProgMsg]               = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  // Edición de inscripciones existentes
  const [editDisciplina, setEditDisciplina] = useState('');
  const [editMacro, setEditMacro]           = useState('');
  const [savingEdit, setSavingEdit]         = useState(false);

  // ── Carga inicial ─────────────────────────────────────────────────────
  useEffect(() => {
    // Cargar catálogo de ciudades una sola vez
    getCiudades().then(setCiudadesCat).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getValienteById(valienteId)
      .then(data => {
        setValiente(data);
        setBasic({
          nombres:          data.nombres ?? '',
          apellidos:        data.apellidos ?? '',
          apodo:            data.apodo ?? '',
          sexo:             data.sexo ?? '',
          identidad_genero: data.identidad_genero ?? '',
          fecha_nacimiento: data.fecha_nacimiento ?? '',
          celular:          data.celular ?? '',
          email:            data.email ?? '',
          nacionalidad:     data.nacionalidad ?? '',
          lugar_nacimiento: data.lugar_nacimiento ?? '',
          trabaja_estudia:  (data as any).trabaja_estudia ?? '',
          estado:           data.estado ?? 'ACTIVO',
        });
        setSalud({
          tipo_sangre:           data.salud?.tipo_sangre ?? '',
          tiene_alergias:        String(data.salud?.tiene_alergias ?? false),
          alergias:              data.salud?.alergias ?? '',
          tiene_discapacidad:    String(data.salud?.tiene_discapacidad ?? false),
          tipo_discapacidad:     data.salud?.tipo_discapacidad ?? '',
          diagnostico_medico:    data.salud?.diagnostico_medico ?? '',
          medicamentos_actuales: data.salud?.medicamentos_actuales ?? '',
          tratamiento_en_curso:  data.salud?.tratamiento_en_curso ?? '',
          regimen_eps:           data.salud?.regimen_eps ?? '',
        });
        // Cargar medicamentos — parseMedicamentos maneja texto legado y JSON
        const medsLoaded = parseMedicamentos(data.salud?.medicamentos_actuales);
        setMeds(medsLoaded.length > 0 ? medsLoaded : []);
        setHasMedEdit(medsLoaded.length > 0);
        setEducacion({
          nivel_educativo:  data.educacion?.nivel_educativo ?? '',
          grado_actual:     data.educacion?.grado_actual ?? '',
          materia_favorita: data.educacion?.materia_favorita ?? '',
          materia_dificil:  data.educacion?.materia_dificil ?? '',
        });
        setUbicacion({
          direccion:   data.ubicacion?.direccion ?? '',
          estrato:     data.ubicacion?.estrato ?? '',
          ciudad_id:   data.ubicacion?.ciudad_id ? String(data.ubicacion.ciudad_id) : '',
          comuna_id:   data.ubicacion?.comuna_id ? String(data.ubicacion.comuna_id) : '',
          barrio_id:   data.ubicacion?.barrio_id ? String(data.ubicacion.barrio_id) : '',
          barrio_otro: '',
        });
        // Precargar comunas y barrios si ya había ciudad guardada
        if (data.ubicacion?.ciudad_id) {
          const cid = data.ubicacion.ciudad_id;
          getComunas(cid).then(setComunasCat).catch(console.error);
          getBarrios(cid).then(setBarriosCat).catch(console.error);
        }
        setContextoFamiliar({
          composicion_familiar:  (data.contexto_familiar as any)?.composicion_familiar ?? '',
          numero_personas_hogar: String((data.contexto_familiar as any)?.numero_personas_hogar ?? ''),
          ingreso_mensual_hogar: (data.contexto_familiar as any)?.ingreso_mensual_hogar ?? '',
          etnia:                 (data.contexto_familiar as any)?.etnia ?? '',
          es_victima_conflicto:  String((data.contexto_familiar as any)?.es_victima_conflicto ?? false),
          esta_en_ruv:           String((data.contexto_familiar as any)?.esta_en_ruv ?? false),
        });
        const ac = data.acudientes?.[0];
        setAcudiente({
          nombre_completo: ac?.acudiente?.nombre_completo ?? '',
          celular:         ac?.acudiente?.celular ?? '',
          email:           ac?.acudiente?.email ?? '',
          parentesco:      ac?.parentesco ?? '',
        });
        setPerfilDep({
          disciplina:     data.perfil_deportivo?.disciplina ?? '',
          talla_camisa:   data.perfil_deportivo?.talla_camisa ?? '',
          talla_guayos:   data.perfil_deportivo?.talla_guayos ?? '',
          talla_pantalon: data.perfil_deportivo?.talla_pantalon ?? '',
        });
        // Inicializar edición de programas existentes
        setEditDisciplina(data.perfil_deportivo?.disciplina ?? '');
        setEditMacro(data.perfil_soroca?.macro ?? '');
      })
      .catch(err => setError(err?.message ?? 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [valienteId]);

  const ch = (setter: React.Dispatch<React.SetStateAction<any>>) =>
    (name: string, value: string) => setter((prev: any) => ({ ...prev, [name]: value }));

  // ── Guardar edición disciplina/macro existentes ────────────────────────
  const handleSaveEdit = async () => {
    if (!valiente) return;
    setSavingEdit(true);
    setProgMsg(null);
    try {
      const isTribu  = valiente.programas?.some(p => p.programa?.codigo === 'TRIBU');
      const isSoroca = valiente.programas?.some(p => p.programa?.codigo === 'SOROCA');

      if (isTribu && editDisciplina) {
        await guardarPerfilDeportivo({
          valiente_id: valienteId,
          disciplina: editDisciplina,
          talla_camisa: valiente.perfil_deportivo?.talla_camisa ?? null,
          talla_guayos: valiente.perfil_deportivo?.talla_guayos ?? null,
          talla_pantalon: valiente.perfil_deportivo?.talla_pantalon ?? null,
          tiene_experiencia_previa: valiente.perfil_deportivo?.tiene_experiencia_previa ?? false,
          experiencia_previa: valiente.perfil_deportivo?.experiencia_previa ?? null,
          horario_entrenamiento: valiente.perfil_deportivo?.horario_entrenamiento ?? null,
        } as any);
        // Actualizar nivel en valiente_programa
        const progTribu = valiente.programas?.find(p => p.programa?.codigo === 'TRIBU');
        if (progTribu) {
          await supabase.from('valiente_programa').update({ nivel: editDisciplina }).eq('id', progTribu.id);
        }
      }

      if (isSoroca && editMacro) {
        await guardarPerfilSoroca({
          valiente_id: valienteId,
          macro: editMacro,
          simbolo: valiente.perfil_soroca?.simbolo ?? null,
          intereses_artisticos: valiente.perfil_soroca?.intereses_artisticos ?? null,
          habilidades: valiente.perfil_soroca?.habilidades ?? null,
          proyectos_personales: valiente.perfil_soroca?.proyectos_personales ?? null,
        });
        // Actualizar nivel en valiente_programa
        const progSoroca = valiente.programas?.find(p => p.programa?.codigo === 'SOROCA');
        if (progSoroca) {
          await supabase.from('valiente_programa').update({ nivel: editMacro }).eq('id', progSoroca.id);
        }
      }

      setProgMsg({ type: 'ok', text: 'Cambios guardados correctamente.' });
      // Recargar valiente para reflejar cambios
      const updated = await getValienteById(valienteId);
      setValiente(updated);
    } catch (err: any) {
      setProgMsg({ type: 'err', text: err?.message ?? 'Error al guardar.' });
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Agregar nuevo programa ─────────────────────────────────────────────
  const handleAgregarPrograma = async () => {
    if (!nuevoProg) return;
    if (nuevoProg === 'TRIBU' && !nuevaDisciplina) {
      setProgMsg({ type: 'err', text: 'Selecciona la disciplina (Rugby o Ultimate).' });
      return;
    }
    if (nuevoProg === 'SOROCA' && !nuevoMacro) {
      setProgMsg({ type: 'err', text: 'Selecciona el macro de SOROCA.' });
      return;
    }
    setSavingProg(true);
    setProgMsg(null);
    try {
      // Obtener el id del programa
      const { data: progData } = await supabase
        .from('programa').select('id').eq('codigo', nuevoProg).maybeSingle();
      if (!progData) throw new Error(`Programa ${nuevoProg} no encontrado.`);

      const nivel = nuevoProg === 'TRIBU' ? nuevaDisciplina : nuevoMacro;

      // Insertar en valiente_programa
      const { error: inscErr } = await supabase.from('valiente_programa').insert({
        valiente_id: valienteId,
        programa_id: progData.id,
        es_principal: false,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        fecha_egreso: null,
        estado: 'ACTIVO',
        nivel,
        cohorte: null, sede: null, motivacion: null,
        compromisos: null, transformaciones_subjetivas: null,
      });
      if (inscErr) throw inscErr;

      // Crear/actualizar perfil correspondiente
      if (nuevoProg === 'TRIBU') {
        await guardarPerfilDeportivo({
          valiente_id: valienteId,
          disciplina: nuevaDisciplina,
          talla_camisa: null, talla_guayos: null, talla_pantalon: null,
          tiene_experiencia_previa: false, experiencia_previa: null,
          horario_entrenamiento: null,
        } as any);
        setEditDisciplina(nuevaDisciplina);
      } else {
        await guardarPerfilSoroca({
          valiente_id: valienteId,
          macro: nuevoMacro,
          simbolo: null, intereses_artisticos: null,
          habilidades: null, proyectos_personales: null,
        });
        setEditMacro(nuevoMacro);
      }

      setProgMsg({ type: 'ok', text: `Valiente inscrito en ${nuevoProg} correctamente.` });
      setNuevoProg('');
      setNuevaDisciplina('');
      setNuevoMacro('');
      const updated = await getValienteById(valienteId);
      setValiente(updated);
    } catch (err: any) {
      setProgMsg({ type: 'err', text: err?.message ?? 'Error al inscribir.' });
    } finally {
      setSavingProg(false);
    }
  };

  // ── Guardar ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!valiente) return;
    setSaving(true);
    setError(null);
    try {
      await actualizarValiente(valienteId, {
        nombres: basic.nombres, apellidos: basic.apellidos,
        apodo: basic.apodo || null, sexo: basic.sexo || null,
        identidad_genero: basic.identidad_genero || null,
        fecha_nacimiento: basic.fecha_nacimiento,
        celular: basic.celular || null, email: basic.email || null,
        nacionalidad: basic.nacionalidad || null,
        lugar_nacimiento: basic.lugar_nacimiento || null,
        estado: basic.estado,
      } as any);

      await guardarSalud({
        valiente_id: valienteId,
        eps_id: valiente.salud?.eps_id ?? null,
        eps_nombre: valiente.salud?.eps_nombre ?? null,
        regimen_eps: salud.regimen_eps || null,
        ips_id: valiente.salud?.ips_id ?? null,
        ips_nombre: valiente.salud?.ips_nombre ?? null,
        tipo_sangre: salud.tipo_sangre || null,
        tiene_alergias: salud.tiene_alergias === 'true',
        alergias: salud.alergias || null,
        tiene_discapacidad: salud.tiene_discapacidad === 'true',
        tipo_discapacidad: salud.tipo_discapacidad || null,
        diagnostico_medico: salud.diagnostico_medico || null,
        medicamentos_actuales: serializeMedicamentos(meds),
        tratamiento_en_curso: salud.tratamiento_en_curso || null,
      } as any);

      await guardarEducacion({
        valiente_id: valienteId,
        nivel_educativo: educacion.nivel_educativo || null,
        grado_actual: educacion.grado_actual || null,
        materia_favorita: educacion.materia_favorita || null,
        materia_dificil: educacion.materia_dificil || null,
        institucion_id: valiente.educacion?.institucion_id ?? null,
      } as any);

      await guardarUbicacion({
        valiente_id: valienteId,
        direccion:  ubicacion.direccion || null,
        estrato:    ubicacion.estrato || null,
        ciudad_id:  ubicacion.ciudad_id ? Number(ubicacion.ciudad_id) : null,
        comuna_id:  ubicacion.comuna_id ? Number(ubicacion.comuna_id) : null,
        barrio_id:  ubicacion.barrio_id && ubicacion.barrio_id !== 'otro'
          ? Number(ubicacion.barrio_id)
          : null,
        latitud:    valiente.ubicacion?.latitud ?? null,
        longitud:   valiente.ubicacion?.longitud ?? null,
      });

      await guardarContextoFamiliar({
        valiente_id: valienteId,
        composicion_familiar: contextoFamiliar.composicion_familiar || null,
        numero_personas_hogar: contextoFamiliar.numero_personas_hogar
          ? parseInt(contextoFamiliar.numero_personas_hogar) : null,
        ingreso_mensual_hogar: contextoFamiliar.ingreso_mensual_hogar || null,
        etnia: contextoFamiliar.etnia || null,
        es_victima_conflicto: contextoFamiliar.es_victima_conflicto === 'true',
        esta_en_ruv: contextoFamiliar.esta_en_ruv === 'true',
      } as any);

      if (context === 'TRIBU' || valiente.perfil_deportivo) {
        await guardarPerfilDeportivo({
          valiente_id: valienteId,
          disciplina: perfilDep.disciplina || null,
          talla_camisa: perfilDep.talla_camisa || null,
          talla_guayos: perfilDep.talla_guayos || null,
          talla_pantalon: perfilDep.talla_pantalon || null,
          tiene_experiencia_previa: valiente.perfil_deportivo?.tiene_experiencia_previa ?? false,
          experiencia_previa: valiente.perfil_deportivo?.experiencia_previa ?? null,
          horario_entrenamiento: valiente.perfil_deportivo?.horario_entrenamiento ?? null,
        } as any);
      }

      setSuccess(true);
      setTimeout(() => { setSuccess(false); onBack(); }, 1500);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600" />
    </div>
  );

  if (!valiente) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="text-red-500" size={40} />
      <p className="text-slate-700 font-medium">Valiente no encontrado</p>
    </div>
  );

  const nombreCompleto = `${valiente.nombres} ${valiente.apellidos}`;

  const SaveBtn = () => (
    <button onClick={handleSave} disabled={saving}
      className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {saving ? 'Guardando...' : 'Guardar cambios'}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium"
        >
          <ChevronRight className="rotate-180 mr-1" size={16} /> Volver al perfil
        </button>
        <SaveBtn />
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">
          <CheckCircle2 size={16} /> Cambios guardados correctamente.
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="h-20 bg-gradient-to-r from-indigo-800 to-purple-900" />
        <div className="px-6 pb-5 pt-3">
          <h1 className="text-2xl font-bold text-slate-900">{nombreCompleto}</h1>
          <p className="text-sm text-slate-400">
            {valiente.tipo_documento} {valiente.numero_documento} · Editando perfil
          </p>
        </div>
        <div className="flex justify-center py-3 bg-slate-50 border-t border-slate-100 overflow-x-auto">
          <div className="flex gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={15} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB: IDENTIDAD ── */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <Section title="Datos Basicos">
            <Field label="Nombres"           name="nombres"          value={basic.nombres}          onChange={ch(setBasic)} />
            <Field label="Apellidos"          name="apellidos"        value={basic.apellidos}        onChange={ch(setBasic)} />
            <Field label="Apodo"              name="apodo"            value={basic.apodo}            onChange={ch(setBasic)} />
            <Field label="Fecha Nacimiento"   name="fecha_nacimiento" value={basic.fecha_nacimiento} onChange={ch(setBasic)} type="date" />
            <Field label="Sexo Biologico"     name="sexo"             value={basic.sexo}             onChange={ch(setBasic)}
              options={[{value:'Masculino',label:'Masculino'},{value:'Femenino',label:'Femenino'},{value:'Intersexual',label:'Intersexual'}]} />
            <Field label="Identidad de Genero" name="identidad_genero" value={basic.identidad_genero} onChange={ch(setBasic)}
              options={[{value:'Masculino',label:'Masculino'},{value:'Femenino',label:'Femenino'},{value:'No Binario',label:'No Binario'},{value:'Prefiero no decir',label:'Prefiero no decir'}]} />
            <Field label="Nacionalidad"       name="nacionalidad"     value={basic.nacionalidad}     onChange={ch(setBasic)} />
            <Field label="Lugar Nacimiento"   name="lugar_nacimiento" value={basic.lugar_nacimiento} onChange={ch(setBasic)} />
            <Field label="Estado"             name="estado"           value={basic.estado}           onChange={ch(setBasic)}
              options={[{value:'ACTIVO',label:'Activo'},{value:'INACTIVO',label:'Inactivo'},{value:'EGRESADO',label:'Egresado'}]} />
            <Field label="Trabaja / Estudia"  name="trabaja_estudia"  value={basic.trabaja_estudia}  onChange={ch(setBasic)}
              options={[{value:'Estudia',label:'Estudia'},{value:'Trabaja',label:'Trabaja'},{value:'Trabaja y estudia',label:'Trabaja y estudia'},{value:'Ninguna',label:'Ninguna'}]} />
          </Section>
          <Section title="Contacto">
            <Field label="Celular" name="celular" value={basic.celular} onChange={ch(setBasic)} type="tel" />
            <Field label="Email"   name="email"   value={basic.email}   onChange={ch(setBasic)} type="email" />
          </Section>
        </div>
      )}

      {/* ── TAB: SALUD ── */}
      {activeTab === 'health' && (
        <Section title="Salud y Bienestar">
          <Field label="Régimen de EPS" name="regimen_eps" value={salud.regimen_eps} onChange={ch(setSalud)}
            options={[
              { value: 'CONTRIBUTIVO', label: 'Contributivo' },
              { value: 'SUBSIDIADO',   label: 'Subsidiado'   },
              { value: 'ESPECIAL',     label: 'Especial'     },
            ]} />
          <Field label="Tipo de Sangre" name="tipo_sangre" value={salud.tipo_sangre} onChange={ch(setSalud)}
            options={['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => ({value:t,label:t}))} />
          <Field label="Tiene Discapacidad" name="tiene_discapacidad" value={salud.tiene_discapacidad} onChange={ch(setSalud)}
            options={[{value:'false',label:'No'},{value:'true',label:'Si'}]} />
          {salud.tiene_discapacidad === 'true' && (
            <Field label="Tipo de Discapacidad" name="tipo_discapacidad" value={salud.tipo_discapacidad} onChange={ch(setSalud)} />
          )}
          <Field label="Tiene Alergias" name="tiene_alergias" value={salud.tiene_alergias} onChange={ch(setSalud)}
            options={[{value:'false',label:'No'},{value:'true',label:'Si'}]} />
          {salud.tiene_alergias === 'true' && (
            <Field label="Cuales alergias" name="alergias" value={salud.alergias} onChange={ch(setSalud)} />
          )}
          <Field label="Diagnostico Medico"    name="diagnostico_medico"    value={salud.diagnostico_medico}    onChange={ch(setSalud)} full rows={2} />
          {/* Medicamentos — lista dinámica */}
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500 font-semibold mb-1 block uppercase tracking-wide">
              ¿Toma algún medicamento?
            </label>
            <select
              value={hasMedEdit ? 'Si' : 'No'}
              onChange={e => {
                const val = e.target.value;
                if (val === 'No' && meds.some(m => m.nombre.trim())) {
                  if (!window.confirm('¿Seguro que deseas quitar los medicamentos registrados?')) return;
                  setMeds([]);
                }
                setHasMedEdit(val === 'Si');
                if (val === 'Si' && meds.length === 0) setMeds([EMPTY_MED]);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
            >
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </select>
            {hasMedEdit && (
              <div style={{ marginTop: '0.75rem' }}>
                {meds.map((med, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                      placeholder="Nombre del medicamento"
                      value={med.nombre}
                      onChange={e => setMeds(prev => prev.map((m, j) => j === i ? { ...m, nombre: e.target.value } : m))}
                    />
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                      placeholder="Dosis / concentración"
                      value={med.dosis}
                      onChange={e => setMeds(prev => prev.map((m, j) => j === i ? { ...m, dosis: e.target.value } : m))}
                    />
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                      placeholder="Frecuencia (ej. cada 8h)"
                      value={med.frecuencia}
                      onChange={e => setMeds(prev => prev.map((m, j) => j === i ? { ...m, frecuencia: e.target.value } : m))}
                    />
                    <button
                      type="button"
                      onClick={() => setMeds(prev => prev.length === 1 ? [EMPTY_MED] : prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem', padding: '0 0.25rem' }}
                      title="Quitar medicamento"
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMeds(prev => [...prev, EMPTY_MED])}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                  style={{ borderStyle: 'dashed', cursor: 'pointer', marginTop: '0.25rem' }}
                >+ Agregar medicamento</button>
              </div>
            )}
          </div>
          <Field label="Tratamiento en Curso"  name="tratamiento_en_curso"  value={salud.tratamiento_en_curso}  onChange={ch(setSalud)} full rows={2} />
        </Section>
      )}

      {/* ── TAB: EDUCACION ── */}
      {activeTab === 'academic' && (
        <Section title="Escolaridad">
          <Field label="Nivel Educativo" name="nivel_educativo" value={educacion.nivel_educativo} onChange={ch(setEducacion)}
            options={['Primaria','Secundaria','Tecnico','Tecnologo','Profesional universitario','Posgrado','Otro'].map(v => ({value:v,label:v}))} />
          <Field label="Grado / Semestre" name="grado_actual"     value={educacion.grado_actual}     onChange={ch(setEducacion)} />
          <Field label="Materia Favorita" name="materia_favorita" value={educacion.materia_favorita} onChange={ch(setEducacion)} />
          <Field label="Materia Dificil"  name="materia_dificil"  value={educacion.materia_dificil}  onChange={ch(setEducacion)} />
        </Section>
      )}

      {/* ── TAB: ENTORNO ── */}
      {activeTab === 'socio' && (
        <div className="space-y-4">
          <Section title="Ubicacion">
            {/* Ciudad */}
            <div>
              <label className="text-xs text-slate-500 font-semibold mb-1 block uppercase tracking-wide">Ciudad / Municipio</label>
              <select
                value={ubicacion.ciudad_id}
                onChange={e => {
                  const id = e.target.value;
                  setUbicacion(prev => ({ ...prev, ciudad_id: id, comuna_id: '', barrio_id: '', barrio_otro: '' }));
                  setComunasCat([]);
                  setBarriosCat([]);
                  if (id) {
                    getComunas(Number(id)).then(setComunasCat).catch(console.error);
                    getBarrios(Number(id)).then(setBarriosCat).catch(console.error);
                  }
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              >
                <option value="">Seleccionar ciudad...</option>
                {ciudadesCat.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.departamento ? ` — ${c.departamento}` : ''}</option>)}
              </select>
            </div>

            {/* Barrio / Corregimiento */}
            <div>
              <label className="text-xs text-slate-500 font-semibold mb-1 block uppercase tracking-wide">Barrio / Corregimiento</label>
              <select
                value={ubicacion.barrio_id}
                onChange={e => setUbicacion(prev => ({ ...prev, barrio_id: e.target.value, barrio_otro: '' }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                disabled={!ubicacion.ciudad_id}
              >
                <option value="">{ubicacion.ciudad_id ? 'Seleccionar...' : 'Primero selecciona ciudad'}</option>
                {barriosCat.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                <option value="otro">Otro (escribir)</option>
              </select>
              {ubicacion.barrio_id === 'otro' && (
                <input
                  type="text"
                  placeholder="Escribe el barrio o corregimiento..."
                  value={ubicacion.barrio_otro}
                  onChange={e => setUbicacion(prev => ({ ...prev, barrio_otro: e.target.value }))}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                />
              )}
            </div>

            {/* Comuna — solo si la ciudad seleccionada tiene comunas */}
            {comunasCat.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block uppercase tracking-wide">Comuna</label>
                <select
                  value={ubicacion.comuna_id}
                  onChange={e => setUbicacion(prev => ({ ...prev, comuna_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  {comunasCat.map(c => <option key={c.id} value={c.id}>{formatComuna(c.nombre)}</option>)}
                </select>
              </div>
            )}

            <Field label="Direccion de Residencia" name="direccion" value={ubicacion.direccion} onChange={ch(setUbicacion)} full />
            <Field label="Estrato" name="estrato" value={ubicacion.estrato} onChange={ch(setUbicacion)}
              options={['1','2','3','4','5','6'].map(v => ({value:v,label:`Estrato ${v}`}))} />
          </Section>
          <Section title="Contexto Familiar y Socioeconomico">
            <Field label="Composicion Familiar"      name="composicion_familiar"  value={contextoFamiliar.composicion_familiar}  onChange={ch(setContextoFamiliar)} full rows={2} />
            <Field label="Personas en el Hogar"      name="numero_personas_hogar" value={contextoFamiliar.numero_personas_hogar} onChange={ch(setContextoFamiliar)} type="number" />
            <Field label="Ingreso Mensual del Hogar" name="ingreso_mensual_hogar" value={contextoFamiliar.ingreso_mensual_hogar} onChange={ch(setContextoFamiliar)}
              options={getRangosIngreso().map(r => ({ value: r.value, label: r.label }))} />
            <Field label="Etnia" name="etnia" value={contextoFamiliar.etnia} onChange={ch(setContextoFamiliar)}
              options={['Mestizo','Afrocolombiano','Indigena','Raizal','Otro'].map(v => ({value:v,label:v}))} />
            <Field label="Victima del Conflicto" name="es_victima_conflicto" value={contextoFamiliar.es_victima_conflicto} onChange={ch(setContextoFamiliar)}
              options={[{value:'false',label:'No'},{value:'true',label:'Si'}]} />
            <Field label="Esta en el RUV" name="esta_en_ruv" value={contextoFamiliar.esta_en_ruv} onChange={ch(setContextoFamiliar)}
              options={[{value:'false',label:'No'},{value:'true',label:'Si'}]} />
          </Section>
          {(context === 'TRIBU' || valiente.perfil_deportivo) && (
            <Section title="Perfil Deportivo">
              <Field label="Disciplina"     name="disciplina"     value={perfilDep.disciplina}     onChange={ch(setPerfilDep)}
                options={[{value:'Ultimate',label:'Ultimate'},{value:'Rugby',label:'Rugby'}]} />
              <Field label="Talla Camiseta" name="talla_camisa"   value={perfilDep.talla_camisa}   onChange={ch(setPerfilDep)}
                options={['XS','S','M','L','XL','XXL'].map(v => ({value:v,label:v}))} />
              <Field label="Talla Guayos"   name="talla_guayos"   value={perfilDep.talla_guayos}   onChange={ch(setPerfilDep)} />
              <Field label="Talla Pantalon" name="talla_pantalon" value={perfilDep.talla_pantalon} onChange={ch(setPerfilDep)} />
            </Section>
          )}
        </div>
      )}

      {/* ── TAB: RED APOYO ── */}
      {activeTab === 'family' && (
        <Section title="Acudiente Principal">
          <Field label="Nombre Completo" name="nombre_completo" value={acudiente.nombre_completo} onChange={ch(setAcudiente)} full />
          <Field label="Parentesco"      name="parentesco"      value={acudiente.parentesco}      onChange={ch(setAcudiente)} />
          <Field label="Celular"         name="celular"         value={acudiente.celular}         onChange={ch(setAcudiente)} type="tel" />
          <Field label="Email"           name="email"           value={acudiente.email}           onChange={ch(setAcudiente)} type="email" />
        </Section>
      )}

      {/* ── TAB: PROGRAMAS ── */}
      {activeTab === 'programas' && (
        <div className="space-y-4">

          {/* Feedback */}
          {progMsg && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
              progMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {progMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {progMsg.text}
            </div>
          )}

          {/* Programas actuales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
              Programas actuales
            </h3>

            {(!valiente.programas || valiente.programas.length === 0) ? (
              <p className="text-sm text-slate-400 italic">Sin programas inscritos.</p>
            ) : (
              <div className="space-y-4">
                {valiente.programas.map(p => {
                  const codigo = p.programa?.codigo;
                  const isTribu  = codigo === 'TRIBU';
                  const isSoroca = codigo === 'SOROCA';
                  return (
                    <div key={p.id}
                      className={`p-4 rounded-xl border-2 ${isTribu ? 'border-indigo-200 bg-indigo-50' : isSoroca ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-black ${isTribu ? 'text-indigo-800' : isSoroca ? 'text-emerald-800' : 'text-slate-700'}`}>
                          {p.programa?.nombre ?? codigo}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          p.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>{p.estado}</span>
                      </div>

                      {isTribu && (
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wide">
                            Disciplina
                          </label>
                          <select
                            value={editDisciplina}
                            onChange={e => setEditDisciplina(e.target.value)}
                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Rugby">Rugby</option>
                            <option value="Ultimate">Ultimate</option>
                          </select>
                        </div>
                      )}

                      {isSoroca && (
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wide">
                            Macro
                          </label>
                          <select
                            value={editMacro}
                            onChange={e => setEditMacro(e.target.value)}
                            className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-400"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Soñar">Soñar</option>
                            <option value="Romper">Romper</option>
                            <option value="Cambiar">Cambiar</option>
                            <option value="Mundo Cotidiano">Mundo Cotidiano</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {savingEdit ? 'Guardando...' : 'Guardar cambios de programas'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Inscribir en nuevo programa */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
              Inscribir en nuevo programa
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wide">
                  Programa
                </label>
                <select
                  value={nuevoProg}
                  onChange={e => {
                    setNuevoProg(e.target.value as 'TRIBU' | 'SOROCA' | '');
                    setNuevaDisciplina('');
                    setNuevoMacro('');
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white"
                >
                  <option value="">Seleccionar programa...</option>
                  {!valiente.programas?.some(p => p.programa?.codigo === 'TRIBU') && (
                    <option value="TRIBU">TRIBU</option>
                  )}
                  {!valiente.programas?.some(p => p.programa?.codigo === 'SOROCA') && (
                    <option value="SOROCA">SOROCA</option>
                  )}
                </select>
              </div>

              {nuevoProg === 'TRIBU' && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wide">
                    Disciplina
                  </label>
                  <select
                    value={nuevaDisciplina}
                    onChange={e => setNuevaDisciplina(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Rugby">Rugby</option>
                    <option value="Ultimate">Ultimate</option>
                  </select>
                </div>
              )}

              {nuevoProg === 'SOROCA' && (
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1 uppercase tracking-wide">
                    Macro
                  </label>
                  <select
                    value={nuevoMacro}
                    onChange={e => setNuevoMacro(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Soñar">Soñar</option>
                    <option value="Romper">Romper</option>
                    <option value="Cambiar">Cambiar</option>
                    <option value="Mundo Cotidiano">Mundo Cotidiano</option>
                  </select>
                </div>
              )}

              {nuevoProg && (
                <div className="flex justify-end">
                  <button
                    onClick={handleAgregarPrograma}
                    disabled={savingProg}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    {savingProg ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {savingProg ? 'Inscribiendo...' : `Inscribir en ${nuevoProg}`}
                  </button>
                </div>
              )}

              {/* Si ya está en ambos programas */}
              {valiente.programas?.some(p => p.programa?.codigo === 'TRIBU') &&
               valiente.programas?.some(p => p.programa?.codigo === 'SOROCA') && (
                <p className="text-sm text-slate-400 italic text-center py-2">
                  El valiente ya está inscrito en todos los programas disponibles.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón guardar inferior */}
      <div className="flex justify-end mt-6">
        <SaveBtn />
      </div>
    </div>
  );
};

export default ValienteEditView;
