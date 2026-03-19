import React from 'react';
import { Shield, Users, HeartHandshake, Activity } from 'lucide-react';
import { TribuIcon, SorocaIcon } from '../../components/customIcons/customIcons';
import './WelcomeView.css';

type AppContext = 'TRIBU' | 'SOROCA';

interface WelcomeViewProps {
  onSelectProgram: (program: AppContext) => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectProgram }) => {
  return (
    <div className="welcome-root">

      {/* Header */}
      <div className="welcome-header">
        <div className="welcome-logo">
          <Shield size={40} />
        </div>
        <h1 className="welcome-title">TRIVIUM</h1>
        <p className="welcome-subtitle">
          Sistema de Gestión Integral <strong>Ser para Ser</strong>.
        </p>
      </div>

      {/* Program Selector */}
      <div className="welcome-programs">
        <h2 className="welcome-programs-label">Selecciona tu Entorno Operativo</h2>
        <div className="welcome-programs-grid">

          {/* TRIBU */}
          <button className="program-card program-card--tribu" onClick={() => onSelectProgram('TRIBU')}>
            <div className="program-card-bg">
              <TribuIcon size={200} />
            </div>
            <div className="program-card-body">
              <div className="program-card-header">
                <div className="program-card-icon">
                  <TribuIcon size={32} />
                </div>
                <div>
                  <h3 className="program-card-name">TRIBU</h3>
                  <span className="program-card-badge">Deportivo</span>
                </div>
              </div>
              <p className="program-card-desc">
                Gestión de disciplinas (Rugby/Ultimate), asistencia a entrenos y competencias.
              </p>
            </div>
          </button>

          {/* SOROCA */}
          <button className="program-card program-card--soroca" onClick={() => onSelectProgram('SOROCA')}>
            <div className="program-card-bg">
              <SorocaIcon size={200} />
            </div>
            <div className="program-card-body">
              <div className="program-card-header">
                <div className="program-card-icon">
                  <SorocaIcon size={32} />
                </div>
                <div>
                  <h3 className="program-card-name">SOROCA</h3>
                  <span className="program-card-badge">Formación</span>
                </div>
              </div>
              <p className="program-card-desc">
                Formación integral, macros (Soñar, Romper...), jornadas y acompañamiento.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="welcome-features">
        <div className="feature-item">
          <div className="feature-item-header">
            <div className="feature-icon--indigo"><Users size={24} /></div>
            <h3>Hoja de Vida Única</h3>
          </div>
          <p>Expediente centralizado con perfilamiento 360°.</p>
        </div>
        <div className="feature-item">
          <div className="feature-item-header">
            <div className="feature-icon--emerald"><Activity size={24} /></div>
            <h3>Operaciones</h3>
          </div>
          <p>Control de asistencia y cronograma macro.</p>
        </div>
        <div className="feature-item">
          <div className="feature-item-header">
            <div className="feature-icon--pink"><HeartHandshake size={24} /></div>
            <h3>Acompañamiento</h3>
          </div>
          <p>Módulo Nahual especializado.</p>
        </div>
      </div>

    </div>
  );
};

export default WelcomeView;
