import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarPlus, ChevronLeft, Users, CheckCircle2,
  XCircle, Clock, Search, Loader2, Trash2, Calendar, MessageSquare, Filter,
} from 'lucide-react';
import { getEventos, crearEvento, eliminarEvento, getAsistenciaEvento, upsertAsistencia } from '../../lib/services/attendance.service';
import { supabase } from '../../lib/supabase';
import type { Evento, Valiente } from '../../types/database.types';
import './Attendance.css';

type View = 'list' | 'take';
type DateFilter = 'all' | 'past' | 'today' | 'upcoming';

type ValienteConAsistencia = Valiente & {
  asistencia_estado: string | null;
  asistencia_id: number | null;
  asistencia_comentario: string | null;
  macro_soroca: string | null;
};

const ESTADOS = ['Presente', 'Ausente', 'Justificado'] as const;
type EstadoAsistencia = typeof ESTADOS[number];

const estadoConfig: Record<EstadoAsistencia, { label: string; icon: React.ReactNode; cls: string }> = {
  Presente:    { label: 'Presente',    icon: <CheckCircle2 size={15} />, cls: 'att-chip--present'   },
  Ausente:     { label: 'Ausente',     icon: <XCircle size={15} />,      cls: 'att-chip--absent'    },
  Justificado: { label: 'Justificado', icon: <Clock size={15} />,        cls: 'att-chip--justified' },
};

