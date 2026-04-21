import React, { useState, useEffect } from 'react';
import {
  Globe, Users, AlertTriangle, Briefcase,
  BarChart2, Heart, Brain, TrendingUp, Map, Activity, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getEstadisticasPorGenero,
  getEstadisticasPorEdad,
  getEstadisticasPorEstrato,
  getEstadisticasPorPrograma,
  getResumenEstadisticas,
  type EstadisticaPrograma,
  type EstadisticaGenero,
  type EstadisticaEstrato,
  type EstadisticaRangoEdad,
} from '../../lib/services/estadisticas.service';
import './Statistics.css';

// ── Tipos ──────────────────────────────────────────────────────────────────

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';
interface EstadisticasProps { context?: AppContext; }
type Tab = 'demografia' | 'contexto' | 'capital' | 'logistica' | 'nahual';

// ── Paleta de colores ──────────────────────────────────────────────────────

const COLORS_PIE   = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const COLOR_BAR    = '#4f46e5';
const COLOR_BAR_2  = '#06b6d4';

// ── Tabs ───────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'demografia', label: 'Demografía',       icon: <Users size={14} />      },
  { key: 'contexto',   label: 'Contexto Vital',   icon: <Globe size={14} />      },
  { key: 'capital',    label: 'Capital Humano',   icon: <TrendingUp size={14} /> },
  { key: 'logistica',  label: 'Logística y Salud',icon: <Activity size={14} />   },
  { key: 'nahual',     label: 'Nahual (Psico)',   icon: <Brain size={14} />      },
];

// ── Label personalizado DENTRO de la torta ────────────────────────────────

const RADIAN = Math.PI / 180;

const renderPieLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, name, porcentaje, percent,
}: any) => {
  // Solo mostrar label si el segmento es suficientemente grande (> 5%)
  if (percent < 0.05) return null;

  // Para segmentos pequeños usar radio más externo
  const labelRadius = percent < 0.15
    ? innerRadius + (outerRadius - innerRadius) * 0.7
    : innerRadius + (outerRadius - innerRadius) * 0.55;

  const lx = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const ly = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text
        x={lx}
        y={ly - 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="stats-pie-label-name"
      >
        {name}
      </text>
      <text
        x={lx}
        y={ly + 10}
        textAnchor="middle"
        dominantBaseline="central"
        className="stats-pie-label-pct"
      >
        {porcentaje ?? `${(percent * 100).toFixed(1)}`}%
      </text>
    </g>
  );
};


const ChartCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  wide?: boolean;
  pie?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, wide, pie, loading, children }) => (
  <div className={`stats-chart-card${wide ? ' stats-chart-card--wide' : ''}${pie ? ' stats-chart-card--pie' : ''}`}>
    <div className="stats-chart-header">
      <span className="stats-chart-title">{icon} {title.toUpperCase()}</span>
    </div>
    <div className="stats-chart-body">
      {loading ? (
        <div className="stats-chart-placeholder">
          <Loader2 size={28} className="stats-chart-loading-icon" />
          <span>Cargando datos…</span>
        </div>
      ) : children}
    </div>
  </div>
);

const PlaceholderChart: React.FC<{ label?: string }> = ({ label = 'Próximamente' }) => (
  <div className="stats-chart-placeholder">
    <BarChart2 size={32} className="stats-chart-placeholder-icon" />
    <span>{label}</span>
  </div>
);

// Tooltip personalizado para barras
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="stats-tooltip">
        <p className="stats-tooltip-label">{label}</p>
        <p className="stats-tooltip-value">{payload[0].value} personas</p>
      </div>
    );
  }
  return null;
};

// Tooltip personalizado para torta
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="stats-tooltip">
        <p className="stats-tooltip-label">{payload[0].name}</p>
        <p className="stats-tooltip-value">{payload[0].value} personas ({payload[0].payload.porcentaje}%)</p>
      </div>
    );
  }
  return null;
};

// ── Componente principal ───────────────────────────────────────────────────

