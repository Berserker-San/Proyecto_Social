import React, { useState, useEffect } from 'react';
import { Globe, Users, AlertTriangle, Briefcase, BarChart2, Heart, Brain, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { getResumenEstadisticas } from '../../lib/services/estadisticas.service';
import DemographicsTab from '../../components/tabs/DemographicsTab';
import VitalContextTab from '../../components/tabs/VitalContextTab';
import HealthTab from '../../components/tabs/HealthTab';
import FamilyContextTab from '../../components/tabs/FamilyContextTab';
import SportsCultureTab from '../../components/tabs/SportsCultureTab';
import './Statistics.css';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';
interface StatisticsProps { context?: AppContext; }
type Tab = 'demografia' | 'contexto' | 'capital' | 'logistica' | 'nahual';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'demografia', label: 'Demografía',        icon: <Users size={14} />      },
  { key: 'contexto',   label: 'Contexto Vital',    icon: <Globe size={14} />      },
  { key: 'capital',    label: 'Entorno Familiar',   icon: <TrendingUp size={14} /> },
  { key: 'logistica',  label: 'Logística y Salud', icon: <Activity size={14} />   },
  { key: 'nahual',     label: 'Deporte y Cultura', icon: <Brain size={14} />      },
];

const Statistics: React.FC<StatisticsProps> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('demografia');
  const [totalActivos,   setTotalActivos]   = useState<number | null>(null);
  const [totalProgramas, setTotalProgramas] = useState<number | null>(null);
  const [loadingKpi,     setLoadingKpi]     = useState(true);

  useEffect(() => {
    getResumenEstadisticas()
      .then(res => {
        setTotalActivos(res.totalActivos);
        setTotalProgramas(res.totalProgramas);
      })
      .catch(console.error)
      .finally(() => setLoadingKpi(false));
  }, []);

  return (
    <div className="stats-root">

      {/* HEADER */}
      <div className="stats-header-left">
        <div className="stats-header-icon"><Globe size={22} /></div>
        <div>
          <h1 className="stats-title">Centro de Inteligencia</h1>
          <p className="stats-subtitle">Análisis multidimensional de datos poblacionales.</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="stats-kpi-grid">
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--blue"><Users size={20} /></div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">POBLACIÓN ACTIVA</span>
            <span className="stats-kpi-value">
              {loadingKpi ? <Loader2 size={18} className="stats-kpi-loading" /> : totalActivos ?? '—'}
            </span>
          </div>
          <div className="stats-kpi-bg-icon"><Users size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--amber"><AlertTriangle size={20} /></div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">VULNERABILIDAD</span>
            <span className="stats-kpi-value">0 <small>Víctimas / RUV</small></span>
          </div>
          <div className="stats-kpi-bg-icon"><AlertTriangle size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--green"><Briefcase size={20} /></div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">RED EMPLEABILIDAD</span>
            <span className="stats-kpi-value">0 <small>Hogares Buscando</small></span>
          </div>
          <div className="stats-kpi-bg-icon"><Briefcase size={64} /></div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-icon stats-kpi-icon--purple"><Heart size={20} /></div>
          <div className="stats-kpi-body">
            <span className="stats-kpi-label">PROGRAMAS ACTIVOS</span>
            <span className="stats-kpi-value">
              {loadingKpi ? <Loader2 size={18} className="stats-kpi-loading" /> : totalProgramas ?? '—'}
            </span>
          </div>
          <div className="stats-kpi-bg-icon"><Heart size={64} /></div>
        </div>
      </div>

      {/* TABS */}
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

      {/* TAB CONTENT */}
      {activeTab === 'demografia' && <DemographicsTab />}
      {activeTab === 'contexto'   && <VitalContextTab />}
      {activeTab === 'capital'    && <FamilyContextTab />}
      {activeTab === 'logistica'  && <HealthTab />}
      {activeTab === 'nahual'     && <SportsCultureTab />}

    </div>
  );
};

export default Statistics;