const Attendance: React.FC<{ usuarioId?: string | null; context?: 'GLOBAL' | 'TRIBU' | 'SOROCA' }> = ({
  usuarioId = null,
  context = 'GLOBAL',
}) => {
  const [view,          setView]          = useState<View>('list');
  const [eventos,       setEventos]       = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [valientes,     setValientes]     = useState<ValienteConAsistencia[]>([]);
  const [search,        setSearch]        = useState('');
  const [loadingList,   setLoadingList]   = useState(true);
  const [loadingTake,   setLoadingTake]   = useState(false);
  const [saving,        setSaving]        = useState<number | null>(null);
  // Mapa valienteId → comentario en edición (borrador local antes de guardar)
  const [comentarios,   setComentarios]   = useState<Record<number, string>>({});
  const [showForm,      setShowForm]      = useState(false);
  const [dateFilter,    setDateFilter]    = useState<DateFilter>('today');
  const [searchDate,    setSearchDate]    = useState('');
  const [programas,     setProgramas]     = useState<{ id: number; codigo: string; nombre: string }[]>([]);
  // Filtro de programa en la lista de eventos (selector explícito)
  const [programaFilter, setProgramaFilter] = useState<string>('');
  // Filtros en la vista de toma de asistencia
  const [macroFilter,    setMacroFilter]    = useState<string>('');  // '' = todos los macros
  const [estadoFilter,   setEstadoFilter]   = useState<string>('');  // '' = todos los estados
  const [formData,      setFormData]      = useState({
    nombre_evento: '',
    fecha: '',
    hora: '',
    programa_id: '',   // id como string para el select
  });
  const [formError,     setFormError]     = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);

  // ── Carga eventos ──────────────────────────────────────────────────────
  const loadEventos = useCallback(async () => {
    setLoadingList(true);
    try {
      setEventos(await getEventos());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadEventos(); }, [loadEventos]);

  // Carga programas disponibles
  useEffect(() => {
    Promise.resolve(
      supabase.from('programa').select('id, codigo, nombre').eq('esta_activo', true)
    ).then(({ data }) => setProgramas(data ?? [])).catch(console.error);
  }, []);

  // Sincroniza programa_id cuando cambia el contexto
  useEffect(() => {
    if (context === 'GLOBAL') {
      setFormData(prev => ({ ...prev, programa_id: '' }));
    } else {
      const match = programas.find(p => p.codigo === context);
      setFormData(prev => ({ ...prev, programa_id: match ? String(match.id) : '' }));
    }
  }, [context, programas]);

  // ── Abrir toma de asistencia ───────────────────────────────────────────
  const openEvento = async (evento: Evento) => {
    setSelectedEvento(evento);
    setView('take');
    setLoadingTake(true);
    setSearch('');
    setMacroFilter('');
    setEstadoFilter('');
    try {
      const data = await getAsistenciaEvento(evento.id, evento.programa_id);
      setValientes(data);
      // Inicializar mapa de comentarios con los valores ya guardados
      const inicial: Record<number, string> = {};
      for (const v of data) {
        if (v.asistencia_comentario) inicial[v.id] = v.asistencia_comentario;
      }
      setComentarios(inicial);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTake(false);
    }
  };

  // ── Marcar asistencia ─────────────────────────────────────────────────
  const handleMark = async (valienteId: number, estado: EstadoAsistencia) => {
    if (!selectedEvento) return;
    setSaving(valienteId);
    try {
      const comentario = comentarios[valienteId] ?? null;
      await upsertAsistencia(selectedEvento.id, valienteId, estado, comentario, usuarioId);
      setValientes(prev =>
        prev.map(v => v.id === valienteId
          ? { ...v, asistencia_estado: estado, asistencia_comentario: comentario }
          : v
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  // ── Guardar comentario sin cambiar estado ─────────────────────────────
  const handleSaveComentario = async (valienteId: number) => {
    if (!selectedEvento) return;
    const v = valientes.find(x => x.id === valienteId);
    if (!v?.asistencia_estado) return; // no hay estado aún, no guardar
    setSaving(valienteId);
    try {
      const comentario = comentarios[valienteId] ?? null;
      await upsertAsistencia(selectedEvento.id, valienteId, v.asistencia_estado, comentario, usuarioId);
      setValientes(prev =>
        prev.map(x => x.id === valienteId
          ? { ...x, asistencia_comentario: comentario }
          : x
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  // ── Crear evento ──────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_evento || !formData.fecha) {
      setFormError('Nombre y fecha son obligatorios.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await crearEvento({
        nombre_evento: formData.nombre_evento,
        fecha:         formData.fecha,
        hora:          formData.hora || null,
        programa_id:   formData.programa_id ? Number(formData.programa_id) : null,
        creado_por:    usuarioId,
      });
      setFormData({ nombre_evento: '', fecha: '', hora: '', programa_id: context !== 'GLOBAL' ? String(programas.find(p => p.codigo === context)?.id ?? '') : '' });
      setShowForm(false);
      await loadEventos();
    } catch (err: any) {
      setFormError(err.message ?? 'Error al crear el evento.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eliminar evento ───────────────────────────────────────────────────
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este evento y toda su asistencia?')) return;
    try {
      await eliminarEvento(id);
      setEventos(prev => prev.filter(ev => ev.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Filtro búsqueda + macro + estado en vista toma ───────────────────
  const filtered = valientes.filter(v => {
    const matchSearch = `${v.nombres} ${v.apellidos} ${v.numero_documento}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchMacro  = !macroFilter  || v.macro_soroca === macroFilter;
    const matchEstado = !estadoFilter
      ? true
      : estadoFilter === 'sin_marcar'
        ? !v.asistencia_estado
        : v.asistencia_estado === estadoFilter;
    return matchSearch && matchMacro && matchEstado;
  });

  // ── Filtro eventos por contexto ───────────────────────────────────────
  // Fecha local colombiana (UTC-5) en formato YYYY-MM-DD
  const now = new Date();
  const bogotaOffset = -5 * 60; // UTC-5 en minutos
  const localMs = now.getTime() + (bogotaOffset - (-now.getTimezoneOffset())) * 60000;
  const bogotaDate = new Date(localMs);
  const todayCol = bogotaDate.toISOString().slice(0, 10);

  const eventosFiltrados = eventos
    .filter(ev => {
      // Filtro por contexto/programa prop
      if (context !== 'GLOBAL') {
        if (ev.programa_id) {
          const prog = programas.find(p => p.id === ev.programa_id);
          if (prog?.codigo !== context) return false;
        }
      }
      // Filtro explícito por selector de programa
      if (programaFilter) {
        if (!ev.programa_id) return false;
        if (String(ev.programa_id) !== programaFilter) return false;
      }
      // Si hay búsqueda por fecha exacta, tiene prioridad
      if (searchDate) return ev.fecha === searchDate;
      // Filtro por botón
      if (dateFilter === 'all')      return true;
      if (dateFilter === 'today')    return ev.fecha === todayCol;
      if (dateFilter === 'past')     return ev.fecha < todayCol;
      if (dateFilter === 'upcoming') return ev.fecha > todayCol;
      return true;
    });

  // Conteos responden al subconjunto filtrado (búsqueda + macro + estado)
  const presentCount   = filtered.filter(v => v.asistencia_estado === 'Presente').length;
  const ausenteCount   = filtered.filter(v => v.asistencia_estado === 'Ausente').length;
  const justCount      = filtered.filter(v => v.asistencia_estado === 'Justificado').length;
  const sinMarcarCount = filtered.filter(v => !v.asistencia_estado).length;

  // Macros disponibles en el evento actual (para el selector de filtro)
  const macrosDisponibles = Array.from(
    new Set(valientes.map(v => v.macro_soroca).filter(Boolean))
  ) as string[];

  // ── VISTA: Lista de eventos ───────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="att-root">

        {/* Header */}
        <div className="att-header">
          <div className="att-header-left">
            <div className="att-header-icon"><Calendar size={22} /></div>
            <div>
              <h1 className="att-title">Asistencia</h1>
              <p className="att-subtitle">Gestiona eventos y toma asistencia de valientes.</p>
            </div>
          </div>
          <button className="att-btn-primary" onClick={() => setShowForm(v => !v)}>
            <CalendarPlus size={16} /> Nuevo Evento
          </button>
        </div>

        {/* Filtro por programa + filtros de fecha */}
        <div className="att-filters-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* Selector de programa — solo en GLOBAL */}
          {context === 'GLOBAL' && programas.length > 0 && (
            <select
              value={programaFilter}
              onChange={e => setProgramaFilter(e.target.value)}
              className="att-input"
              style={{ width: 'auto', minWidth: '9rem' }}
            >
              <option value="">Todos los programas</option>
              {programas.map(p => (
                <option key={p.id} value={String(p.id)}>{p.nombre}</option>
              ))}
            </select>
          )}
          <div className="att-date-filters">
            {([
              { key: 'all',      label: 'Todos'      },
              { key: 'past',     label: 'Anteriores' },
              { key: 'today',    label: 'Hoy'        },
              { key: 'upcoming', label: 'Próximos'   },
            ] as { key: DateFilter; label: string }[]).map(f => (
              <button
                key={f.key}
                className={`att-date-filter-btn${dateFilter === f.key && !searchDate ? ' att-date-filter-btn--active' : ''}`}
                onClick={() => { setDateFilter(f.key); setSearchDate(''); }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="att-date-search">
            <input
              type="date"
              className={`att-input att-date-input${searchDate ? ' att-date-input--active' : ''}`}
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
            />
            {searchDate && (
              <button className="att-date-clear" onClick={() => setSearchDate('')}>✕</button>
            )}
          </div>
        </div>

        {/* Formulario nuevo evento */}
        {showForm && (
          <div className="att-form-card">
            <h3 className="att-form-title">Crear Evento</h3>
            <form onSubmit={handleCreate} className="att-form">
              <div className="att-form-grid">
                <div className="att-form-group att-form-group--wide">
                  <label className="att-label">NOMBRE DEL EVENTO</label>
                  <input
                    className="att-input"
                    placeholder="Ej. Entreno Martes 4-6pm"
                    value={formData.nombre_evento}
                    onChange={e => setFormData(p => ({ ...p, nombre_evento: e.target.value }))}
                  />
                </div>
                <div className="att-form-group">
                  <label className="att-label">PROGRAMA</label>
                  <select
                    className="att-input"
                    value={formData.programa_id}
                    onChange={e => setFormData(p => ({ ...p, programa_id: e.target.value }))}
                  >
                    <option value="">Sin programa</option>
                    {programas.map(p => (
                      <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="att-form-group">
                  <label className="att-label">FECHA</label>
                  <input
                    type="date"
                    className="att-input"
                    value={formData.fecha}
                    onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
                  />
                </div>
                <div className="att-form-group">
                  <label className="att-label">HORA (OPCIONAL)</label>
                  <input
                    type="time"
                    className="att-input"
                    value={formData.hora}
                    onChange={e => setFormData(p => ({ ...p, hora: e.target.value }))}
                  />
                </div>
              </div>
              {formError && <p className="att-form-error">{formError}</p>}
              <div className="att-form-actions">
                <button type="button" className="att-btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="att-btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="att-spin" /> : <CalendarPlus size={15} />}
                  Crear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {loadingList ? (
          <div className="att-loading">
            <Loader2 size={28} className="att-spin" />
            <span>Cargando eventos…</span>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="att-empty">
            <Calendar size={40} />
            <p>No hay eventos aún. Crea el primero.</p>
          </div>
        ) : (
          <div className="att-event-list">
            {eventosFiltrados.map(ev => (
              <div key={ev.id} className="att-event-card" onClick={() => openEvento(ev)}>
                <div className="att-event-date">
                  <span className="att-event-day">
                    {new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                  {ev.hora && (
                    <span className="att-event-time">
                      {ev.hora.slice(0, 5)}
                    </span>
                  )}
                </div>
                <div className="att-event-info">
                  <span className="att-event-name">{ev.nombre_evento}</span>
                  <span className="att-event-meta">
                    {new Date(ev.fecha + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {ev.programa_id && (
                      <span className={`att-programa-badge att-programa-badge--${
                        programas.find(p => p.id === ev.programa_id)?.codigo?.toLowerCase() ?? 'default'
                      }`}>
                        {programas.find(p => p.id === ev.programa_id)?.codigo ?? ev.programa_id}
                      </span>
                    )}
                  </span>
                </div>
                <div className="att-event-actions">
                  <button
                    className="att-btn-take"
                    onClick={e => { e.stopPropagation(); openEvento(ev); }}
                  >
                    <Users size={14} /> Tomar asistencia
                  </button>
                  <button className="att-btn-delete" onClick={e => handleDelete(ev.id, e)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── VISTA: Toma de asistencia ─────────────────────────────────────────
  return (
    <div className="att-root">

      {/* Header */}
      <div className="att-header">
        <div className="att-header-left">
          <button className="att-btn-back" onClick={() => setView('list')}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="att-title">{selectedEvento?.nombre_evento}</h1>
            <p className="att-subtitle">
              {selectedEvento && new Date(selectedEvento.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {selectedEvento?.hora && ` · ${selectedEvento.hora.slice(0, 5)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="att-summary">
        <div className="att-summary-chip att-summary-chip--present">
          <CheckCircle2 size={14} /> {presentCount} Presentes
        </div>
        <div className="att-summary-chip att-summary-chip--absent">
          <XCircle size={14} /> {ausenteCount} Ausentes
        </div>
        <div className="att-summary-chip att-summary-chip--justified">
          <Clock size={14} /> {justCount} Justificados
        </div>
        <div className="att-summary-chip att-summary-chip--pending">
          <Users size={14} /> {sinMarcarCount} Sin marcar
        </div>
      </div>

      {/* Filtros de macro y estado — debajo del resumen */}
      {(macrosDisponibles.length > 0 || true) && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0 1rem 0.5rem' }}>
          {macrosDisponibles.length > 0 && (
            <select
              value={macroFilter}
              onChange={e => setMacroFilter(e.target.value)}
              className="att-input"
              style={{ width: 'auto', minWidth: '9rem', fontSize: '0.8rem' }}
            >
              <option value="">Todos los macros</option>
              {macrosDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
            className="att-input"
            style={{ width: 'auto', minWidth: '9rem', fontSize: '0.8rem' }}
          >
            <option value="">Todos los estados</option>
            <option value="Presente">Presente</option>
            <option value="Ausente">Ausente</option>
            <option value="Justificado">Justificado</option>
            <option value="sin_marcar">Sin marcar</option>
          </select>
          {(macroFilter || estadoFilter) && (
            <button
              onClick={() => { setMacroFilter(''); setEstadoFilter(''); }}
              className="att-btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <Filter size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Búsqueda */}
      <div className="att-search-wrap">
        <Search size={15} className="att-search-icon" />
        <input
          className="att-search"
          placeholder="Buscar por nombre o documento…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista valientes */}
      {loadingTake ? (
        <div className="att-loading">
          <Loader2 size={28} className="att-spin" />
          <span>Cargando valientes…</span>
        </div>
      ) : (
        <div className="att-valiente-list">
          {filtered.map(v => {
            const needsComment = v.asistencia_estado === 'Ausente' || v.asistencia_estado === 'Justificado';
            const hasComment   = !!(v.asistencia_comentario || comentarios[v.id]?.trim());
            return (
              <div key={v.id} className="att-valiente-row" style={{ flexWrap: 'wrap' }}>
                <div className="att-valiente-avatar">
                  {v.nombres.charAt(0)}{v.apellidos.charAt(0)}
                </div>
                <div className="att-valiente-info">
                  <span className="att-valiente-name">
                    {v.nombres} {v.apellidos}
                    {/* Indicador de comentario guardado */}
                    {hasComment && v.asistencia_estado !== 'Ausente' && v.asistencia_estado !== 'Justificado' && (
                      <span title="Tiene observación" style={{ marginLeft: '0.4rem', color: '#6366f1', verticalAlign: 'middle' }}>
                        <MessageSquare size={13} />
                      </span>
                    )}
                  </span>
                  <span className="att-valiente-doc">{v.tipo_documento} {v.numero_documento}</span>
                </div>
                <div className="att-chips">
                  {saving === v.id ? (
                    <Loader2 size={18} className="att-spin" />
                  ) : (
                    ESTADOS.map(estado => {
                      const cfg = estadoConfig[estado];
                      const active = v.asistencia_estado === estado;
                      return (
                        <button
                          key={estado}
                          className={`att-chip ${cfg.cls}${active ? ' att-chip--active' : ''}`}
                          onClick={() => handleMark(v.id, estado)}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })
                  )}
                </div>
                {/* Campo de comentario — visible cuando el estado requiere justificación */}
                {needsComment && (
                  <div style={{ width: '100%', paddingLeft: '3rem', marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <textarea
                      rows={2}
                      placeholder={v.asistencia_estado === 'Justificado' ? 'Justificación (requerida)…' : 'Observación (opcional)…'}
                      value={comentarios[v.id] ?? v.asistencia_comentario ?? ''}
                      onChange={e => setComentarios(prev => ({ ...prev, [v.id]: e.target.value }))}
                      style={{
                        flex: 1,
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: '#f8fafc',
                      }}
                    />
                    <button
                      onClick={() => handleSaveComentario(v.id)}
                      disabled={saving === v.id}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: '#6366f1',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginTop: '0.1rem',
                      }}
                    >
                      {saving === v.id ? <Loader2 size={13} className="att-spin" /> : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Attendance;
