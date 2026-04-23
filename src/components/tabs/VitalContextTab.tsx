import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, MapPin, BookOpen, Briefcase } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getEstadisticasPorOcupacion,
  getEstadisticasPorEscolaridad,
  getEstadisticasPorComuna,
  type EstadisticaOcupacion,
  type EstadisticaEscolaridad,
  type EstadisticaComuna,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_PIE = ['#06b6d4', '#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const COLOR_BAR  = '#06b6d4';
const COLOR_BAR2 = '#4f46e5';

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

const VitalContextTab: React.FC = () => {
  const [ocupacion,   setOcupacion]   = useState<EstadisticaOcupacion[]>([]);
  const [escolaridad, setEscolaridad] = useState<EstadisticaEscolaridad[]>([]);
  const [comunas,     setComunas]     = useState<EstadisticaComuna[]>([]);

  const [loadingOcupacion,   setLoadingOcupacion]   = useState(true);
  const [loadingEscolaridad, setLoadingEscolaridad] = useState(true);
  const [loadingComunas,     setLoadingComunas]     = useState(true);

  useEffect(() => {
    getEstadisticasPorOcupacion()
      .then(setOcupacion).catch(console.error).finally(() => setLoadingOcupacion(false));
    getEstadisticasPorEscolaridad()
      .then(setEscolaridad).catch(console.error).finally(() => setLoadingEscolaridad(false));
    getEstadisticasPorComuna()
      .then(setComunas).catch(console.error).finally(() => setLoadingComunas(false));
  }, []);

  // Adaptar datos de ocupación para PieChart (nameKey debe ser "name")
  const ocupacionPie = ocupacion.map(o => ({ ...o, name: o.ocupacion }));

  return (
    <div className="stats-charts-grid">

      {/* Ocupación — Torta */}
      <ChartCard title="Ocupación" icon={<Briefcase size={14} />} loading={loadingOcupacion}>
        {ocupacion.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={ocupacionPie}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="44%"
                outerRadius={95}
                labelLine={false}
                label={renderPieLabel}
              >
                {ocupacionPie.map((_, i) => (
                  <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(v) => <span className="stats-legend-text">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Escolaridad — Barras */}
      <ChartCard title="Nivel de Escolaridad" icon={<BookOpen size={14} />} loading={loadingEscolaridad}>
        {escolaridad.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={escolaridad} margin={{ top: 8, right: 12, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="nivel"
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_BAR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Comunas — Barras wide */}
      <ChartCard title="Concentración por Comunas" icon={<MapPin size={14} />} wide loading={loadingComunas}>
        {comunas.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comunas} margin={{ top: 8, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="comuna" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_BAR2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  );
};

export default VitalContextTab;
