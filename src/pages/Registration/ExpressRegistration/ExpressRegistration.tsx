import React, { useState } from 'react';
import { ArrowLeft, Save, User, AlertCircle, CreditCard, Dumbbell, Zap } from 'lucide-react';
import './ExpressRegistration.css';

interface ExpressRegistrationProps {
  context: 'TRIBU' | 'SOROCA';
  onBack: () => void;
}

const ExpressRegistration: React.FC<ExpressRegistrationProps> = ({ context, onBack }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    discipline: 'ULTIMATE',
    docType: 'TI', docId: '',
    firstName: '', lastName: '',
    sex: '', genderIdentity: '',
    birthDate: '', linkage: '', phone: '',
    guardianName: '', guardianKinship: '', guardianPhone: '',
    hasMedicalCondition: 'No', medicalDetails: '', medications: '',
    rugbyBackground: 'No', shirtSize: '', shoeSize: '',
    motivation: '', terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Express submit:', formData);
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
            <div className="form-grid-2">
              <div>
                <label className="form-label">Sexo Biológico</label>
                <select name="sex" value={formData.sex} onChange={handleChange} required className="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
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
                <input name="shirtSize" value={formData.shirtSize} onChange={handleChange} className="form-input" placeholder="S, M, L..." />
              </div>
              <div>
                <label className="form-label">Talla Guayos (EU)</label>
                <input name="shoeSize" value={formData.shoeSize} onChange={handleChange} className="form-input" placeholder="38, 40..." />
              </div>
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

          <button type="submit" disabled={!formData.terms} className="form-submit form-submit--indigo">
            <Save size={20} /> Registrar Valiente
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpressRegistration;
