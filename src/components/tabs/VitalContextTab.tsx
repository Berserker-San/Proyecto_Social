import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, BookOpen, Briefcase, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getEstadisticasPorOcupacion,
  getEstadisticasPorEscolaridad,
  type EstadisticaOcupacion,
  type EstadisticaEscolaridad,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_PIE = ['#06b6d4', '#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const COLOR_BAR  = '#06b6d4';

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

  const [loadingOcupacion,   setLoadingOcupacion]   = useState(true);
  const [loadingEscolaridad, setLoadingEscolaridad] = useState(true);

  useEffect(() => {
    getEstadisticasPorOcupacion()
      .then(setOcupacion).catch(console.error).finally(() => setLoadingOcupacion(false));
    getEstadisticasPorEscolaridad()
      .then(setEscolaridad).catch(console.error).finally(() => setLoadingEscolaridad(false));
  }, []);

  const ocupacionPie = ocupacion.map(o => ({ ...o, name: o.ocupacion }));

  return (
    <div className="stats-charts-grid">

      {/* ── SECCIÓN VALIENTES ── */}
      <div className="stats-chart-card--wide" style={{ gridColumn: '1 / -1', paddingBottom: 0 }}>
        <div className="flex items-center gap-2 px-1 pb-2 border-b border-slate-100">
          <Users size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Valientes</span>
        </div>
      </div>

      {/* Ocupación Valientes — Torta */}
      <ChartCard title="Ocupación — Valientes" icon={<Briefcase size={14} />} loading={loadingOcupacion}>
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

      {/* Escolaridad Valientes — Barras */}
      <ChartCard title="Escolaridad — Valientes" icon={<BookOpen size={14} />} loading={loadingEscolaridad}>
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

      {/* ── SECCIÓN ACUDIENTES / PADRES ── */}
      <div className="stats-chart-card--wide" style={{ gridColumn: '1 / -1', paddingBottom: 0 }}>
        <div className="flex items-center gap-2 px-1 pb-2 border-b border-slate-100 mt-2">
          <Users size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Acudientes / Padres
          </span>
          <span className="text-xs text-slate-400 ml-2">
            (datos de ocupación y escolaridad pendientes de captura en el formulario)
          </span>
        </div>
      </div>

      {/* Placeholder acudientes — ocupación */}
      <ChartCard title="Ocupación — Acudientes" icon={<Briefcase size={14} />} loading={false}>
        <div className="stats-chart-placeholder">
          <Briefcase size={28} className="stats-chart-placeholder-icon" />
          <span className="text-center text-xs text-slate-400 px-4">
            Disponible cuando se registre la ocupación del acudiente en el formulario de registro.
          </span>
        </div>
      </ChartCard>

      {/* Placeholder acudientes — escolaridad */}
      <ChartCard title="Escolaridad — Acudientes" icon={<BookOpen size={14} />} loading={false}>
        <div className="stats-chart-placeholder">
          <BookOpen size={28} className="stats-chart-placeholder-icon" />
          <span className="text-center text-xs text-slate-400 px-4">
            Disponible cuando se registre el nivel educativo del acudiente en el formulario de registro.
          </span>
        </div>
      </ChartCard>

    </div>
  );
};

export default VitalContextTab;
