import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, Accessibility, Leaf, Pill, FileCheck } from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getEstadisticasSalud,
  getEstadisticasEpsCertificado,
  type EstadisticaSaludItem,
  type EstadisticaEpsCertificado,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLORS_SI_NO  = ['#ef4444', '#e2e8f0'];
const COLORS_EPS    = ['#10b981', '#f59e0b'];

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
  title: string; icon: React.ReactNode; loading?: boolean; children: React.ReactNode;
}> = ({ title, icon, loading, children }) => (
  <div className="stats-chart-card">
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

// Torta Si/No reutilizable
const SiNoPie: React.FC<{ data: EstadisticaSaludItem[] }> = ({ data }) => {
  if (!data.length) return <Empty />;
  const pieData = data.map(d => ({ ...d, name: d.categoria }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="44%"
          outerRadius={90}
          labelLine={false}
          label={renderPieLabel}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS_SI_NO[i % COLORS_SI_NO.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomPieTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={32}
          formatter={(v) => <span className="stats-legend-text">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ── Componente ────────────────────────────────────────────────────────────

const HealthTab: React.FC = () => {
  const [discapacidad, setDiscapacidad] = useState<EstadisticaSaludItem[]>([]);
  const [alergia,      setAlergia]      = useState<EstadisticaSaludItem[]>([]);
  const [tratamiento,  setTratamiento]  = useState<EstadisticaSaludItem[]>([]);
  const [epsCert,      setEpsCert]      = useState<EstadisticaEpsCertificado[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingEps,   setLoadingEps]   = useState(true);

  useEffect(() => {
    getEstadisticasSalud()
      .then(res => {
        setDiscapacidad(res.discapacidad);
        setAlergia(res.alergia);
        setTratamiento(res.tratamiento);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    getEstadisticasEpsCertificado()
      .then(setEpsCert)
      .catch(console.error)
      .finally(() => setLoadingEps(false));
  }, []);

  // Torta EPS con colores distintos
  const EpsPie: React.FC = () => {
    if (!epsCert.length) return <Empty />;
    const pieData = epsCert.map(d => ({ ...d, name: d.categoria }));
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="44%"
            outerRadius={90}
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
              if (percent < 0.05) return null;
              const RADIAN = Math.PI / 180;
              const r = innerRadius + (outerRadius - innerRadius) * 0.55;
              const lx = cx + r * Math.cos(-midAngle * RADIAN);
              const ly = cy + r * Math.sin(-midAngle * RADIAN);
              return (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="stats-pie-label-pct">
                  {payload.porcentaje}%
                </text>
              );
            }}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS_EPS[i % COLORS_EPS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={32}
            formatter={(v) => <span className="stats-legend-text">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="stats-charts-grid">

      <ChartCard title="Discapacidad" icon={<Accessibility size={14} />} loading={loading}>
        <SiNoPie data={discapacidad} />
      </ChartCard>

      <ChartCard title="Alergia" icon={<Leaf size={14} />} loading={loading}>
        <SiNoPie data={alergia} />
      </ChartCard>

      <ChartCard title="Tratamiento Médico" icon={<Pill size={14} />} loading={loading}>
        <SiNoPie data={tratamiento} />
      </ChartCard>

      <ChartCard title="Certificado EPS Cargado" icon={<FileCheck size={14} />} loading={loadingEps}>
        <EpsPie />
      </ChartCard>

    </div>
  );
};

export default HealthTab;
