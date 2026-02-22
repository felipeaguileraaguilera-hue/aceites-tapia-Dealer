import { useState, useEffect, useMemo } from "react";
import * as api from '../api';

const DAYS = [
  { id: 'lunes', label: 'Lun' }, { id: 'martes', label: 'Mar' },
  { id: 'miercoles', label: 'Mié' }, { id: 'jueves', label: 'Jue' },
  { id: 'viernes', label: 'Vie' }, { id: 'sabado', label: 'Sáb' },
];
const CLIENT_TYPES = [
  { id: '', label: 'Todos' },
  { id: 'restauracion', label: 'Restauración' },
  { id: 'comercio_minorista', label: 'Comercio' },
  { id: 'colaborador', label: 'Colaborador' },
];
const FREQ_OPTS = [
  { id: '', label: 'Todas' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'quincenal', label: 'Quincenal' },
  { id: 'mensual', label: 'Mensual' },
];

export default function BulkOperations() {
  const [mode, setMode] = useState(null); // 'zone', 'frequency', 'deactivate'
  const [zones, setZones] = useState([]);
  const [levels, setLevels] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Filters
  const [fZone, setFZone] = useState('');
  const [fType, setFType] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [fFreq, setFFreq] = useState('');
  const [fSearch, setFSearch] = useState('');

  // Bulk action values
  const [newZoneId, setNewZoneId] = useState('');
  const [newFreq, setNewFreq] = useState('semanal');
  const [deactivateReason, setDeactivateReason] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: z }, { data: l }] = await Promise.all([api.getZones(), api.getPriceLevels()]);
      if (z) setZones(z);
      if (l) setLevels(l);
    })();
  }, []);

  const loadClients = async () => {
    setLoading(true); setSelected(new Set()); setSelectAll(false);
    const filters = {};
    if (fZone) filters.zone_id = fZone;
    if (fType) filters.client_type = fType;
    if (fLevel) filters.price_level_id = fLevel;
    if (fFreq) filters.delivery_frequency = fFreq;
    if (mode !== 'deactivate') filters.is_active = true;
    const { data } = await api.getClientsFiltered(filters);
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { if (mode) loadClients(); }, [mode, fZone, fType, fLevel, fFreq]);

  const filtered = useMemo(() => {
    if (!fSearch) return clients;
    const s = fSearch.toLowerCase();
    return clients.filter(c => c.name?.toLowerCase().includes(s) || c.cif_nif?.toLowerCase().includes(s));
  }, [clients, fSearch]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(false);
  };

  const toggleAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false); }
    else { setSelected(new Set(filtered.map(c => c.id))); setSelectAll(true); }
  };

  const executeBulk = async () => {
    if (!selected.size) return;
    setLoading(true); setResult(null);
    const ids = Array.from(selected);
    let res;
    if (mode === 'zone' && newZoneId) {
      res = await api.bulkUpdateClients(ids, { zone_id: newZoneId });
    } else if (mode === 'frequency') {
      res = await api.bulkUpdateClients(ids, { delivery_frequency: newFreq });
    } else if (mode === 'deactivate') {
      res = await api.bulkDeactivateClients(ids, deactivateReason);
    }
    setResult(res);
    setLoading(false);
    if (res?.success > 0) loadClients();
  };

  const getZoneName = (zid) => zones.find(z => z.id === zid)?.name || '—';
  const getDayFromZone = (zid) => {
    const z = zones.find(z2 => z2.id === zid);
    return z ? DAYS.find(d => d.id === z.delivery_day)?.label || z.delivery_day : '—';
  };

  if (!mode) {
    return (
      <>
        <div className="stit">Operaciones en Bloque</div>
        <div className="ssub">Selecciona la operación que deseas realizar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <div className="ro" style={{ cursor: 'pointer' }} onClick={() => setMode('zone')}>
            <div className="ro-top">
              <div className="ro-client">🗺️ Cambiar zona de clientes</div>
              <div className="ro-id">Reasignar clientes a otra zona (cambia su día de reparto)</div>
            </div>
          </div>
          <div className="ro" style={{ cursor: 'pointer' }} onClick={() => setMode('frequency')}>
            <div className="ro-top">
              <div className="ro-client">🔄 Cambiar frecuencia de reparto</div>
              <div className="ro-id">Modificar la frecuencia (semanal/quincenal/mensual) en bloque</div>
            </div>
          </div>
          <div className="ro" style={{ cursor: 'pointer' }} onClick={() => setMode('deactivate')}>
            <div className="ro-top">
              <div className="ro-client" style={{ color: 'var(--rd)' }}>⛔ Dar de baja clientes</div>
              <div className="ro-id">Pasar clientes a estado pasivo con un motivo común</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const modeTitle = { zone: '🗺️ Cambiar zona en bloque', frequency: '🔄 Cambiar frecuencia en bloque', deactivate: '⛔ Dar de baja en bloque' };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div className="stit" style={{ fontSize: 15 }}>{modeTitle[mode]}</div><div className="ssub">Filtra y selecciona los clientes afectados</div></div>
        <button className="btn-cancel" style={{ padding: '6px 12px', fontSize: 10 }} onClick={() => { setMode(null); setResult(null); }}>← Volver</button>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--b0)', padding: 10, borderRadius: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', marginBottom: 6 }}>Filtros</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <select className="fi" style={{ flex: 1, minWidth: 120 }} value={fZone} onChange={e => setFZone(e.target.value)}>
            <option value="">Todas las zonas</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({DAYS.find(d => d.id === z.delivery_day)?.label})</option>)}
          </select>
          <select className="fi" style={{ flex: 1, minWidth: 100 }} value={fType} onChange={e => setFType(e.target.value)}>
            {CLIENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select className="fi" style={{ flex: 1, minWidth: 100 }} value={fLevel} onChange={e => setFLevel(e.target.value)}>
            <option value="">Todos los niveles</option>
            {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select className="fi" style={{ flex: 1, minWidth: 100 }} value={fFreq} onChange={e => setFFreq(e.target.value)}>
            {FREQ_OPTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <input className="fi" placeholder="🔍 Buscar por nombre o CIF..." value={fSearch} onChange={e => setFSearch(e.target.value)} />
      </div>

      {/* Action config */}
      <div style={{ background: '#FFFDE7', padding: 10, borderRadius: 8, marginBottom: 10, border: '1px solid #FFF9C4' }}>
        {mode === 'zone' && (
          <div className="fg"><label className="fl" style={{ fontWeight: 700 }}>Nueva zona a asignar:</label>
            <select className="fi" value={newZoneId} onChange={e => setNewZoneId(e.target.value)}>
              <option value="">— Selecciona zona —</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name} (📅 {DAYS.find(d => d.id === z.delivery_day)?.label})</option>)}
            </select>
          </div>
        )}
        {mode === 'frequency' && (
          <div className="fg"><label className="fl" style={{ fontWeight: 700 }}>Nueva frecuencia:</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['semanal', 'quincenal', 'mensual'].map(f => (
                <span key={f} className={`chip ${newFreq === f ? 'on' : ''}`} style={{ fontSize: 11, padding: '5px 14px' }} onClick={() => setNewFreq(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}
        {mode === 'deactivate' && (
          <div className="fg"><label className="fl" style={{ fontWeight: 700, color: 'var(--rd)' }}>Motivo de baja:</label>
            <textarea className="fi" style={{ minHeight: 50, resize: 'vertical' }} value={deactivateReason} onChange={e => setDeactivateReason(e.target.value)} placeholder="Indica el motivo de baja para todos los seleccionados..." />
          </div>
        )}
      </div>

      {/* Client list with checkboxes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '2px solid var(--b3)' }}>
        <input type="checkbox" checked={selectAll} onChange={toggleAll} style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>
          {selected.size > 0 ? `${selected.size} de ${filtered.length} seleccionado${selected.size !== 1 ? 's' : ''}` : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div> :
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}
              onClick={() => toggleSelect(c.id)}>
              <input type="checkbox" checked={selected.has(c.id)} readOnly style={{ width: 15, height: 15, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 9, color: 'var(--tm)' }}>
                  {c.cif_nif || '—'} · {c.zones?.name || 'Sin zona'} ({getDayFromZone(c.zone_id)}) · {c.delivery_frequency} · {c.price_levels?.name || 'Silver'}
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--tm)', fontSize: 12 }}>No hay clientes con estos filtros</div>}
        </div>
      }

      {/* Result toast */}
      {result && (
        <div style={{ background: result.errors?.length ? '#FFF3E0' : '#E8F5E9', padding: 10, borderRadius: 8, marginTop: 10, fontSize: 11 }}>
          ✅ {result.success} actualizado{result.success !== 1 ? 's' : ''} correctamente.
          {result.errors?.length > 0 && <span style={{ color: 'var(--rd)' }}> ⚠️ {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}.</span>}
        </div>
      )}

      {/* Execute button */}
      {selected.size > 0 && (
        <div style={{ position: 'sticky', bottom: 0, background: mode === 'deactivate' ? 'var(--rd)' : 'var(--b9)', padding: '10px 14px', marginTop: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 12 }}>{selected.size} cliente{selected.size !== 1 ? 's' : ''}</div>
          <button className="btn-confirm" style={{ background: mode === 'deactivate' ? '#fff' : 'var(--g5)', color: mode === 'deactivate' ? 'var(--rd)' : 'var(--b9)' }}
            disabled={loading || (mode === 'zone' && !newZoneId) || (mode === 'deactivate' && !deactivateReason)}
            onClick={executeBulk}>
            {loading ? 'Procesando...' : mode === 'deactivate' ? '⛔ Dar de baja' : '✓ Aplicar cambios'}
          </button>
        </div>
      )}
    </>
  );
}
