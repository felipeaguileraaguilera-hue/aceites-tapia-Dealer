import { useState, useEffect, useMemo } from "react";
import * as api from '../api';

const CLIENT_TYPES = [
  { id: 'restauracion', label: 'Restauración', desc: 'Hoteles, restaurantes, bares, cafeterías' },
  { id: 'comercio_minorista', label: 'Comercio minorista', desc: 'Supermercados, tiendas, carnicerías, fruterías' },
  { id: 'colaborador', label: 'Colaborador', desc: 'Comercios complementarios no alimentarios' },
];

function ClientForm({ client, onSave, onCancel, priceLevels, isAdmin }) {
  const isEdit = !!client?.id;
  const [f, setF] = useState({
    name: '', contact_person: '', phone: '', email: '',
    cif_nif: '', fiscal_name: '', fiscal_address: '', fiscal_city: '',
    fiscal_postal_code: '', fiscal_province: '',
    client_type: 'restauracion', client_subtype: '',
    wants_invoice_default: true, alprivawin_code: '', notes_admin: '',
    price_level_id: 'silver',
    ...(client || {})
  });
  const [sameAddress, setSameAddress] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delivery point state
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [showDPForm, setShowDPForm] = useState(false);
  const [dpForm, setDpForm] = useState({ name: '', address: '', contact_person: '', phone: '', is_default: false });

  useEffect(() => {
    if (isEdit && client?.delivery_points) setDeliveryPoints(client.delivery_points.filter(dp => dp.active !== false));
  }, [client, isEdit]);

  const handleSave = async () => {
    if (!f.name) { setError('El nombre es obligatorio'); return; }
    if (!f.cif_nif) { setError('El CIF/NIF es obligatorio'); return; }
    setSaving(true); setError('');

    // If same address, copy delivery address to fiscal
    const data = { ...f };
    if (sameAddress && !isEdit) {
      data.fiscal_address = data.address || '';
    }

    if (isEdit) {
      // Don't let driver change price_level_id
      if (!isAdmin) delete data.price_level_id;
      const { error: e } = await api.updateClient(client.id, data);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      data.price_level_id = 'silver';
      const { data: newClient, error: e } = await api.createClient(data);
      if (e) { setError(e.message); setSaving(false); return; }
      // Create default delivery point if address provided
      if (data.address && newClient) {
        await api.createDeliveryPoint({
          client_id: newClient.id, name: 'Principal', address: data.address,
          contact_person: data.contact_person, phone: data.phone,
          is_default: true, is_fiscal_address: sameAddress
        });
      }
    }
    setSaving(false);
    onSave();
  };

  const addDeliveryPoint = async () => {
    if (!dpForm.name || !dpForm.address) return;
    if (client?.id) {
      await api.createDeliveryPoint({ ...dpForm, client_id: client.id });
      const { data } = await api.getDeliveryPoints(client.id);
      if (data) setDeliveryPoints(data);
    }
    setDpForm({ name: '', address: '', contact_person: '', phone: '', is_default: false });
    setShowDPForm(false);
  };

  const removeDP = async (dpId) => {
    await api.deleteDeliveryPoint(dpId);
    setDeliveryPoints(prev => prev.filter(dp => dp.id !== dpId));
  };

  return (
    <div style={{ padding: '0 0 20px' }}>
      {error && <div className="auth-err">{error}</div>}

      {/* Client type */}
      <div className="dlv-section">
        <span className="dlv-label">Tipo de cliente</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {CLIENT_TYPES.map(t => (
            <div key={t.id} className={`doc-opt ${f.client_type === t.id ? 'sel' : ''}`}
              onClick={() => setF({ ...f, client_type: t.id })} style={{ flex: 1 }}>
              <div className="doc-lb">{t.label}</div>
              <div className="doc-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="fg"><label className="fl">Subtipo (opcional)</label>
        <input className="fi" value={f.client_subtype || ''} onChange={e => setF({ ...f, client_subtype: e.target.value })} placeholder="Ej: Hotel 4*, Bar de tapas, Frutería..." /></div>

      {/* Basic info */}
      <div className="dlv-section">
        <span className="dlv-label">Datos del establecimiento</span>
        <div className="fg"><label className="fl">Nombre comercial *</label><input className="fi" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Bar El Rincón" /></div>
        <div className="fg"><label className="fl">Persona de contacto</label><input className="fi" value={f.contact_person || ''} onChange={e => setF({ ...f, contact_person: e.target.value })} placeholder="Antonio López" /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="fg" style={{ flex: 1 }}><label className="fl">Teléfono</label><input className="fi" type="tel" value={f.phone || ''} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="654 321 987" /></div>
          <div className="fg" style={{ flex: 1 }}><label className="fl">Email</label><input className="fi" type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} placeholder="correo@email.com" /></div>
        </div>
        <div className="fg"><label className="fl">Dirección del establecimiento</label><input className="fi" value={f.address || ''} onChange={e => setF({ ...f, address: e.target.value })} placeholder="C/ Real 14, Villanueva de Tapia" /></div>
      </div>

      {/* Fiscal data */}
      <div className="dlv-section">
        <span className="dlv-label">Datos fiscales</span>
        <div className="fg"><label className="fl">CIF / NIF *</label><input className="fi" value={f.cif_nif || ''} onChange={e => setF({ ...f, cif_nif: e.target.value.toUpperCase() })} placeholder="B12345678" /></div>
        <div className="fg"><label className="fl">Razón social</label><input className="fi" value={f.fiscal_name || ''} onChange={e => setF({ ...f, fiscal_name: e.target.value })} placeholder="Restaurante El Rincón S.L." /></div>

        <div className="trow" style={{ borderBottom: 'none', padding: '6px 0' }}>
          <div><div className="tl" style={{ fontSize: 11 }}>Domicilio fiscal = Dirección del establecimiento</div></div>
          <button className={`tog ${sameAddress ? 'on' : ''}`} onClick={() => setSameAddress(!sameAddress)} />
        </div>

        {!sameAddress && <>
          <div className="fg"><label className="fl">Domicilio fiscal</label><input className="fi" value={f.fiscal_address || ''} onChange={e => setF({ ...f, fiscal_address: e.target.value })} placeholder="C/ Fiscal 1" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="fg" style={{ flex: 2 }}><label className="fl">Ciudad</label><input className="fi" value={f.fiscal_city || ''} onChange={e => setF({ ...f, fiscal_city: e.target.value })} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">C.P.</label><input className="fi" value={f.fiscal_postal_code || ''} onChange={e => setF({ ...f, fiscal_postal_code: e.target.value })} /></div>
          </div>
          <div className="fg"><label className="fl">Provincia</label><input className="fi" value={f.fiscal_province || ''} onChange={e => setF({ ...f, fiscal_province: e.target.value })} /></div>
        </>}
      </div>

      {/* Internal fields */}
      <div className="dlv-section">
        <span className="dlv-label">Datos internos</span>
        <div className="fg"><label className="fl">Código Alprivawin</label><input className="fi" value={f.alprivawin_code || ''} onChange={e => setF({ ...f, alprivawin_code: e.target.value })} placeholder="Código CRM" /></div>
        <div className="fg"><label className="fl">Notas internas</label><textarea className="fi" style={{ minHeight: 50, resize: 'vertical' }} value={f.notes_admin || ''} onChange={e => setF({ ...f, notes_admin: e.target.value })} placeholder="Notas visibles solo para admin/repartidor" /></div>
        <div className="trow" style={{ borderBottom: 'none', padding: '6px 0' }}>
          <div><div className="tl" style={{ fontSize: 11 }}>Factura por defecto</div></div>
          <button className={`tog ${f.wants_invoice_default ? 'on' : ''}`} onClick={() => setF({ ...f, wants_invoice_default: !f.wants_invoice_default })} />
        </div>
        {isAdmin && (
          <div className="fg"><label className="fl">Nivel de tarifa</label>
            <select className="fi" value={f.price_level_id || 'silver'} onChange={e => setF({ ...f, price_level_id: e.target.value })}>
              {(priceLevels || []).map(pl => <option key={pl.id} value={pl.id}>{pl.name} ({pl.discount_pct}%)</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Delivery points (only in edit mode) */}
      {isEdit && (
        <div className="dlv-section">
          <span className="dlv-label">Puntos de entrega</span>
          {deliveryPoints.map(dp => (
            <div key={dp.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E8E8E8' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{dp.name} {dp.is_default && <span style={{ fontSize: 9, color: 'var(--b5)', background: 'var(--b0)', padding: '1px 6px', borderRadius: 4 }}>Por defecto</span>}</div>
                <div style={{ fontSize: 10, color: 'var(--tm)' }}>{dp.address}</div>
              </div>
              <button onClick={() => removeDP(dp.id)} style={{ background: 0, border: 'none', color: 'var(--rd)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          ))}
          {!showDPForm ? (
            <button className="add-prod-btn" onClick={() => setShowDPForm(true)}>+ Añadir punto de entrega</button>
          ) : (
            <div style={{ background: 'var(--b0)', padding: 10, borderRadius: 8, marginTop: 8 }}>
              <div className="fg"><label className="fl">Nombre</label><input className="fi" value={dpForm.name} onChange={e => setDpForm({ ...dpForm, name: e.target.value })} placeholder="Terraza, Almacén..." /></div>
              <div className="fg"><label className="fl">Dirección</label><input className="fi" value={dpForm.address} onChange={e => setDpForm({ ...dpForm, address: e.target.value })} placeholder="C/ Nueva 5" /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="fg" style={{ flex: 1 }}><label className="fl">Contacto</label><input className="fi" value={dpForm.contact_person} onChange={e => setDpForm({ ...dpForm, contact_person: e.target.value })} /></div>
                <div className="fg" style={{ flex: 1 }}><label className="fl">Teléfono</label><input className="fi" value={dpForm.phone} onChange={e => setDpForm({ ...dpForm, phone: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-confirm" style={{ flex: 1, padding: 8, fontSize: 11 }} onClick={addDeliveryPoint}>Guardar punto</button>
                <button className="btn-cancel" style={{ padding: 8, fontSize: 11 }} onClick={() => setShowDPForm(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="act-row" style={{ marginTop: 16 }}>
        <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
        <button className="btn-confirm" disabled={saving} onClick={handleSave}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
      </div>
    </div>
  );
}

export default function ClientManager({ isAdmin }) {
  const [clients, setClients] = useState([]);
  const [priceLevels, setPriceLevels] = useState([]);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState('list'); // list, form, detail
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivateId, setDeactivateId] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');

  const loadClients = async () => {
    setLoading(true);
    const { data } = await api.getAllClients(!showInactive);
    if (data) setClients(data);
    const { data: pl } = await api.getPriceLevels();
    if (pl) setPriceLevels(pl);
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, [showInactive]);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter(c => c.name?.toLowerCase().includes(s) || c.cif_nif?.toLowerCase().includes(s) || c.contact_person?.toLowerCase().includes(s) || c.alprivawin_code?.toLowerCase().includes(s));
  }, [clients, search]);

  const typeLabels = { restauracion: '🍽️ Restauración', comercio_minorista: '🛒 Comercio', colaborador: '🤝 Colaborador' };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    await api.setClientInactive(deactivateId, deactivateReason);
    setDeactivateId(null); setDeactivateReason('');
    await loadClients();
  };

  const handleReactivate = async (id) => {
    await api.reactivateClient(id);
    await loadClients();
  };

  if (view === 'form') {
    return (
      <>
        <div className="stit">{selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}</div>
        <div className="ssub">{selectedClient ? selectedClient.name : 'Completa los datos del nuevo cliente'}</div>
        <ClientForm client={selectedClient} priceLevels={priceLevels} isAdmin={isAdmin}
          onSave={() => { setView('list'); setSelectedClient(null); loadClients(); }}
          onCancel={() => { setView('list'); setSelectedClient(null); }} />
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><div className="stit">Clientes</div><div className="ssub">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</div></div>
        <button className="btn-confirm" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => { setSelectedClient(null); setView('form'); }}>+ Nuevo</button>
      </div>

      <input className="fi" style={{ marginBottom: 8 }} placeholder="🔍 Buscar por nombre, CIF, contacto, código..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="trow" style={{ borderBottom: 'none', padding: '4px 0', marginBottom: 8 }}>
        <div className="tl" style={{ fontSize: 10 }}>Mostrar clientes inactivos</div>
        <button className={`tog ${showInactive ? '' : 'on'}`} onClick={() => setShowInactive(!showInactive)} />
      </div>

      {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando...</p></div> :
        filtered.map(c => (
          <div key={c.id} className="ro" style={{ opacity: c.is_active === false ? 0.5 : 1 }}>
            <div className="ro-top" onClick={() => { setSelectedClient(c); setView('form'); }}>
              <div className="ro-h">
                <div>
                  <div className="ro-client">{c.name}</div>
                  <div className="ro-id">{c.cif_nif || 'Sin CIF'} · {typeLabels[c.client_type] || c.client_type} · {c.price_levels?.name || 'Silver'}</div>
                </div>
                {c.is_active === false && <span className="st st-pend">Inactivo</span>}
              </div>
              {c.contact_person && <div style={{ fontSize: 11, color: 'var(--t2)' }}>👤 {c.contact_person} {c.phone && `· 📞 ${c.phone}`}</div>}
              {c.address && <div className="ro-addr">📍 {c.address}</div>}
              {c.delivery_points?.length > 1 && <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 2 }}>{c.delivery_points.filter(dp => dp.active !== false).length} puntos de entrega</div>}
            </div>
            <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
              {c.is_active !== false ? (
                <button className="contact-btn" style={{ color: 'var(--rd)', borderColor: '#ECC' }} onClick={(e) => { e.stopPropagation(); setDeactivateId(c.id); }}>Dar de baja</button>
              ) : (
                <button className="contact-btn" onClick={(e) => { e.stopPropagation(); handleReactivate(c.id); }}>Reactivar</button>
              )}
              {c.phone && <a className="contact-btn" href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}>📞 Llamar</a>}
            </div>
          </div>
        ))
      }

      {/* Deactivation modal */}
      {deactivateId && (
        <div className="mov" onClick={() => setDeactivateId(null)}>
          <div className="mod" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 14 }}>
            <div className="mod-h"><span className="mod-h-t">Dar de baja cliente</span></div>
            <div className="mod-b">
              <div className="fg"><label className="fl">Motivo de baja</label>
                <textarea className="fi" style={{ minHeight: 60, resize: 'vertical' }} value={deactivateReason} onChange={e => setDeactivateReason(e.target.value)} placeholder="Indica el motivo..." /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setDeactivateId(null)}>Cancelar</button>
                <button className="btn-confirm" style={{ flex: 1, background: 'var(--rd)' }} onClick={handleDeactivate}>Confirmar baja</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
