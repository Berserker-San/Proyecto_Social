import React, { useState } from 'react';
import { UserPlus, FileText, Zap, ArrowLeft } from 'lucide-react';
import { TribuIcon, SorocaIcon } from '../../../components/customIcons/customIcons';
import ExpressRegistration from '../ExpressRegistration/ExpressRegistration';
import FullRegistration from '../FullRegistration/FullRegistration';
import './RegistrationView.css';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';
type RegistrationMode = 'SELECT' | 'EXPRESS' | 'FULL';

interface RegistrationViewProps {
  context: AppContext;
  onChangeProgram?: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ context, onChangeProgram }) => {
  const [mode, setMode] = useState<RegistrationMode>('SELECT');
  const [globalSelection, setGlobalSelection] = useState<'TRIBU' | 'SOROCA' | null>(null);

  const effectiveContext = context === 'GLOBAL' ? globalSelection : context;

  if (context === 'GLOBAL' && !globalSelection) {
    return (
      <div className="reg-program-selector">
        <div className="reg-program-selector-icon">
          <UserPlus size={32} />
        </div>
        <h2>¿A qué programa pertenece el nuevo ingreso?</h2>
        <p>Selecciona el contexto para habilitar los formularios correspondientes.</p>
        <div className="reg-program-grid">
          <button className="reg-program-btn reg-program-btn--tribu" onClick={() => setGlobalSelection('TRIBU')}>
            <div className="reg-program-btn-icon"><TribuIcon size={32} /></div>
            <span>TRIBU</span>
          </button>
          <button className="reg-program-btn reg-program-btn--soroca" onClick={() => setGlobalSelection('SOROCA')}>
            <div className="reg-program-btn-icon"><SorocaIcon size={32} /></div>
            <span>SOROCA</span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'SELECT') {
    return (
      <div className="reg-mode-selector">
        {context === 'GLOBAL'
          ? <button className="reg-back-btn" onClick={() => setGlobalSelection(null)}>
              <ArrowLeft size={16} /> Cambiar Programa
            </button>
          : onChangeProgram && (
            <button className="reg-back-btn" onClick={onChangeProgram}>
              <ArrowLeft size={16} /> Cambiar Programa
            </button>
          )
        }

        <h1>Nuevo Ingreso {effectiveContext}</h1>
        <p>
          {effectiveContext === 'SOROCA'
            ? 'Diligencia la Hoja de Vida para formalizar la vinculación.'
            : 'Selecciona el tipo de registro según la situación'}
        </p>

        <div className="reg-mode-grid">
          {effectiveContext !== 'SOROCA' && (
            <button className="reg-mode-card reg-mode-card--express" onClick={() => setMode('EXPRESS')}>
              <div className="reg-mode-card-icon"><Zap size={32} /></div>
              <h3>Registro Exprés</h3>
              <p>Formulario rápido para capturar datos vitales durante el entreno. Menos de 2 minutos.</p>
            </button>
          )}
          <div className={effectiveContext === 'SOROCA' ? 'reg-mode-grid--single' : ''}>
            <button className="reg-mode-card reg-mode-card--full" onClick={() => setMode('FULL')}>
              <div className="reg-mode-card-icon"><FileText size={32} /></div>
              <h3>Hoja de Vida Completa</h3>
              <p>Caracterización profunda: socioeconómico, salud, educación y red de apoyo.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'EXPRESS') return <ExpressRegistration context={effectiveContext as 'TRIBU' | 'SOROCA'} onBack={() => setMode('SELECT')} />;
  if (mode === 'FULL')    return <FullRegistration    context={effectiveContext as 'TRIBU' | 'SOROCA'} onBack={() => setMode('SELECT')} />;

  return null;
};

export default RegistrationView;
