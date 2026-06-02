import React from 'react';
import { Users, HeartHandshake, Activity } from 'lucide-react';
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
            {/* Marca de agua de fondo */}
            <div className="program-card-bg">
              <img src="/images/logo-tribu.png" alt="" className="program-card-bg-img" />
            </div>
            <div className="program-card-body">
              <div className="program-card-header">
                {/* Logo a la izquierda */}
                <div className="program-card-icon program-card-icon--img">
                  <img src="/images/logo-tribu.png" alt="Logo Tribu" className="program-logo-img" />
                </div>
                {/* Letras arriba, badge abajo */}
                <div className="program-card-title-block">
                  <img src="/images/tribu-letras.png" alt="TRIBU" className="program-letras-img" />
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
            {/* Marca de agua de fondo */}
            <div className="program-card-bg">
              <img src="/images/logo-soroca.png" alt="" className="program-card-bg-img" />
            </div>
            <div className="program-card-body">
              <div className="program-card-header">
                <div className="program-card-icon program-card-icon--img">
                  <img src="/images/logo-soroca.png" alt="Logo Soroca" className="program-logo-img" />
                </div>
                <div>
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
