import { useState, useEffect } from "react";
import * as api from '../api';

const DAYS = [
  { id: 'lunes', label: 'Lunes' }, { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' }, { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' }, { id: 'sabado', label: 'Sábado' },
];

function ZoneForm({ zone, onSave, onCancel }) {
  const isEdit = !!zone?.id;
  const [f, setF] = useState({
    code: '', name: '', description: '', delivery_day: 'lunes',
    postal_codes_text: '', route_order: 0,
    ...(zone ? { ...zone, postal_codes_text: (zone.postal_codes || []).join(', ') } : {})
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!f.name) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    const data = {
      code: f.code || null,
      name: f.name,
      description: f.description || '',
      delivery_day: f.delivery_day,
      postal_codes: f.postal_codes_text ? f.postal_codes_text.split(',').map(s => s.trim()).filter(Boolean) : [],
      route_order: parseInt(f.route_order) || 0,
    };
    const { error: e } = isEdit ? await api.updateZone(zone.id, data) : await api.createZone(data);
    setSaving(false);
    if (e) { setError(e.message); return; }
    onSave();
  };

  return (
    <div style={{ background: 'var(--b0)', padding: 14, borderRadius: 10, marginBottom: 10 }}>
      {error && <div className="auth-err">{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="fg" style={{ width: 80 }}><label className="fl">Código</label>
          <input className="fi" value={f.code || ''} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="ZN01" /></div>
        <div className="fg" style={{ flex: 1 }}><label className="fl">Nombre *</label>
          <input className="fi" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Antequera Norte" /></div>
        <div className="fg" style={{ width: 60 }}><label className="fl">Orden</label>
          <input className="fi" type="number" value={f.route_order} onChange={e => setF({ ...f, route_order: e.target.value })} /></div>
      </div>
      <div className="fg"><label className="fl">Descripción</label>
        <input className="fi" value={f.description || ''} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Zona norte del área de Antequera" /></div>
      <div className="fg">
        <label className="fl">Día de reparto</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DAYS.map(d => (
            <span key={d.id} className={`chip ${f.delivery_day === d.id ? 'on' : ''}`}
              style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={() => setF({ ...f, delivery_day: d.id })}>{d.label}</span>
          ))}
        </div>
      </div>
      <div className="fg"><label className="fl">Códigos postales (separados por comas)</label>
        <input className="fi" value={f.postal_codes_text || ''} onChange={e => setF({ ...f, postal_codes_text: e.target.value })} placeholder="29200, 29210, 29220" /></div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn-cancel" style={{ flex: 1, padding: 8, fontSize: 11 }} onClick={onCancel}>Cancelar</button>
        <button className="btn-confirm" style={{ flex: 1, padding: 8, fontSize: 11 }} disabled={saving} onClick={handleSave}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear zona'}
        </button>
      </div>
    </div>
  );
}

export default function ZoneManager() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await api.getZones(false);
    if (data) setZones(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    setDeleteError('');
    const { error } = await api.deleteZone(id);
    if (error) { setDeleteError(error.message); return; }
    setDeleteConfirm(null);
    load();
  };

  const dayLabel = (d) => DAYS.find(x => x.id === d)?.label || d;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div><div className="stit">Zonas de Reparto</div><div className="ssub">{zones.filter(z => z.active).length} zona{zones.filter(z => z.active).length !== 1 ? 's' : ''} activa{zones.filter(z => z.active).length !== 1 ? 's' : ''}</div></div>
        {!showForm && <button className="btn-confirm" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => { setEditZone(null); setShowForm(true); }}>+ Nueva zona</button>}
      </div>

      {showForm && <ZoneForm zone={editZone} onSave={() => { setShowForm(false); setEditZone(null); load(); }} onCancel={() => { setShowForm(false); setEditZone(null); }} />}

      {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div> :
        zones.map(z => (
          <div key={z.id} className="ro" style={{ opacity: z.active ? 1 : 0.45 }}>
            <div className="ro-top">
              <div className="ro-h">
                <div>
                  <div className="ro-client">{z.code ? `[${z.code}] ` : ''}{z.name}</div>
                  <div className="ro-id">📅 {dayLabel(z.delivery_day)} · Orden: {z.route_order}</div>
                </div>
                {!z.active && <span className="st st-pend">Inactiva</span>}
              </div>
              {z.description && <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 2 }}>{z.description}</div>}
              {z.postal_codes?.length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {z.postal_codes.map(cp => <span key={cp} style={{ fontSize: 9, background: 'var(--b0)', padding: '1px 6px', borderRadius: 4, color: 'var(--t2)' }}>{cp}</span>)}
                </div>
              )}
            </div>
            {z.active && (
              <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
                <button className="contact-btn" onClick={() => { setEditZone(z); setShowForm(true); }}>✏️ Editar</button>
                <button className="contact-btn" style={{ color: 'var(--rd)', borderColor: '#ECC' }} onClick={() => setDeleteConfirm(z.id)}>🗑️ Eliminar</button>
              </div>
            )}
          </div>
        ))
      }

      {deleteConfirm && (
        <div className="mov" onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}>
          <div className="mod" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, borderRadius: 14 }}>
            <div className="mod-h"><span className="mod-h-t">Eliminar zona</span></div>
            <div className="mod-b">
              <p style={{ fontSize: 12, marginBottom: 10 }}>¿Seguro que quieres eliminar esta zona? Solo es posible si no tiene clientes activos asignados.</p>
              {deleteError && <div className="auth-err">{deleteError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}>Cancelar</button>
                <button className="btn-confirm" style={{ flex: 1, background: 'var(--rd)' }} onClick={() => handleDelete(deleteConfirm)}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
