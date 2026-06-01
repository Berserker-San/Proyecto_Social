import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, Layers, Zap, Leaf } from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  getEstadisticasPorTipoPrograma,
  getEstadisticasDisciplinaTribu,
  getEstadisticasMacroSoroca,
  type EstadisticaCaracterizacion,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_PROGRAMA  = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4'];
const COLORS_TRIBU     = ['#6366f1', '#06b6d4'];
const COLORS_SOROCA    = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Helpers ───────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180;

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const lx = cx + r * Math.cos(-midAngle * RADIAN);
  const ly = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <g>
      <text x={lx} y={ly - 8} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-name">
        {payload.categoria}
      </text>
      <text x={lx} y={ly + 10} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-pct">
        {payload.porcentaje}%
      </text>
    </g>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-label">{payload[0].payload.categoria}</p>
      <p className="stats-tooltip-value">
        {payload[0].value} personas ({payload[0].payload.porcentaje}%)
      </p>
    </div>
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

const CaracterizacionTab: React.FC = () => {
  const [programas,  setProgramas]  = useState<EstadisticaCaracterizacion[]>([]);
  const [tribu,      setTribu]      = useState<EstadisticaCaracterizacion[]>([]);
  const [soroca,     setSoroca]     = useState<EstadisticaCaracterizacion[]>([]);

  const [loadingProgramas, setLoadingProgramas] = useState(true);
  const [loadingTribu,     setLoadingTribu]     = useState(true);
  const [loadingSoroca,    setLoadingSoroca]    = useState(true);

  useEffect(() => {
    getEstadisticasPorTipoPrograma()
      .then(setProgramas).catch(console.error).finally(() => setLoadingProgramas(false));
    getEstadisticasDisciplinaTribu()
      .then(setTribu).catch(console.error).finally(() => setLoadingTribu(false));
    getEstadisticasMacroSoroca()
      .then(setSoroca).catch(console.error).finally(() => setLoadingSoroca(false));
  }, []);

  return (
    <div className="stats-charts-grid">

      {/* TRIBU vs SOROCA — Torta */}
      <ChartCard title="Distribución por Programa" icon={<Layers size={14} />} loading={loadingProgramas}>
        {programas.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={programas}
                dataKey="total"
                nameKey="categoria"
                cx="50%"
                cy="44%"
                outerRadius={95}
                labelLine={false}
                label={renderPieLabel}
              >
                {programas.map((_, i) => (
                  <Cell key={i} fill={COLORS_PROGRAMA[i % COLORS_PROGRAMA.length]} />
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

      {/* TRIBU — Disciplina: Ultimate vs Rugby */}
      <ChartCard title="TRIBU — Disciplina" icon={<Zap size={14} />} loading={loadingTribu}>
        {tribu.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={tribu}
                dataKey="total"
                nameKey="categoria"
                cx="50%"
                cy="44%"
                outerRadius={95}
                labelLine={false}
                label={renderPieLabel}
              >
                {tribu.map((_, i) => (
                  <Cell key={i} fill={COLORS_TRIBU[i % COLORS_TRIBU.length]} />
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

      {/* SOROCA — Macro: Soñar, Romper, Cambiar, Mundo Cotidiano */}
      <ChartCard title="SOROCA — Tipo de Programa" icon={<Leaf size={14} />} wide loading={loadingSoroca}>
        {soroca.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={soroca} margin={{ top: 8, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="categoria" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {soroca.map((_, i) => (
                  <Cell key={i} fill={COLORS_SOROCA[i % COLORS_SOROCA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  );
};

export default CaracterizacionTab;
