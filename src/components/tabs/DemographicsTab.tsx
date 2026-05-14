import React, { useState, useEffect } from 'react';
import { Users, BarChart2, Map, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getEstadisticasPorGenero,
  getEstadisticasPorEdad,
  getEstadisticasPorEstrato,
  getEstadisticasPorPrograma,
  type EstadisticaPrograma,
  type EstadisticaGenero,
  type EstadisticaEstrato,
  type EstadisticaRangoEdad,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_PIE  = ['#06b6d4', '#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const COLOR_BAR   = '#4f46e5';
const COLOR_BAR_2 = '#06b6d4';

// ── Helpers ───────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, porcentaje, percent }: any) => {
  if (percent < 0.05) return null;
  const r = percent < 0.15
    ? innerRadius + (outerRadius - innerRadius) * 0.7
    : innerRadius + (outerRadius - innerRadius) * 0.55;
  const lx = cx + r * Math.cos(-midAngle * RADIAN);
  const ly = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <g>
      <text x={lx} y={ly - 8} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-name">{name}</text>
      <text x={lx} y={ly + 10} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-pct">
        {porcentaje ?? `${(percent * 100).toFixed(1)}`}%
      </text>
    </g>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-label">{label}</p>
      <p className="stats-tooltip-value">{payload[0].value} personas</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-label">{payload[0].name}</p>
      <p className="stats-tooltip-value">{payload[0].value} personas ({payload[0].payload.porcentaje}%)</p>
    </div>
  );
};

const ChartCard: React.FC<{
  title: string; icon: React.ReactNode; wide?: boolean;
  loading?: boolean; children: React.ReactNode;
}> = ({ title, icon, wide, loading, children }) => (
  <div className={`stats-chart-card${wide ? ' stats-chart-card--wide' : ''}`}>
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

const Empty = () => (
  <div className="stats-chart-placeholder">
    <BarChart2 size={32} className="stats-chart-placeholder-icon" />
    <span>Sin datos</span>
  </div>
);

// ── Componente ────────────────────────────────────────────────────────────

const DemographicsTab: React.FC = () => {
  const [genero,    setGenero]    = useState<EstadisticaGenero[]>([]);
  const [edad,      setEdad]      = useState<EstadisticaRangoEdad[]>([]);
  const [estrato,   setEstrato]   = useState<EstadisticaEstrato[]>([]);
  const [programas, setProgramas] = useState<EstadisticaPrograma[]>([]);

  const [loadingGenero,    setLoadingGenero]    = useState(true);
  const [loadingEdad,      setLoadingEdad]      = useState(true);
  const [loadingEstrato,   setLoadingEstrato]   = useState(true);
  const [loadingProgramas, setLoadingProgramas] = useState(true);

  useEffect(() => {
    getEstadisticasPorGenero()
      .then(setGenero).catch(console.error).finally(() => setLoadingGenero(false));
    getEstadisticasPorEdad()
      .then(setEdad).catch(console.error).finally(() => setLoadingEdad(false));
    getEstadisticasPorEstrato()
      .then(setEstrato).catch(console.error).finally(() => setLoadingEstrato(false));
    getEstadisticasPorPrograma()
      .then(setProgramas).catch(console.error).finally(() => setLoadingProgramas(false));
  }, []);

  return (
    <div className="stats-charts-grid">

      {/* Género — Torta */}
      <ChartCard title="Identidad de Género" icon={<Users size={14} />} loading={loadingGenero}>
        {genero.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={genero} dataKey="total" nameKey="genero" cx="50%" cy="44%"
                outerRadius={95} labelLine={false} label={renderPieLabel}>
                {genero.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend verticalAlign="bottom" height={36}
                formatter={(v) => <span className="stats-legend-text">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Rangos de Edad */}
      <ChartCard title="Rangos de Edad" icon={<BarChart2 size={14} />} loading={loadingEdad}>
        {edad.every(r => r.total === 0) ? <Empty /> : (
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

      {/* Estrato */}
      <ChartCard title="Estrato Socioeconómico" icon={<BarChart2 size={14} />} loading={loadingEstrato}>
        {estrato.length === 0 ? <Empty /> : (
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

      {/* Programas */}
      <ChartCard title="Inscritos por Programa" icon={<Map size={14} />} loading={loadingProgramas}>
        {programas.length === 0 ? <Empty /> : (
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
  );
};

export default DemographicsTab;
