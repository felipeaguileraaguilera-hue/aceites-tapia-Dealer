import { useState, useEffect } from "react";
import * as api from '../api';

function PriceLevelCard({ level, onSave }) {
  const [editing, setEditing] = useState(false);
  const [pct, setPct] = useState(level.discount_pct || 0);
  const [desc, setDesc] = useState(level.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.updatePriceLevel(level.id, { discount_pct: parseFloat(pct) || 0, description: desc });
    setSaving(false); setEditing(false); onSave();
  };

  const colors = { silver: '#9E9E9E', gold: '#FFC107', platinum: '#7C4DFF', distribuidor: '#4CAF50' };

  return (
    <div className="ro" style={{ borderLeft: `4px solid ${colors[level.id] || '#CCC'}` }}>
      <div className="ro-top">
        <div className="ro-h">
          <div>
            <div className="ro-client">{level.name}</div>
            <div className="ro-id">{level.description}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: colors[level.id] }}>{level.discount_pct}%</div>
            <div style={{ fontSize: 9, color: 'var(--tm)' }}>descuento</div>
          </div>
        </div>
      </div>
      {!editing ? (
        <div style={{ padding: '0 14px 10px' }}>
          <button className="contact-btn" onClick={() => setEditing(true)}>✏️ Editar</button>
        </div>
      ) : (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="fg" style={{ width: 100 }}><label className="fl">% Descuento</label>
              <input className="fi" type="number" step="0.5" min="0" max="100" value={pct} onChange={e => setPct(e.target.value)} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Descripción</label>
              <input className="fi" value={desc} onChange={e => setDesc(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: 11 }} onClick={() => setEditing(false)}>Cancelar</button>
            <button className="btn-confirm" style={{ padding: '6px 14px', fontSize: 11 }} disabled={saving} onClick={handleSave}>{saving ? '...' : 'Guardar'}</button>
          </div>
          {level.id !== 'distribuidor' && (
            <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 6 }}>
              Ejemplo: producto de 30€ base → cliente paga {(30 * (1 - (parseFloat(pct) || 0) / 100)).toFixed(2)}€
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VolumeTierEditor({ tiers: initialTiers, levels, onSave }) {
  const [tiers, setTiers] = useState(initialTiers.length ? initialTiers : [{ min_amount: 0, max_amount: '', extra_discount_pct: 0, suggested_level: 'silver' }]);
  const [saving, setSaving] = useState(false);

  const update = (idx, field, val) => {
    const next = [...tiers];
    next[idx] = { ...next[idx], [field]: val };
    setTiers(next);
  };

  const addTier = () => {
    const lastMax = tiers.length ? (parseFloat(tiers[tiers.length - 1].max_amount) || 0) : 0;
    setTiers([...tiers, { min_amount: lastMax + 1, max_amount: '', extra_discount_pct: 0, suggested_level: 'silver' }]);
  };

  const removeTier = (idx) => setTiers(tiers.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    const clean = tiers.map(t => ({
      min_amount: parseFloat(t.min_amount) || 0,
      max_amount: t.max_amount ? parseFloat(t.max_amount) : null,
      extra_discount_pct: parseFloat(t.extra_discount_pct) || 0,
      suggested_level: t.suggested_level || null,
    }));
    await api.upsertVolumeTiers(clean);
    setSaving(false); onSave();
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="stit" style={{ fontSize: 15 }}>Tramos de Volumen Anual</div>
      <div className="ssub">Descuento adicional según facturación acumulada del año</div>

      {tiers.map((t, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-end', padding: '6px 0', borderBottom: '1px solid #F0F0F0' }}>
          <div className="fg" style={{ width: 90 }}><label className="fl">Desde (€)</label>
            <input className="fi" type="number" value={t.min_amount} onChange={e => update(idx, 'min_amount', e.target.value)} /></div>
          <div className="fg" style={{ width: 90 }}><label className="fl">Hasta (€)</label>
            <input className="fi" type="number" value={t.max_amount || ''} onChange={e => update(idx, 'max_amount', e.target.value)} placeholder="∞" /></div>
          <div className="fg" style={{ width: 70 }}><label className="fl">% Dto.</label>
            <input className="fi" type="number" step="0.5" value={t.extra_discount_pct} onChange={e => update(idx, 'extra_discount_pct', e.target.value)} /></div>
          <div className="fg" style={{ flex: 1 }}><label className="fl">Nivel sugerido</label>
            <select className="fi" value={t.suggested_level || ''} onChange={e => update(idx, 'suggested_level', e.target.value)}>
              <option value="">—</option>
              {levels.filter(l => l.id !== 'distribuidor').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <button onClick={() => removeTier(idx)} style={{ background: 0, border: 'none', color: 'var(--rd)', cursor: 'pointer', fontSize: 16, padding: '6px', marginBottom: 4 }}>✕</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button className="add-prod-btn" style={{ flex: 1 }} onClick={addTier}>+ Añadir tramo</button>
        <button className="btn-confirm" style={{ padding: '8px 16px', fontSize: 11 }} disabled={saving} onClick={handleSave}>{saving ? 'Guardando...' : 'Guardar tramos'}</button>
      </div>
    </div>
  );
}

export default function PriceLevelManager() {
  const [levels, setLevels] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: l }, { data: t }] = await Promise.all([api.getPriceLevels(), api.getVolumeTiers()]);
    if (l) setLevels(l);
    if (t) setTiers(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div>;

  return (
    <>
      <div className="stit">Niveles de Tarifa</div>
      <div className="ssub">Define el % de descuento sobre la tarifa base para cada nivel HORECA</div>
      {levels.map(l => <PriceLevelCard key={l.id} level={l} onSave={load} />)}
      <VolumeTierEditor tiers={tiers} levels={levels} onSave={load} />
    </>
  );
}
