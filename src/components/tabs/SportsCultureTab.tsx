import React, { useState, useEffect } from 'react';
import { BarChart2, Loader2, Shirt, Footprints, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getEstadisticasTallaCamisa,
  getEstadisticasTallaGuayos,
  getEstadisticasEntrenos,
  type EstadisticaTalla,
  type EstadisticaEntreno,
} from '../../lib/services/estadisticas.service';

// ── Paleta ────────────────────────────────────────────────────────────────

const COLOR_CAMISA  = '#6366f1';
const COLOR_GUAYOS  = '#06b6d4';
const COLOR_ENTRENO = '#10b981';

// ── Helpers ───────────────────────────────────────────────────────────────

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

const SportsCultureTab: React.FC = () => {
  const [camisa,   setCamisa]   = useState<EstadisticaTalla[]>([]);
  const [guayos,   setGuayos]   = useState<EstadisticaTalla[]>([]);
  const [entrenos, setEntrenos] = useState<EstadisticaEntreno[]>([]);

  const [loadingCamisa,   setLoadingCamisa]   = useState(true);
  const [loadingGuayos,   setLoadingGuayos]   = useState(true);
  const [loadingEntrenos, setLoadingEntrenos] = useState(true);

  useEffect(() => {
    getEstadisticasTallaCamisa()
      .then(setCamisa).catch(console.error).finally(() => setLoadingCamisa(false));
    getEstadisticasTallaGuayos()
      .then(setGuayos).catch(console.error).finally(() => setLoadingGuayos(false));
    getEstadisticasEntrenos()
      .then(setEntrenos).catch(console.error).finally(() => setLoadingEntrenos(false));
  }, []);

  return (
    <div className="stats-charts-grid">

      {/* Talla camiseta */}
      <ChartCard title="Talla de Camiseta" icon={<Shirt size={14} />} loading={loadingCamisa}>
        {camisa.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={camisa} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="talla" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_CAMISA} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Talla guayos */}
      <ChartCard title="Talla de Guayos" icon={<Footprints size={14} />} loading={loadingGuayos}>
        {guayos.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={guayos} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="talla" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_GUAYOS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Compromiso de entrenos — wide */}
      <ChartCard title="Compromiso de Entrenos" icon={<Calendar size={14} />} wide loading={loadingEntrenos}>
        {entrenos.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={entrenos} margin={{ top: 8, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" fill={COLOR_ENTRENO} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </div>
  );
};

export default SportsCultureTab;