const Estadisticas: React.FC<EstadisticasProps> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('demografia');

  // KPIs
  const [totalActivos, setTotalActivos]     = useState<number | null>(null);
  const [totalProgramas, setTotalProgramas] = useState<number | null>(null);

  // Datos demografía
  const [genero,    setGenero]    = useState<EstadisticaGenero[]>([]);
  const [edad,      setEdad]      = useState<EstadisticaRangoEdad[]>([]);
  const [estrato,   setEstrato]   = useState<EstadisticaEstrato[]>([]);
  const [programas, setProgramas] = useState<EstadisticaPrograma[]>([]);

  // Estados de carga individuales
  const [loadingKpi,      setLoadingKpi]      = useState(true);
  const [loadingGenero,   setLoadingGenero]   = useState(true);
  const [loadingEdad,     setLoadingEdad]     = useState(true);
  const [loadingEstrato,  setLoadingEstrato]  = useState(true);
  const [loadingProgramas,setLoadingProgramas]= useState(true);

  // ── Carga inicial: KPIs + programas (siempre visibles) ──
  useEffect(() => {
    getResumenEstadisticas()
      .then((res) => {
        setTotalActivos(res.totalActivos);
        setTotalProgramas(res.totalProgramas);
      })
      .catch(console.error)
      .finally(() => setLoadingKpi(false));

    getEstadisticasPorPrograma()
      .then(setProgramas)
      .catch(console.error)
      .finally(() => setLoadingProgramas(false));
  }, []);

  // ── Carga al entrar a la tab demografía ──
  useEffect(() => {
    if (activeTab !== 'demografia') return;

    getEstadisticasPorGenero()
      .then(setGenero)
      .catch(console.error)
      .finally(() => setLoadingGenero(false));

    getEstadisticasPorEdad()
      .then(setEdad)
      .catch(console.error)
      .finally(() => setLoadingEdad(false));

    getEstadisticasPorEstrato()
      .then(setEstrato)
      .catch(console.error)
      .finally(() => setLoadingEstrato(false));
  }, [activeTab]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="stats-root">

      {/* HEADER */}
      <div className="stats-header-left">
        <div className="stats-header-icon">
          <Globe size={22} />
        </div>
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

      {/* ── TAB: DEMOGRAFÍA ── */}
      {activeTab === 'demografia' && (
        <div className="stats-charts-grid">

          {/* Género — Torta */}
          <ChartCard title="Identidad de Género" icon={<Users size={14} />} loading={loadingGenero}>
            {genero.length === 0 ? (
              <PlaceholderChart label="Sin datos" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genero}
                    dataKey="total"
                    nameKey="genero"
                    cx="50%"
                    cy="44%"
                    outerRadius={95}
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {genero.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="stats-legend-text">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Rangos de Edad — Histograma */}
          <ChartCard title="Rangos de Edad" icon={<BarChart2 size={14} />} loading={loadingEdad}>
            {edad.every(r => r.total === 0) ? (
              <PlaceholderChart label="Sin datos" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={edad} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="rango" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="total" fill={COLOR_BAR_2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Estrato — Barras */}
          <ChartCard title="Estrato Socioeconómico" icon={<BarChart2 size={14} />} loading={loadingEstrato}>
            {estrato.length === 0 ? (
              <PlaceholderChart label="Sin datos" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={estrato} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="estrato" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="total" fill={COLOR_BAR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Programas — Barras */}
          <ChartCard
            title="Inscritos por Programa"
            icon={<Map size={14} />}
            loading={loadingProgramas}
          >
            {programas.length === 0 ? (
              <PlaceholderChart label="Sin datos" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={programas} margin={{ top: 8, right: 24, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="programa" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="total" fill={COLOR_BAR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>
      )}

      {/* ── OTRAS TABS — placeholders ── */}
      {activeTab !== 'demografia' && (
        <div className="stats-charts-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="stats-chart-card">
              <div className="stats-chart-header">
                <span className="stats-chart-title"><BarChart2 size={14} /> PRÓXIMAMENTE</span>
              </div>
              <PlaceholderChart />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Estadisticas;
