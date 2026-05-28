import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Save, User, AlertCircle, CreditCard,
  Home, HeartHandshake, FileText, Upload, Activity, CheckCircle2
} from 'lucide-react';
import '../ExpressRegistration/ExpressRegistration.css';
import './FullRegistration.css';
import { registrarValienteCompleto, subirDocumentoValiente } from '../../../lib/services/valientes.service';
import { getEPS, getCiudades, getComunas, getInstitucionesEducativas, getPaises, getIPS } from '../../../lib/services/catalogos.service';
import type { EPS, Ciudad, Comuna, InstitucionEducativa, Pais, IPS } from '../../../types/database.types';

interface FullRegistrationProps {
  context: 'TRIBU' | 'SOROCA';
  onBack: () => void;
}

type Step = 'intro' | 'basic' | 'residence' | 'health' | 'socioeconomic' | 'guardian' | 'documents';

const STEPS: Step[] = ['intro', 'basic', 'residence', 'health', 'socioeconomic', 'guardian', 'documents'];

const FullRegistration: React.FC<FullRegistrationProps> = ({ context, onBack }) => {
  const [step, setStep] = useState<Step>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [epsList, setEpsList] = useState<EPS[]>([]);
  const [ipsList, setIpsList] = useState<IPS[]>([]);
  const [ciudadesList, setCiudadesList] = useState<Ciudad[]>([]);
  const [comunasList, setComunasList] = useState<Comuna[]>([]);
  const [institucionesList, setInstitucionesList] = useState<InstitucionEducativa[]>([]);
  const [paisesList, setPaisesList] = useState<Pais[]>([]);

  useEffect(() => {
    Promise.all([
      getEPS(),
      getCiudades(),
      getPaises(),
      getInstitucionesEducativas(),
      getIPS(),
    ]).then(([eps, ciudades, paises, instituciones, ips]) => {
      setEpsList(eps);
      setCiudadesList(ciudades);
      setPaisesList(paises);
      setInstitucionesList(instituciones);
      setIpsList(ips);
    }).catch(console.error);
  }, []);
  const [formData, setFormData] = useState({
    program: context,
    discipline: context === 'TRIBU' ? 'Ultimate' : '',
    programType: context === 'SOROCA' ? 'Soñar' : '',
    docType: 'TI', docId: '',
    firstName: '', lastName: '', apodo: '',
    sex: '', genderIdentity: '',
    birthDate: '', birthPlaceCityId: null as number | null, birthPlaceOther: '', birthPlaceCityName: '',
    nationality: 'Colombiana', paisId: null as number | null, nationalityOther: '',
    phone: '', email: '', linkage: '',
    address: '', neighborhood: '', cityId: null as number | null, communeId: null as number | null,
    stratum: '',
    occupation: '', educationLevel: '', grade: '', schoolId: null as number | null, schoolName: '', schoolOther: '',
    favSubject: '', hardSubject: '', responsibilities: '', hobbies: '',
    workPlace: '', workDescription: '',
    // Step 3 - Salud y Bienestar
    epsId: null as number | null, epsOther: '',
    ipsId: null as number | null, ipsOther: '', bloodType: '',
    hasDisability: 'No', disabilityDetails: '',
    hasAllergy: 'No', allergyDetails: '',
    hasMedication: 'No', medicationDetails: '',
    // Step 4 - Entorno Familiar y Socioeconómico
    familyComposition: '', familyCount: '', familyIncome: '',
    isConflictVictim: 'No', isRUV: 'No',
    ethnicity: '', ethnicityOther: '',
    // Step 5 - Acudiente y Deporte
    guardianDocType: 'CC', guardianDocId: '',
    guardianFullName: '', guardianKinship: '', guardianPhone: '', guardianEmail: '',
    guardianWorks: 'No',
    rugbyBackground: 'No',
    shirtSize: '', pantalonSize: '', shoeSize: '',
    trainingDays: [] as string[],
    docIdentity: null as File | null,
    docEps: null as File | null,
    docConsent: null as File | null,
    terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const files = (e.target as HTMLInputElement).files;
    if (type === 'file' && files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const toggleTrainingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day],
    }));
  };

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const prev = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.terms) return;

    // Validar documentos obligatorios
    if (!formData.docIdentity || !formData.docEps || !formData.docConsent) {
      setSubmitError('Debes cargar los tres documentos obligatorios antes de finalizar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Guardar datos del valiente
      const { valiente, esNuevo } = await registrarValienteCompleto(formData);

      // 2. Subir documentos al Storage
      await Promise.all([
        subirDocumentoValiente(valiente.id, 'identidad',      formData.docIdentity),
        subirDocumentoValiente(valiente.id, 'eps',            formData.docEps),
        subirDocumentoValiente(valiente.id, 'consentimiento', formData.docConsent),
      ]);

      const nombre = `${valiente.nombres} ${valiente.apellidos}`;
      setSuccessMsg(
        esNuevo
          ? `¡Hoja de vida de ${nombre} creada exitosamente!`
          : `¡Hoja de vida de ${nombre} actualizada exitosamente!`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error al guardar hoja de vida:', error);
      setSubmitError(
        error?.message ?? 'Ocurrió un error al guardar. Intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const isFirst = stepIndex === 0;
  const isTribu = formData.program === 'TRIBU';
  const isSoroca = formData.program === 'SOROCA';

  // ── INTRO ──────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="wizard-root">
        <button className="form-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Cancelar
        </button>
        <div className="wizard-card wizard-card--center">
          <div className="wizard-intro-icon"><FileText size={28} /></div>
          <h2 className="wizard-intro-title">Antes de empezar...</h2>
          <p className="wizard-intro-desc">
            Para completar la Hoja de Vida exitosamente, necesitas tener a mano los siguientes documentos digitales:
          </p>
          <div className="wizard-docs-grid">
            <div className="wizard-doc-item">
              <strong>1. Doc. Identidad</strong>
              <span>Ambas caras, legible.</span>
            </div>
            <div className="wizard-doc-item">
              <strong>2. Cert. EPS</strong>
              <span>Vigencia &lt; 30 días.</span>
            </div>
            <div className="wizard-doc-item">
              <strong>3. Consentimiento</strong>
              <span>Firmado por acudiente.</span>
            </div>
          </div>
          <button className="wizard-btn-next wizard-btn-next--full" onClick={next}>
            ¡Tengo todo listo! <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── DOCUMENTS (last step) ───────────────────────────────
  if (step === 'documents') {
    return (
      <div className="wizard-root">
        <button className="form-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Cancelar
        </button>
        <div className="wizard-card">
          <h3 className="full-section-title full-section-title--indigo">
            <Upload size={18} /> Carga de Documentos
          </h3>
          <hr className="wizard-divider" />

          {successMsg && (
            <div className="form-success-banner">
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {submitError && (
            <div className="form-error-banner">
              <AlertCircle size={18} /> {submitError}
            </div>
          )}

          <div className="wizard-upload-list">
            {[
              { name: 'docIdentity', label: '1. Documento de Identidad (PDF/Foto)', icon: <FileText size={28} /> },
              { name: 'docEps',      label: '2. Certificado EPS',                   icon: <Activity size={28} /> },
              { name: 'docConsent',  label: '3. Consentimiento Informado',           icon: <CheckCircle2 size={28} /> },
            ].map(doc => {
              const file = (formData as any)[doc.name] as File | null;
              return (
                <label key={doc.name} className={`wizard-upload-zone${file ? ' wizard-upload-zone--done' : ''}`}>
                  <input type="file" name={doc.name} onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" hidden />
                  <div className="wizard-upload-icon">{file ? <CheckCircle2 size={28} /> : doc.icon}</div>
                  <strong>{doc.label}</strong>
                  <span>{file ? file.name : 'Clic para cargar (obligatorio)'}</span>
                </label>
              );
            })}
          </div>

          <label className="form-terms" style={{ marginTop: '1.5rem' }}>
            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} required />
            <span>Declaro que la información es verídica y autorizo el tratamiento de datos.</span>
          </label>

          <div className="wizard-nav">
            <button type="button" className="wizard-btn-back" onClick={prev} disabled={isSubmitting}>
              <ArrowLeft size={16} /> Atrás
            </button>
            <button
              type="button"
              disabled={!formData.terms || !formData.docIdentity || !formData.docEps || !formData.docConsent || isSubmitting}
              className="wizard-btn-submit"
              onClick={handleSubmit as any}
            >
              {isSubmitting
                ? 'Guardando...'
                : <><Save size={18} /> Finalizar Hoja de Vida</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM STEPS ─────────────────────────────────────────
  const sectionTitles: Record<Step, { icon: React.ReactNode; label: string; color: string }> = {
    intro:         { icon: null,                         label: '',                                    color: ''                           },
    basic:         { icon: <User size={18} />,           label: 'Información Básica',                  color: 'full-section-title--indigo' },
    residence:     { icon: <Home size={18} />,           label: 'Ubicación y Contexto',                color: 'full-section-title--blue'   },
    health:        { icon: <AlertCircle size={18} />,    label: 'Salud y Bienestar',                   color: 'full-section-title--red'    },
    socioeconomic: { icon: <CreditCard size={18} />,     label: 'Entorno Familiar y Socioeconómico',   color: 'full-section-title--amber'  },
    guardian:      { icon: <HeartHandshake size={18} />, label: isTribu ? 'Acudiente y Deporte' : 'Acudiente', color: 'full-section-title--slate'  },
    documents:     { icon: null,                         label: '',                                    color: ''                           },
  };

  const { icon, label, color } = sectionTitles[step];

  return (
    <div className="wizard-root">
      <button className="form-back-btn" onClick={isFirst ? onBack : prev}>
        <ArrowLeft size={16} /> {isFirst ? 'Cancelar' : 'Atrás'}
      </button>

      <div className="wizard-card">
        <h3 className={`full-section-title ${color}`}>{icon} {label}</h3>
        <hr className="wizard-divider" />

        <div className="full-form">
          {step === 'basic' && (
            <>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">PROGRAMA SER PARA SER</label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={e => {
                      const nextProgram = e.target.value as 'TRIBU' | 'SOROCA';
                      setFormData(prev => ({
                        ...prev,
                        program: nextProgram,
                        discipline: nextProgram === 'TRIBU' ? (prev.discipline || 'Ultimate') : '',
                        programType: nextProgram === 'SOROCA' ? (prev.programType || 'Soñar') : '',
                        rugbyBackground: nextProgram === 'TRIBU' ? prev.rugbyBackground : 'No',
                        shirtSize: nextProgram === 'TRIBU' ? prev.shirtSize : '',
                        pantalonSize: nextProgram === 'TRIBU' ? prev.pantalonSize : '',
                        shoeSize: nextProgram === 'TRIBU' ? prev.shoeSize : '',
                        trainingDays: nextProgram === 'TRIBU' ? prev.trainingDays : [],
                      }));
                    }}
                    className="form-select"
                  >
                    <option value="TRIBU">TRIBU</option>
                    <option value="SOROCA">SOROCA</option>
                  </select>
                </div>
                {isTribu && (
                  <div>
                    <label className="form-label">DISCIPLINA</label>
                    <select name="discipline" value={formData.discipline} onChange={handleChange} className="form-select">
                      <option value="Ultimate">Ultimate</option>
                      <option value="Rugby">Rugby</option>
                    </select>
                  </div>
                )}
                {isSoroca && (
                  <div>
                    <label className="form-label">TIPO DE PROGRAMA</label>
                    <select
                      name="programType"
                      value={formData.programType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Soñar">Soñar</option>
                      <option value="Cambiar">Cambiar</option>
                      <option value="Romper">Romper</option>
                      <option value="Mundo Cotidiano">Mundo Cotidiano</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">NOMBRES</label><input name="firstName" value={formData.firstName} onChange={handleChange} required className="form-input" /></div>
                <div><label className="form-label">APELLIDOS</label><input name="lastName" value={formData.lastName} onChange={handleChange} required className="form-input" /></div>
              </div>
              <div>
                <label className="form-label">APODO (OPCIONAL)</label>
                <input name="apodo" value={formData.apodo} onChange={handleChange} className="form-input" placeholder="¿Cómo le dicen?" />
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">SEXO BIOLÓGICO</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} required className="form-select">
                    <option value="">Seleccionar...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">GÉNERO (OPCIONAL)</label>
                  <select name="genderIdentity" value={formData.genderIdentity} onChange={handleChange} className="form-select">
                    <option value="">Seleccionar...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option>
                    <option value="No Binario">No Binario</option><option value="Fluido">Género Fluido</option>
                    <option value="Otro">Otro</option><option value="Prefiero no decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">FECHA NACIMIENTO</label><input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="form-input" /></div>
                <div>
                  <label className="form-label">LUGAR DE NACIMIENTO</label>
                  <select
                    value={formData.birthPlaceCityId === -1 ? 'otro' : (formData.birthPlaceCityId ?? '')}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      birthPlaceCityId: e.target.value === 'otro' ? -1 : (e.target.value ? Number(e.target.value) : null),
                      birthPlaceCityName: e.target.value === 'otro' || !e.target.value ? '' : (ciudadesList.find(c => c.id === Number(e.target.value))?.nombre ?? ''),
                      birthPlaceOther: e.target.value !== 'otro' ? '' : prev.birthPlaceOther,
                    }))}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {ciudadesList.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                    <option value="otro">Otro</option>
                  </select>
                  {formData.birthPlaceCityId === -1 && (
                    <input
                      name="birthPlaceOther"
                      value={formData.birthPlaceOther}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Escribe la ciudad..."
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">NACIONALIDAD</label>
                  <select
                    value={formData.paisId === -1 ? 'otro' : (formData.paisId ?? '')}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      paisId: e.target.value === 'otro' ? -1 : (e.target.value ? Number(e.target.value) : null),
                      nationality: e.target.value === 'otro' || !e.target.value ? '' : (paisesList.find(p => p.id === Number(e.target.value))?.nombre ?? ''),
                      nationalityOther: e.target.value !== 'otro' ? '' : prev.nationalityOther,
                    }))}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {paisesList.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                    <option value="otro">Otra / No aparece en la lista</option>
                  </select>
                  {formData.paisId === -1 && (
                    <input
                      name="nationalityOther"
                      value={formData.nationalityOther}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Escribe la nacionalidad..."
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
                <div>
                  <label className="form-label">TIPO DOCUMENTO</label>
                  <select name="docType" value={formData.docType} onChange={handleChange} className="form-select">
                    <option value="TI">TI</option>
                    <option value="CC">CC</option>
                    <option value="CCE">CCE</option>
                    <option value="PPT">PPT</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">NÚMERO (SIN PUNTOS)</label>
                <input type="tel" name="docId" value={formData.docId} onChange={handleChange} required className="form-input" placeholder="1000..." />
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">CELULAR</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="form-input" placeholder="300..." /></div>
                <div><label className="form-label">CORREO ELECTRÓNICO</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="correo@..." /></div>
              </div>
              <div>
                <label className="form-label">TIPO DE VÍNCULO</label>
                <input name="linkage" value={formData.linkage} onChange={handleChange} className="form-input" placeholder="Ej. Vecino, Referido, Estudiante..." />
              </div>
            </>
          )}

          {step === 'residence' && (
            <>
              {/* Sección 1: Ubicación */}
              <p className="wizard-section-subtitle">Ubicación</p>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">CIUDAD</label>
                  <select
                    value={formData.cityId ?? ''}
                    onChange={e => {
                      const id = e.target.value ? Number(e.target.value) : null;
                      setFormData(prev => ({ ...prev, cityId: id, communeId: null }));
                      if (id) getComunas(id).then(setComunasList).catch(console.error);
                      else setComunasList([]);
                    }}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {ciudadesList.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div><label className="form-label">BARRIO / CORREGIMIENTO</label><input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="form-input" /></div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">COMUNA</label>
                  <select
                    value={formData.communeId ?? ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      communeId: e.target.value ? Number(e.target.value) : null,
                    }))}
                    className="form-select"
                    disabled={!formData.cityId}
                  >
                    <option value="">{formData.cityId ? 'Seleccionar...' : 'Primero selecciona ciudad'}</option>
                    {comunasList.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">ESTRATO</label>
                  <select name="stratum" value={formData.stratum} onChange={handleChange} className="form-select">
                    <option value="">-</option>{['1','2','3','4','5','6'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">DIRECCIÓN DE RESIDENCIA</label><input name="address" value={formData.address} onChange={handleChange} className="form-input" placeholder="Calle / Carrera..." /></div>

              {/* Sección 2: Escolaridad y Ocupación */}
              <p className="wizard-section-subtitle" style={{ marginTop: '1.25rem' }}>Escolaridad y Ocupación</p>
              <div className="form-group">
                <label className="form-label">OCUPACIÓN</label>
                <select name="occupation" value={formData.occupation} onChange={handleChange} className="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="Estudia">Estudia</option>
                  <option value="Trabaja">Trabaja</option>
                  <option value="Estudia y trabaja">Estudia y trabaja</option>
                  <option value="Ninguna">Ninguna</option>
                </select>
              </div>
              {(formData.occupation === 'Trabajo' || formData.occupation === 'Estudio y trabajo') && (
                <div className="form-grid-2">
                  <div><label className="form-label">LUGAR DE TRABAJO</label><input name="workPlace" value={formData.workPlace} onChange={handleChange} className="form-input" placeholder="Empresa / lugar..." /></div>
                  <div><label className="form-label">DESCRIPCIÓN DEL TRABAJO</label><input name="workDescription" value={formData.workDescription} onChange={handleChange} className="form-input" placeholder="¿Qué hace?" /></div>
                </div>
              )}
              <div className="form-grid-2">
                <div>
                  <label className="form-label">ESCOLARIDAD</label>
                  <select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="form-select">
                    <option value="">Seleccionar...</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Tecnólogo">Tecnólogo</option>
                    <option value="Profesional universitario">Profesional universitario</option>
                    <option value="Posgrado">Posgrado</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div><label className="form-label">NIVEL</label><input name="grade" value={formData.grade} onChange={handleChange} className="form-input" placeholder="Ej: segundo grado, tercer semestre" /></div>
              </div>
              <div className="form-group">
                <label className="form-label">INSTITUCIÓN</label>
                <select
                  value={formData.schoolId === -1 ? 'otro' : (formData.schoolId ?? '')}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    schoolId: e.target.value === 'otro' ? -1 : (e.target.value ? Number(e.target.value) : null),
                    schoolName: e.target.value === 'otro' || !e.target.value ? '' : (institucionesList.find(i => i.id === Number(e.target.value))?.nombre ?? ''),
                    schoolOther: e.target.value !== 'otro' ? '' : prev.schoolOther,
                  }))}
                  className="form-select"
                >
                  <option value="">Seleccionar...</option>
                  {institucionesList.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                  <option value="otro">Otra / No aparece en la lista</option>
                </select>
                {formData.schoolId === -1 && (
                  <input
                    name="schoolOther"
                    value={formData.schoolOther}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Escribe el nombre de la institución..."
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">MATERIA FAVORITA</label><input name="favSubject" value={formData.favSubject} onChange={handleChange} className="form-input" /></div>
                <div><label className="form-label">MATERIA DIFÍCIL</label><input name="hardSubject" value={formData.hardSubject} onChange={handleChange} className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">RESPONSABILIDADES</label><input name="responsibilities" value={formData.responsibilities} onChange={handleChange} className="form-input" placeholder="Ej. Cuida hermanos, trabaja los fines de semana..." /></div>
              <div className="form-group"><label className="form-label">HOBBIES</label><input name="hobbies" value={formData.hobbies} onChange={handleChange} className="form-input" placeholder="Ej. Música, dibujo, videojuegos..." /></div>
            </>
          )}

          {step === 'health' && (
            <>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">EPS / ASEGURADORA</label>
                  <select
                    value={formData.epsId === -1 ? 'otro' : (formData.epsId ?? '')}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      epsId: e.target.value === 'otro' ? -1 : (e.target.value ? Number(e.target.value) : null),
                      epsOther: e.target.value !== 'otro' ? '' : prev.epsOther,
                    }))}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {epsList.map(eps => (
                      <option key={eps.id} value={eps.id}>{eps.nombre}</option>
                    ))}
                    <option value="otro">Otra / No aparece en la lista</option>
                  </select>
                  {formData.epsId === -1 && (
                    <input
                      name="epsOther"
                      value={formData.epsOther}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Escribe el nombre de la EPS..."
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
                <div>
                  <label className="form-label">IPS (EMERGENCIAS)</label>
                  <select
                    value={formData.ipsId === -1 ? 'otro' : (formData.ipsId ?? '')}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      ipsId: e.target.value === 'otro' ? -1 : (e.target.value ? Number(e.target.value) : null),
                      ipsOther: e.target.value !== 'otro' ? '' : prev.ipsOther,
                    }))}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {ipsList.map(ips => (
                      <option key={ips.id} value={ips.id}>{ips.nombre}</option>
                    ))}
                    <option value="otro">Otra / No aparece en la lista</option>
                  </select>
                  {formData.ipsId === -1 && (
                    <input
                      name="ipsOther"
                      value={formData.ipsOther}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Escribe el nombre de la IPS..."
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">TIPO DE SANGRE</label>
                <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="form-select">
                  <option value="">No sabe</option>
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">¿TIENE ALGUNA DISCAPACIDAD?</label>
                <select name="hasDisability" value={formData.hasDisability} onChange={handleChange} className="form-select">
                  <option value="No">No</option><option value="Si">Sí</option>
                </select>
                {formData.hasDisability === 'Si' && (
                  <input name="disabilityDetails" value={formData.disabilityDetails} onChange={handleChange} className="form-input" placeholder="¿Cuál?" style={{ marginTop: '0.5rem' }} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">¿TIENE ALGUNA ALERGIA?</label>
                <select name="hasAllergy" value={formData.hasAllergy} onChange={handleChange} className="form-select">
                  <option value="No">No</option><option value="Si">Sí</option>
                </select>
                {formData.hasAllergy === 'Si' && (
                  <input name="allergyDetails" value={formData.allergyDetails} onChange={handleChange} className="form-input" placeholder="¿Cuál?" style={{ marginTop: '0.5rem' }} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">¿TOMA ALGÚN MEDICAMENTO O TIENE TRATAMIENTO MÉDICO?</label>
                <select name="hasMedication" value={formData.hasMedication} onChange={handleChange} className="form-select">
                  <option value="No">No</option><option value="Si">Sí</option>
                </select>
                {formData.hasMedication === 'Si' && (
                  <input name="medicationDetails" value={formData.medicationDetails} onChange={handleChange} className="form-input" placeholder="¿Cuál?" style={{ marginTop: '0.5rem' }} />
                )}
              </div>
            </>
          )}

          {step === 'socioeconomic' && (
            <>
              <div className="form-group">
                <label className="form-label">COMPOSICIÓN FAMILIAR</label>
                <input name="familyComposition" value={formData.familyComposition} onChange={handleChange} className="form-input" placeholder="Ej. Mamá, papá, 2 hermanos menores" />
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">CANTIDAD DE PERSONAS EN CASA</label><input type="number" name="familyCount" value={formData.familyCount} onChange={handleChange} className="form-input" placeholder="Ej. 5" min="1" /></div>
                <div>
                  <label className="form-label">INGRESOS TOTALES POR FAMILIA</label>
                  <select name="familyIncome" value={formData.familyIncome} onChange={handleChange} className="form-select">
                    <option value="">Seleccionar...</option>
                    <option value="Menos de 1 SMMLV">Menos de 1 SMMLV</option>
                    <option value="1 SMMLV">1 SMMLV</option>
                    <option value="2 SMMLV">2 SMMLV</option>
                    <option value="Más de 2 SMMLV">Más de 2 SMMLV</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">¿ES VÍCTIMA DEL CONFLICTO ARMADO?</label>
                  <select name="isConflictVictim" value={formData.isConflictVictim} onChange={handleChange} className="form-select">
                    <option value="No">No</option><option value="Si">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">¿ES PARTE DEL RUV?</label>
                  <select name="isRUV" value={formData.isRUV} onChange={handleChange} className="form-select">
                    <option value="No">No</option><option value="Si">Sí</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ETNIA</label>
                <select name="ethnicity" value={formData.ethnicity} onChange={handleChange} className="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="Mestizo">Mestizo</option>
                  <option value="Afrocolombiano">Afrocolombiano</option>
                  <option value="Indígena">Indígena</option>
                  <option value="Raizal">Raizal</option>
                  <option value="Otro">Otra</option>
                </select>
                {formData.ethnicity === 'Otro' && (
                  <input name="ethnicityOther" value={formData.ethnicityOther} onChange={handleChange} className="form-input" placeholder="¿Cuál?" style={{ marginTop: '0.5rem' }} />
                )}
              </div>
            </>
          )}

          {step === 'guardian' && (
            <>
              <p className="wizard-section-subtitle">Acudiente</p>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">TIPO DE DOCUMENTO</label>
                  <select name="guardianDocType" value={formData.guardianDocType} onChange={handleChange} className="form-select">
                    <option value="TI">TI</option>
                    <option value="CC">CC</option>
                    <option value="CCE">CCE</option>
                    <option value="PPT">PPT</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
                <div><label className="form-label">NÚMERO DE DOCUMENTO</label><input name="guardianDocId" value={formData.guardianDocId} onChange={handleChange} className="form-input" placeholder="Sin puntos..." /></div>
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">NOMBRE COMPLETO</label><input name="guardianFullName" value={formData.guardianFullName} onChange={handleChange} required className="form-input" /></div>
                <div><label className="form-label">PARENTESCO</label><input name="guardianKinship" value={formData.guardianKinship} onChange={handleChange} required className="form-input" placeholder="Mamá, Papá, Tío..." /></div>
              </div>
              <div className="form-grid-2">
                <div><label className="form-label">CELULAR</label><input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required className="form-input" placeholder="300..." /></div>
                <div><label className="form-label">CORREO ELECTRÓNICO</label><input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange} className="form-input" placeholder="correo@..." /></div>
              </div>
              <div className="form-group">
                <label className="form-label">¿TRABAJA?</label>
                <select name="guardianWorks" value={formData.guardianWorks} onChange={handleChange} className="form-select">
                  <option value="No">No</option><option value="Si">Sí</option>
                </select>
              </div>

              {isTribu && (
                <>
                  <p className="wizard-section-subtitle" style={{ marginTop: '1.25rem' }}>Perfil Deportivo</p>
                  <div className="form-group">
                    <label className="form-label">¿HA JUGADO ANTES?</label>
                    <select name="rugbyBackground" value={formData.rugbyBackground} onChange={handleChange} className="form-select">
                      <option value="No">No (Principiante)</option>
                      <option value="Si">Sí (Experiencia previa)</option>
                    </select>
                  </div>
                  <div className="form-grid-2">
                    <div>
                      <label className="form-label">TALLA DE CAMISETA</label>
                      <select name="shirtSize" value={formData.shirtSize} onChange={handleChange} className="form-select">
                        <option value="">Seleccionar...</option>
                        {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">TALLA DE PANTALÓN</label>
                      <select name="pantalonSize" value={formData.pantalonSize} onChange={handleChange} className="form-select">
                        <option value="">Seleccionar...</option>
                        {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">TALLA DE GUAYOS</label>
                    <select name="shoeSize" value={formData.shoeSize} onChange={handleChange} className="form-select">
                      <option value="">Seleccionar...</option>
                      {['34','35','36','37','38','39','40','41','42','43','44','45'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">COMPROMISO DE ENTRENOS</label>
                    <div className="wizard-chips">
                      {[
                        'Lunes 4-6pm', 'Martes 4-6pm', 'Miércoles 4-6pm',
                        'Viernes 4-6pm', 'Sábados 8-10am',
                      ].map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`wizard-chip${formData.trainingDays.includes(day) ? ' wizard-chip--active' : ''}`}
                          onClick={() => toggleTrainingDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="wizard-nav">
          <button type="button" className="wizard-btn-back" onClick={prev}>
            <ArrowLeft size={16} /> Atrás
          </button>
          <button type="button" className="wizard-btn-next" onClick={next}>
            Siguiente <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullRegistration;
