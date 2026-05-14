import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, Home, DollarSign, AlertTriangle, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getEstadisticasPersonasHogar,
  getEstadisticasIngresos,
  getEstadisticasConflicto,
  getEstadisticasEtnia,
  type EstadisticaPersonasHogar,
  type EstadisticaIngreso,
  type EstadisticaConflicto,
  type EstadisticaEtnia,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_PIE    = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const COLORS_SI_NO  = ['#ef4444', '#e2e8f0'];
const COLOR_BAR     = '#4f46e5';
const COLOR_BAR_2   = '#10b981';

// ── Helpers ───────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, porcentaje }: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const lx = cx + r * Math.cos(-midAngle * RADIAN);
  const ly = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-pct">
      {porcentaje ?? `${(percent * 100).toFixed(1)}`}%
    </text>
  );
};

const renderEtniaLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, porcentaje, name }: any) => {
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

const FamilyContextTab: React.FC = () => {
  const [personas,   setPersonas]   = useState<EstadisticaPersonasHogar[]>([]);
  const [ingresos,   setIngresos]   = useState<EstadisticaIngreso[]>([]);
  const [conflicto,  setConflicto]  = useState<EstadisticaConflicto[]>([]);
  const [etnia,      setEtnia]      = useState<EstadisticaEtnia[]>([]);

  const [loadingPersonas,  setLoadingPersonas]  = useState(true);
  const [loadingIngresos,  setLoadingIngresos]  = useState(true);
  const [loadingConflicto, setLoadingConflicto] = useState(true);
  const [loadingEtnia,     setLoadingEtnia]     = useState(true);

  useEffect(() => {
    getEstadisticasPersonasHogar()
      .then(setPersonas).catch(console.error).finally(() => setLoadingPersonas(false));
    getEstadisticasIngresos()
      .then(setIngresos).catch(console.error).finally(() => setLoadingIngresos(false));
    getEstadisticasConflicto()
      .then(setConflicto).catch(console.error).finally(() => setLoadingConflicto(false));
    getEstadisticasEtnia()
      .then(setEtnia).catch(console.error).finally(() => setLoadingEtnia(false));
  }, []);

  const conflictoPie  = conflicto.map(d => ({ ...d, name: d.categoria }));
  const etniaPie      = etnia.map(d => ({ ...d, name: d.etnia }));

  return (
    <div className="stats-charts-grid">

      {/* Personas en casa — Barras */}
      <ChartCard title="Personas en Casa" icon={<Home size={14} />} loading={loadingPersonas}>
        {personas.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={personas} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="cantidad" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_BAR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Ingresos — Barras */}
      <ChartCard title="Ingresos Totales del Hogar" icon={<DollarSign size={14} />} loading={loadingIngresos}>
        {ingresos.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresos} margin={{ top: 8, right: 12, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="rango"
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_BAR_2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Conflicto armado — Torta Si/No */}
      <ChartCard title="Víctima del Conflicto Armado" icon={<AlertTriangle size={14} />} loading={loadingConflicto}>
        {conflictoPie.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={conflictoPie}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="44%"
                outerRadius={90}
                labelLine={false}
                label={renderPieLabel}
              >
                {conflictoPie.map((_, i) => (
                  <Cell key={i} fill={COLORS_SI_NO[i % COLORS_SI_NO.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend verticalAlign="bottom" height={32}
                formatter={(v) => <span className="stats-legend-text">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Etnia — Torta */}
      <ChartCard title="Autorreconocimiento Étnico" icon={<Users size={14} />} loading={loadingEtnia}>
        {etniaPie.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={etniaPie}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="44%"
                outerRadius={95}
                labelLine={false}
                label={renderEtniaLabel}
              >
                {etniaPie.map((_, i) => (
                  <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend verticalAlign="bottom" height={36}
                formatter={(v) => <span className="stats-legend-text">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  );
};

export default FamilyContextTab;
