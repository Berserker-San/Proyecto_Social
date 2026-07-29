import React, { useState } from 'react';
import { ArrowLeft, Save, User, AlertCircle, CreditCard, Dumbbell, Zap } from 'lucide-react';
import { crearValiente } from '../../../lib/services/valientes.service';
import { crearAcudiente, vincularAcudiente } from '../../../lib/services/acudientes.service';
import { guardarPerfilDeportivo, guardarSalud, guardarUbicacion, guardarEducacion, guardarContextoFamiliar } from '../../../lib/services/perfiles.service';
import { supabase } from '../../../lib/supabase';
import './ExpressRegistration.css';

interface ExpressRegistrationProps {
  context: 'TRIBU' | 'SOROCA';
  onBack: () => void;
}

const ExpressRegistration: React.FC<ExpressRegistrationProps> = ({ context, onBack }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    discipline: 'ULTIMATE',
    docType: 'TI', docId: '',
    firstName: '', lastName: '', apodo: '',
    sex: '', genderIdentity: '',
    birthDate: '', linkage: '', phone: '',
    guardianName: '', guardianKinship: '', guardianPhone: '',
    hasMedicalCondition: 'No', medicalDetails: '', medications: '',
    rugbyBackground: 'No', shirtSize: '', pantalonSize: '', shoeSize: '',
    motivation: '', terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // 1. Crear valiente
      const valiente = await crearValiente({
        tipo_documento: formData.docType,
        numero_documento: formData.docId,
        nombres: formData.firstName,
        apellidos: formData.lastName,
        apodo: formData.apodo || null,
        sexo: formData.sex,
        identidad_genero: formData.genderIdentity || null,
        fecha_nacimiento: formData.birthDate,
        celular: formData.phone,
        email: null,
        lugar_nacimiento: null,
        lugar_nacimiento_ciudad_id: null,
        nacionalidad: 'Colombiana',
        trabaja_estudia: null,
        hobbies: null,
        estado: 'ACTIVO',
        foto_url: null,
        created_by: null,
        updated_by: null,
      });

      // 2. Crear acudiente
      const acudiente = await crearAcudiente({
        tipo_documento: null,
        numero_documento: null,
        nombre_completo: formData.guardianName,
        celular: formData.guardianPhone,
        email: null,
        tiene_autorizacion_firmada: false,
      });

      // 3. Vincular acudiente con valiente
      await vincularAcudiente(valiente.id, acudiente.id, {
        parentesco: formData.guardianKinship,
        es_principal: true,
        es_contacto_emergencia: true,
        vive_con_valiente: false,
      });

      // 4. Guardar información de salud
      await guardarSalud({
        valiente_id: valiente.id,
        eps_id: null,
        eps_nombre: null,
        regimen_eps: null,
        ips_id: null,
        ips_nombre: null,
        tipo_sangre: null,
        tiene_discapacidad: false,
        tipo_discapacidad: null,
        diagnostico_medico: formData.hasMedicalCondition === 'Si' ? formData.medicalDetails : null,
        tiene_alergias: formData.hasMedicalCondition === 'Si',
        alergias: formData.hasMedicalCondition === 'Si' ? formData.medicalDetails : null,
        medicamentos_actuales: formData.medications || null,
        tratamiento_en_curso: null,
        contacto_emergencia_nombre: formData.guardianName,
        contacto_emergencia_telefono: formData.guardianPhone,
        contacto_emergencia_parentesco: formData.guardianKinship,
      });

      // 5. Guardar perfil deportivo (solo para TRIBU)
      if (context === 'TRIBU') {
        await guardarPerfilDeportivo({
          valiente_id: valiente.id,
          disciplina: formData.discipline,
          tiene_experiencia_previa: formData.rugbyBackground === 'Si',
          experiencia_previa: formData.rugbyBackground === 'Si' ? 'Experiencia previa' : null,
          talla_guayos: formData.shoeSize || null,
          talla_camisa: formData.shirtSize || null,
          talla_pantalon: formData.pantalonSize || null,
          horario_entrenamiento: null,
        });
      }

      // 6. Crear registros vacíos en tablas restantes para que el perfil exista
      await Promise.all([
        guardarUbicacion({
          valiente_id: valiente.id,
          direccion: null,
          ciudad_id: null,
          comuna_id: null,
          barrio_id: null,
          estrato: null,
          latitud: null,
          longitud: null,
        }),
        guardarEducacion({
          valiente_id: valiente.id,
          nivel_educativo: null,
          grado_actual: null,
          institucion_id: null,
          materia_favorita: null,
          materia_dificil: null,
        }),
        guardarContextoFamiliar({
          valiente_id: valiente.id,
          composicion_familiar: null,
          numero_personas_hogar: null,
          ingreso_mensual_hogar: null,
          es_victima_conflicto: null,
          esta_en_ruv: null,
          etnia: null,
        }),
      ]);

      // 7. Inscribir en programa TRIBU
      const { data: programaTribu } = await supabase
        .from('programa')
        .select('id')
        .eq('codigo', 'TRIBU')
        .maybeSingle();

      if (programaTribu) {
        await supabase.from('valiente_programa').insert({
          valiente_id: valiente.id,
          programa_id: programaTribu.id,
          es_principal: true,
          fecha_ingreso: new Date().toISOString().split('T')[0],
          estado: 'ACTIVO',
          motivacion: formData.motivation || null,
          nivel: formData.discipline || null,
        });
      }

      setSuccessMsg(`¡Valiente ${formData.firstName} ${formData.lastName} registrado exitosamente!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Limpiar formulario después de 4 segundos
      setTimeout(() => {
        setFormData({
          discipline: 'ULTIMATE',
          docType: 'TI', docId: '',
          firstName: '', lastName: '', apodo: '',
          sex: '', genderIdentity: '',
          birthDate: '', linkage: '', phone: '',
          guardianName: '', guardianKinship: '', guardianPhone: '',
          hasMedicalCondition: 'No', medicalDetails: '', medications: '',
          rugbyBackground: 'No', shirtSize: '', pantalonSize: '', shoeSize: '',
          motivation: '', terms: false,
        });
        setSuccessMsg(null);
      }, 4000);

    } catch (error: any) {
      console.error('Error al registrar valiente:', error);
      
      // Mostrar detalles del error
      let errorMessage = 'Error al registrar el valiente. ';
      
      if (error.message) {
        errorMessage += error.message;
      }
      
      if (error.details) {
        errorMessage += ` Detalles: ${error.details}`;
      }
      
      if (error.hint) {
        errorMessage += ` Sugerencia: ${error.hint}`;
      }
      
      console.log('Error completo:', JSON.stringify(error, null, 2));
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="express-root">
      <button className="form-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="express-card">
        <div className="express-card-header">
          <div className="express-card-header-icon"><Zap size={24} /></div>
          <div>
            <h2>Registro Rápido</h2>
            <p>Datos mínimos para iniciar proceso.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="form-error">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="form-success" style={{ 
            padding: '1rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Save size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-space">

          {/* Disciplina */}
          <div className="form-group">
            <label className="form-label">Disciplina</label>
            <select name="discipline" value={formData.discipline} onChange={handleChange} className="form-select">
              <option value="ULTIMATE">Ultimate</option>
              <option value="RUGBY">Rugby</option>
            </select>
          </div>

          {/* Bloque 1: Identidad */}
          <div className="form-section">
            <h3 className="form-section-title form-section-title--indigo"><User size={16} /> Bloque 1: Identidad</h3>
            <div className="form-grid-3">
              <div>
                <label className="form-label">Tipo Doc</label>
                <select name="docType" value={formData.docType} onChange={handleChange} className="form-select">
                  <option value="TI">TI</option>
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="PPT">PPT</option>
                  <option value="PAS">PAS</option>
                </select>
              </div>
              <div className="form-col-span-2">
                <label className="form-label">Número Documento</label>
                <div className="form-input-wrapper">
                  <CreditCard size={16} className="form-input-icon" />
                  <input type="tel" name="docId" value={formData.docId} onChange={handleChange} required className="form-input form-input--icon" placeholder="1000..." />
                </div>
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Nombres</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} required className="form-input" placeholder="Ej. Juan" />
              </div>
              <div>
                <label className="form-label">Apellidos</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} required className="form-input" placeholder="Ej. Pérez" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Apodo (Opcional)</label>
              <input name="apodo" value={formData.apodo} onChange={handleChange} className="form-input" placeholder="¿Cómo le dicen?" />
            </div>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Sexo Biológico</label>
                <select name="sex" value={formData.sex} onChange={handleChange} required className="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Intersexual">Intersexual</option>
                </select>
              </div>
              <div>
                <label className="form-label">Género (Opcional)</label>
                <select name="genderIdentity" value={formData.genderIdentity} onChange={handleChange} className="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No Binario">No Binario</option>
                  <option value="Fluido">Género Fluido</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Nacimiento</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Vínculo</label>
              <input name="linkage" value={formData.linkage} onChange={handleChange} className="form-input" placeholder="Ej. Vecino, Estudiante Medicina..." />
            </div>
            <div className="form-group">
              <label className="form-label">Celular</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="form-input" placeholder="300..." />
            </div>
          </div>

          {/* Bloque 2: Seguridad */}
          <div className="form-section form-section--danger">
            <h3 className="form-section-title form-section-title--red"><AlertCircle size={16} /> Bloque 2: Seguridad Inmediata</h3>
            <label className="form-label form-label--red">Contacto de Emergencia</label>
            <div className="form-grid-2">
              <input name="guardianName" value={formData.guardianName} onChange={handleChange} required className="form-input form-input--red" placeholder="Nombre Acudiente" />
              <input name="guardianKinship" value={formData.guardianKinship} onChange={handleChange} required className="form-input form-input--red" placeholder="Parentesco" />
            </div>
            <div className="form-group">
              <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required className="form-input form-input--red" placeholder="Celular acudiente" />
            </div>
            <div className="form-group">
              <label className="form-label">¿Sufre Enfermedad o Alergia?</label>
              <select name="hasMedicalCondition" value={formData.hasMedicalCondition} onChange={handleChange} className="form-select">
                <option value="No">No</option>
                <option value="Si">Sí</option>
              </select>
              {formData.hasMedicalCondition === 'Si' && (
                <input name="medicalDetails" value={formData.medicalDetails} onChange={handleChange} className="form-input" placeholder="¿Cuál?" style={{ marginTop: '0.5rem' }} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">¿Toma Medicamentos?</label>
              <input name="medications" value={formData.medications} onChange={handleChange} className="form-input" placeholder="Nombre y frecuencia (o 'Ninguno')" />
            </div>
          </div>

          {/* Bloque 3: Tallas */}
          <div className="form-section">
            <h3 className="form-section-title form-section-title--emerald"><Dumbbell size={16} /> Bloque 3: Tallas y Afinidad</h3>
            <div className="form-group">
              <label className="form-label">¿Ha jugado antes?</label>
              <select name="rugbyBackground" value={formData.rugbyBackground} onChange={handleChange} className="form-select">
                <option value="No">No (Principiante)</option>
                <option value="Si">Sí (Experiencia previa)</option>
              </select>
            </div>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Talla Camiseta</label>
                <select name="shirtSize" value={formData.shirtSize} onChange={handleChange} className="form-select">
                  <option value="">Seleccionar...</option>
                  {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                  <label className="form-label">Talla Pantalón</label>
                  <select name="pantalonSize" value={formData.pantalonSize} onChange={handleChange} className="form-select">
                    <option value="">Seleccionar...</option>
                    {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
            </div>
            <div className="form-group">
              <label className="form-label">Talla Guayos (EU)</label>
              <select name="shoeSize" value={formData.shoeSize} onChange={handleChange} className="form-select">
                <option value="">Seleccionar...</option>
                {['34','35','36','37','38','39','40','41','42','43','44','45'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">¿Por qué quieres ser parte?</label>
              <textarea name="motivation" value={formData.motivation} onChange={handleChange} required className="form-textarea" rows={2} placeholder="Tu motivación principal..." />
            </div>
          </div>

          <label className="form-terms">
            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} required />
            <span>Autoriza participación deportiva bajo su propio riesgo (Firma pendiente).</span>
          </label>

          <button type="submit" disabled={!formData.terms || loading} className="form-submit form-submit--indigo">
            <Save size={20} /> {loading ? 'Registrando...' : 'Registrar Valiente'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpressRegistration;
