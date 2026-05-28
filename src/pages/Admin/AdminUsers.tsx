import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, KeyRound, Trash2,
  Loader2, AlertCircle, CheckCircle2, Info, X,
} from 'lucide-react';
import {
  getUsuariosSistema, getRoles, crearUsuarioAdmin,
  cambiarContrasena, eliminarUsuarioAdmin,
  type UsuarioSistemaConRoles,
} from '../../lib/services/admin.service';
import './AdminUsers.css';

const AdminUsers: React.FC<{ currentUsuarioId?: string | null }> = ({ currentUsuarioId = null }) => {
  const [usuarios,   setUsuarios]   = useState<UsuarioSistemaConRoles[]>([]);
  const [roles,      setRoles]      = useState<{ id: number; codigo: string; nombre: string }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback,   setFeedback]   = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Formulario nuevo usuario
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol_id: '' });

  // Modal cambio de contraseña
  const [pwModal,  setPwModal]  = useState<{ usuario: UsuarioSistemaConRoles } | null>(null);
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError,  setPwError]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([getUsuariosSistema(), getRoles()]);
      setUsuarios(u);
      setRoles(r);
    } catch (e: any) {
      setFeedback({ type: 'err', msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Crear usuario ─────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      setFeedback({ type: 'err', msg: 'Nombre, email y contraseña son obligatorios.' });
      return;
    }
    if (form.password.length < 6) {
      setFeedback({ type: 'err', msg: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await crearUsuarioAdmin({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol_id: form.rol_id ? Number(form.rol_id) : null,
      });
      setForm({ nombre: '', email: '', password: '', rol_id: '' });
      setShowForm(false);
      setFeedback({ type: 'ok', msg: 'Usuario creado correctamente. Ya puede iniciar sesión.' });
      await load();
    } catch (err: any) {
      setFeedback({ type: 'err', msg: err.message ?? 'Error al crear usuario.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Roles ─────────────────────────────────────────────────────────────

  // ── Cambiar contraseña ────────────────────────────────────────────────
  const openPwModal = (e: React.MouseEvent, usuario: UsuarioSistemaConRoles) => {
    e.stopPropagation();
    setPwModal({ usuario });
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('Todos los campos son obligatorios.');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setPwSaving(true);
    setPwError(null);
    try {
      await cambiarContrasena({
        target_email: pwModal!.usuario.email,
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      setPwModal(null);
      setFeedback({ type: 'ok', msg: 'Contraseña actualizada correctamente.' });
    } catch (err: any) {
      setPwError(err.message ?? 'Error al cambiar contraseña.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Eliminar usuario ─────────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, u: UsuarioSistemaConRoles) => {
    e.stopPropagation();
    if (u.id === currentUsuarioId) return; // no debería llegar aquí, pero por seguridad
    if (!confirm(`¿Eliminar al usuario "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(u.id);
    try {
      await eliminarUsuarioAdmin({ usuario_sistema_id: u.id, auth_user_id: u.auth_user_id });
      setUsuarios(prev => prev.filter(x => x.id !== u.id));
      setFeedback({ type: 'ok', msg: `Usuario "${u.nombre}" eliminado correctamente.` });
    } catch (err: any) {
      setFeedback({ type: 'err', msg: err.message ?? 'Error al eliminar usuario.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="adm-root">

      {/* Header */}
      <div className="adm-header">
        <div className="adm-header-left">
          <div className="adm-header-icon"><Users size={22} /></div>
          <div>
            <h1 className="adm-title">Gestión de Usuarios</h1>
            <p className="adm-subtitle">Administra los accesos al sistema.</p>
          </div>
        </div>
        <button className="adm-btn-primary" onClick={() => setShowForm(v => !v)}>
          <UserPlus size={15} /> Nuevo Usuario
        </button>
      </div>

      {/* Info banner */}
      <div className="adm-info-banner">
        <Info size={15} />
        <span>
          Completa el formulario con nombre, email y contraseña. El usuario se creará automáticamente
          en Supabase Auth y podrá iniciar sesión de inmediato.
        </span>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`adm-feedback adm-feedback--${feedback.type}`}>
          {feedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div className="adm-form-card">
          <h3 className="adm-form-title">Registrar Usuario del Sistema</h3>
          <form onSubmit={handleCreate} className="adm-form">
            <div className="adm-form-grid">
              <div className="adm-form-group adm-form-group--wide">
                <label className="adm-label">NOMBRE COMPLETO</label>
                <input className="adm-input" placeholder="Nombre del administrador"
                  value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">EMAIL</label>
                <input type="email" className="adm-input" placeholder="correo@ejemplo.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">CONTRASEÑA</label>
                <input type="password" className="adm-input" placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">ROL</label>
                <select className="adm-input" value={form.rol_id}
                  onChange={e => setForm(p => ({ ...p, rol_id: e.target.value }))}>
                  <option value="">Sin rol</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.codigo})</option>)}
                </select>
              </div>
            </div>
            <div className="adm-form-actions">
              <button type="button" className="adm-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="adm-btn-primary" disabled={submitting}>
                {submitting ? <Loader2 size={14} className="adm-spin" /> : <UserPlus size={14} />}
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="adm-loading">
          <Loader2 size={28} className="adm-spin" /><span>Cargando usuarios...</span>
        </div>
      ) : (
        <div className="adm-user-list">
          {usuarios.map(u => (
            <div key={u.id} className="adm-user-card">
              <div className="adm-user-row">
                <div className="adm-user-avatar">{u.nombre.charAt(0).toUpperCase()}</div>
                <div className="adm-user-info">
                  <span className="adm-user-name">{u.nombre}</span>
                  <span className="adm-user-email">{u.email}</span>
                </div>
                <div className="adm-user-roles">
                  {u.roles.length === 0
                    ? <span className="adm-role-badge adm-role-badge--empty">Sin rol</span>
                    : u.roles.map(r => <span key={r.id} className="adm-role-badge">{r.codigo}</span>)
                  }
                </div>
                <button
                  className="adm-pw-btn"
                  onClick={e => openPwModal(e, u)}
                  title="Cambiar contraseña"
                >
                  <KeyRound size={15} />
                </button>
                <button
                  className="adm-delete-btn"
                  onClick={e => handleDelete(e, u)}
                  disabled={deletingId === u.id || u.id === currentUsuarioId}
                  title={u.id === currentUsuarioId ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                  style={u.id === currentUsuarioId ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                >
                  {deletingId === u.id
                    ? <Loader2 size={15} className="adm-spin" />
                    : <Trash2 size={15} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal cambio de contraseña */}
      {pwModal && (
        <div className="adm-modal-overlay" onClick={() => setPwModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div>
                <h3 className="adm-modal-title">Cambiar Contraseña</h3>
                <p className="adm-modal-sub">{pwModal.usuario.nombre} · {pwModal.usuario.email}</p>
              </div>
              <button className="adm-modal-close" onClick={() => setPwModal(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleChangePassword} className="adm-form">
              <div className="adm-form-group">
                <label className="adm-label">CONTRASEÑA ACTUAL</label>
                <input type="password" className="adm-input" placeholder="Contraseña actual"
                  value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">NUEVA CONTRASEÑA</label>
                <input type="password" className="adm-input" placeholder="Mínimo 6 caracteres"
                  value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">CONFIRMAR NUEVA CONTRASEÑA</label>
                <input type="password" className="adm-input" placeholder="Repite la nueva contraseña"
                  value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>

              {pwError && (
                <div className="adm-feedback adm-feedback--err">
                  <AlertCircle size={14} /> {pwError}
                </div>
              )}

              <div className="adm-form-actions">
                <button type="button" className="adm-btn-ghost" onClick={() => setPwModal(null)}>Cancelar</button>
                <button type="submit" className="adm-btn-primary" disabled={pwSaving}>
                  {pwSaving ? <Loader2 size={14} className="adm-spin" /> : <KeyRound size={14} />}
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
