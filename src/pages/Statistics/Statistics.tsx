import React, { useState } from 'react';
import {
  Globe, Users, AlertTriangle, Briefcase,
  BarChart2, Heart, Brain, TrendingUp, Map, Activity
} from 'lucide-react';
import './Statistics.css';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';

interface EstadisticasProps {
  context: AppContext;
}

type Tab = 'demografia' | 'contexto' | 'capital' | 'logistica' | 'nahual';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'demografia',  label: 'Demografía',        icon: <Users size={14} />     },
  { key: 'contexto',   label: 'Contexto Vital',     icon: <Globe size={14} />     },
  { key: 'capital',    label: 'Capital Humano',      icon: <TrendingUp size={14} /> },
  { key: 'logistica',  label: 'Logística y Salud',  icon: <Activity size={14} />  },
  { key: 'nahual',     label: 'Nahual (Psico)',      icon: <Brain size={14} />     },
];

// Chart placeholder titles per tab
const TAB_CHARTS: Record<Tab, { title: string; icon: React.ReactNode; wide?: boolean }[]> = {
  demografia: [
    { title: 'Identidad de Género',         icon: <Users size={14} /> },
    { title: 'Autorreconocimiento Étnico',  icon: <BarChart2 size={14} /> },
    { title: 'Rangos de Edad',              icon: <BarChart2 size={14} /> },
    { title: 'Concentración Geográfica (Top 8 Comunas)', icon: <Map size={14} />, wide: true },
  ],
  contexto: [
    { title: 'Ocupación',                   icon: <Briefcase size={14} /> },
    { title: 'Nivel de Escolaridad',        icon: <BarChart2 size={14} /> },
    { title: 'Estrato Socioeconómico',      icon: <BarChart2 size={14} /> },
    { title: 'Composición Familiar',        icon: <Users size={14} />, wide: true },
  ],
  capital: [
    { title: 'Disciplinas Deportivas',      icon: <Activity size={14} /> },
    { title: 'Experiencia Previa',          icon: <BarChart2 size={14} /> },
    { title: 'Motivación de Ingreso',       icon: <TrendingUp size={14} /> },
  ],
  logistica: [
    { title: 'Tipo de Sangre',              icon: <Heart size={14} /> },
    { title: 'Condiciones de Salud',        icon: <Activity size={14} /> },
    { title: 'Talla de Camiseta',           icon: <BarChart2 size={14} /> },
    { title: 'Asistencia a Entrenos',       icon: <BarChart2 size={14} />, wide: true },
  ],
  nahual: [
    { title: 'Estado Emocional General',    icon: <Brain size={14} /> },
    { title: 'Factores de Riesgo',          icon: <AlertTriangle size={14} /> },
    { title: 'Seguimiento Psicosocial',     icon: <Activity size={14} />, wide: true },
  ],
};

const Estadisticas: React.FC<EstadisticasProps> = ({  }) => {
  const [activeTab, setActiveTab] = useState<Tab>('demografia');

  const charts = TAB_CHARTS[activeTab];

  return (
    <div className="stats-root">

      {/* ── HEADER ── */}
        <div className="stats-header-left">
          <div className="stats-header-icon">
            <Globe size={22} />
          </div>
          <div>
            <h1 className="stats-title">Centro de Inteligencia</h1>
            <p className="stats-subtitle">Análisis multidimensional de datos poblacionales.</p>
          </div>
        </div>

      {/* ── KPI CARDS ── */}
      <div className="stats-kpi-grid">
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--blue">
            <Users size={20} />
          </div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">POBLACIÓN ACTIVA</span>
            <span className="stats-kpi-value">20</span>
          </div>
          <div className="stats-kpi-bg-icon"><Users size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--amber">
            <AlertTriangle size={20} />
          </div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">VULNERABILIDAD</span>
            <span className="stats-kpi-value">0 <small>Víctimas / RUV</small></span>
          </div>
          <div className="stats-kpi-bg-icon"><AlertTriangle size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--green">
            <Briefcase size={20} />
          </div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">RED EMPLEABILIDAD</span>
            <span className="stats-kpi-value">0 <small>Hogares Buscando</small></span>
          </div>
          <div className="stats-kpi-bg-icon"><Briefcase size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--red">
            <AlertTriangle size={20} />
          </div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">ALERTAS CRÍTICAS</span>
            <span className="stats-kpi-value">1</span>
          </div>
          <div className="stats-kpi-bg-icon"><AlertTriangle size={64} /></div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="stats-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`stats-tab${activeTab === tab.key ? ' stats-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── CHART PLACEHOLDERS ── */}
      <div className="stats-charts-grid">
        {charts.map((chart, i) => (
          <div key={i} className={`stats-chart-card${chart.wide ? ' stats-chart-card--wide' : ''}`}>
            <div className="stats-chart-header">
              <span className="stats-chart-title">{chart.icon} {chart.title.toUpperCase()}</span>
            </div>
            <div className="stats-chart-placeholder">
              <BarChart2 size={32} className="stats-chart-placeholder-icon" />
              <span>Gráfica próximamente</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Estadisticas;
