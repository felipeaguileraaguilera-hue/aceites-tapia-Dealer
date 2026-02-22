import { useState, useEffect, useMemo, useCallback } from "react";
import * as api from '../api';
import { FALLBACK_CATALOG, SEC_COLORS, SECTION_BG, FILTER_CATS } from '../constants';

const DAYS = [
  { id: 'lunes', label: 'Lunes' }, { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' }, { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' }, { id: 'sabado', label: 'Sábado' },
];
const FREQ_LABELS = { semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' };
const RESULT_STYLES = {
  pedido: { bg: '#E8F5E9', color: '#2E7D32', icon: '✅', label: 'Pedido realizado' },
  no_quiere: { bg: '#FFF3E0', color: '#E65100', icon: '🚫', label: 'No quiere' },
  no_contesta: { bg: '#ECEFF1', color: '#546E7A', icon: '📵', label: 'No contesta' },
};

function QuickOrderScreen({ client, catalog, driverId, onDone, onCancel }) {
  const [qty, setQty] = useState({});
  const [search, setSearch] = useState('');
  const [catF, setCatF] = useState('Todos');
  const [wantInv, setWantInv] = useState(client.wants_invoice_default ?? true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dpList, setDpList] = useState([]);
  const [selectedDP, setSelectedDP] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.getDeliveryPoints(client.id);
      if (data?.length) { setDpList(data); setSelectedDP(data.find(d => d.is_default) || data[0]); }
    })();
  }, [client.id]);

  const products = catalog.length ? catalog : FALLBACK_CATALOG;
  const sections = useMemo(() => {
    const secs = []; let cur = null;
    const af = FILTER_CATS.find(c => c.label === catF);
    products.filter(p => {
      const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const mc = !af?.match || af.match.includes(p.section);
      return ms && mc;
    }).forEach(p => {
      if (p.section !== cur) { cur = p.section; secs.push({ name: p.section, products: [] }); }
      secs[secs.length - 1].products.push(p);
    });
    return secs;
  }, [products, search, catF]);

  const cartItems = useMemo(() => Object.entries(qty).filter(([_, q]) => q > 0).map(([id, q]) => ({ product: products.find(p => p.id === id), qty: q })).filter(i => i.product), [qty, products]);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const handleQty = useCallback((id, n) => setQty(prev => { const next = { ...prev }; if (n <= 0) delete next[id]; else next[id] = n; return next; }), []);

  const submit = async () => {
    if (!cartCount) return;
    setSubmitting(true);
    const items = cartItems.map(i => ({ productId: i.product.id, qty: i.qty }));
    const { data: order, error } = await api.createOrder(client.id, items, wantInv, notes, selectedDP?.id);
    setSubmitting(false);
    if (error) { alert('Error: ' + error.message); return; }
    // Log the call as 'pedido'
    await api.logCall(client.id, driverId, 'pedido', order?.id, '');
    onDone(order?.id);
  };

  return (
    <div>
      <div style={{ background: 'var(--b0)', padding: 10, borderRadius: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{client.name}</div>
        <div style={{ fontSize: 10, color: 'var(--tm)' }}>{client.cif_nif} · {client.phone}</div>
        {dpList.length > 1 && (
          <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {dpList.map(dp => <span key={dp.id} className={`chip ${selectedDP?.id === dp.id ? 'on' : ''}`} style={{ fontSize: 9, padding: '2px 7px' }} onClick={() => setSelectedDP(dp)}>{dp.name}</span>)}
          </div>
        )}
      </div>

      <input className="fi" placeholder="🔍 Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 6 }} />
      <div className="chips" style={{ paddingBottom: 6 }}>
        {FILTER_CATS.map(c => <span key={c.label} className={`chip ${catF === c.label ? 'on' : ''}`} onClick={() => setCatF(c.label)}>{c.label}</span>)}
      </div>

      {sections.map(sec => {
        const sc = SEC_COLORS[sec.name] || { bg: '#F5F5F5', color: '#333', icon: '📦' };
        return (
          <div key={sec.name}>
            <div className="sec-h" style={{ background: sc.bg, color: sc.color }}><span>{sc.icon}</span> {sec.name}</div>
            <div className="pgrid">
              {sec.products.map(p => (
                <div key={p.id} className={`pcard ${(qty[p.id] || 0) > 0 ? 'sel' : ''}`}>
                  <div className="pc-b" style={{ padding: '8px 6px' }}>
                    <div className="pn">{p.name}</div>
                    <div className="pd">{p.description}</div>
                    {(qty[p.id] || 0) === 0
                      ? <button className="ab" onClick={() => handleQty(p.id, 1)}>+ Añadir</button>
                      : <div className="qc">
                          <button className="qb rm" onClick={() => handleQty(p.id, (qty[p.id] || 0) - 1)}>−</button>
                          <span className="qv">{qty[p.id]}</span>
                          <button className="qb" onClick={() => handleQty(p.id, (qty[p.id] || 0) + 1)}>+</button>
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {cartCount > 0 && (
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--b9)', padding: 10, borderRadius: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ color: '#fff', fontSize: 11 }}>{cartCount} caja{cartCount !== 1 ? 's' : ''} · {cartItems.length} ref.</div>
            <div className="trow" style={{ border: 'none', padding: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--b3)', marginRight: 6 }}>Factura</span>
              <button className={`tog ${wantInv ? 'on' : ''}`} onClick={() => setWantInv(!wantInv)} />
            </div>
          </div>
          <textarea className="fi" style={{ minHeight: 30, marginBottom: 6, fontSize: 10 }} placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-cancel" style={{ flex: 1, fontSize: 11 }} onClick={onCancel}>Cancelar</button>
            <button className="btn-confirm" style={{ flex: 1, background: 'var(--g5)', color: 'var(--b9)', fontSize: 11 }} disabled={submitting} onClick={submit}>
              {submitting ? 'Enviando...' : '✓ Crear pedido'}
            </button>
          </div>
        </div>
      )}
      {!cartCount && (
        <button className="btn-cancel" style={{ width: '100%', marginTop: 12 }} onClick={onCancel}>← Volver a la ronda</button>
      )}
    </div>
  );
}

function CallResultScreen({ client, driverId, onDone }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const logResult = async (result) => {
    setSaving(true);
    await api.logCall(client.id, driverId, result, null, notes);
    setSaving(false);
    onDone(result);
  };

  return (
    <div className="mov" onClick={() => onDone(null)}>
      <div className="mod" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, borderRadius: 14 }}>
        <div className="mod-h"><span className="mod-h-t">Resultado de la llamada</span></div>
        <div className="mod-b">
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{client.name}</div>
            <div style={{ fontSize: 11, color: 'var(--tm)' }}>{client.phone}</div>
          </div>
          <div className="fg"><label className="fl">Notas (opcional)</label>
            <textarea className="fi" style={{ minHeight: 40, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <button className="btn-confirm" style={{ padding: 10, fontSize: 12, background: '#E65100' }} disabled={saving} onClick={() => logResult('no_quiere')}>
              🚫 No quiere producto
            </button>
            <button className="btn-confirm" style={{ padding: 10, fontSize: 12, background: '#546E7A' }} disabled={saving} onClick={() => logResult('no_contesta')}>
              📵 No contesta
            </button>
          </div>
          <button className="btn-cancel" style={{ width: '100%', marginTop: 8, fontSize: 11 }} onClick={() => onDone(null)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryRound({ catalog, driverProfile }) {
  const [tab, setTab] = useState('round'); // round, reports
  const [selectedDay, setSelectedDay] = useState(null);
  const [roundClients, setRoundClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderingClient, setOrderingClient] = useState(null); // client being ordered for
  const [callResultClient, setCallResultClient] = useState(null);
  const [toast, setToast] = useState(null);

  // Reports state
  const [reportFilter, setReportFilter] = useState({ result: '', dateFrom: '', dateTo: '', zone_id: '' });
  const [reportData, setReportData] = useState([]);
  const [zones, setZones] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Auto-detect today's day
  useEffect(() => {
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const today = dayNames[new Date().getDay()];
    if (today !== 'domingo') setSelectedDay(today);
    else setSelectedDay('lunes');
    api.getZones().then(({ data }) => { if (data) setZones(data); });
  }, []);

  const loadRound = useCallback(async (day) => {
    if (!day) return;
    setLoading(true);
    const { data, error } = await api.getDeliveryRound(day);
    if (data) setRoundClients(data);
    else if (error) console.error(error);
    setLoading(false);
  }, []);

  useEffect(() => { if (selectedDay && tab === 'round') loadRound(selectedDay); }, [selectedDay, tab, loadRound]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCallAction = (client) => {
    if (client.has_order_today) {
      showToast('ℹ️ Este cliente ya tiene pedido hoy');
      return;
    }
    // Trigger phone call
    if (client.phone) window.open(`tel:${client.phone}`, '_self');
    // Show call result screen after a short delay
    setTimeout(() => setCallResultClient(client), 500);
  };

  const handleCallResult = async (result) => {
    setCallResultClient(null);
    if (result) {
      showToast(RESULT_STYLES[result].icon + ' ' + RESULT_STYLES[result].label);
      await loadRound(selectedDay);
    }
  };

  const handleOrderDone = async (orderId) => {
    setOrderingClient(null);
    if (orderId) {
      showToast('✅ Pedido ' + orderId + ' creado');
      await loadRound(selectedDay);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    const { data } = await api.getCallReport(reportFilter);
    if (data) setReportData(data);
    setReportLoading(false);
  };

  // If ordering for a client, show order screen
  if (orderingClient) {
    return (
      <QuickOrderScreen
        client={orderingClient} catalog={catalog}
        driverId={driverProfile?.id}
        onDone={handleOrderDone}
        onCancel={() => setOrderingClient(null)}
      />
    );
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <span className={`chip ${tab === 'round' ? 'on' : ''}`} onClick={() => setTab('round')}>📞 Ronda del día</span>
        <span className={`chip ${tab === 'reports' ? 'on' : ''}`} onClick={() => setTab('reports')}>📊 Informes de llamadas</span>
      </div>

      {/* ======================== RONDA DEL DÍA ======================== */}
      {tab === 'round' && <>
        <div className="stit">Ronda de Pedidos</div>
        <div className="ssub">Selecciona el día y llama a los clientes para registrar pedidos</div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {DAYS.map(d => {
            const isToday = d.id === ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date().getDay()];
            return (
              <span key={d.id} className={`chip ${selectedDay === d.id ? 'on' : ''}`}
                style={{ fontSize: 10, padding: '4px 10px', position: 'relative' }}
                onClick={() => setSelectedDay(d.id)}>
                {d.label}{isToday && <span style={{ fontSize: 7, position: 'absolute', top: -2, right: -2 }}>●</span>}
              </span>
            );
          })}
        </div>

        {loading ? <div className="loading"><div className="loading-spin" /><p>Cargando ronda...</p></div> : <>
          <div className="ssub" style={{ marginBottom: 8 }}>
            {roundClients.length} cliente{roundClients.length !== 1 ? 's' : ''} · {DAYS.find(d => d.id === selectedDay)?.label}
            {' · '}{roundClients.filter(c => c.has_order_today).length} con pedido
            {' · '}{roundClients.filter(c => c.last_call_result && !c.has_order_today).length} llamado{roundClients.filter(c => c.last_call_result && !c.has_order_today).length !== 1 ? 's' : ''}
          </div>

          {!roundClients.length && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--tm)' }}>
              <div style={{ fontSize: 48, opacity: 0.4, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 13 }}>No hay clientes programados para el {DAYS.find(d => d.id === selectedDay)?.label}</p>
            </div>
          )}

          {roundClients.map(c => {
            const callStyle = c.has_order_today ? RESULT_STYLES.pedido : c.last_call_result ? RESULT_STYLES[c.last_call_result] : null;
            return (
              <div key={c.client_id} className="ro" style={{ opacity: c.has_order_today ? 0.6 : 1, borderLeft: callStyle ? `4px solid ${callStyle.color}` : 'none' }}>
                <div className="ro-top">
                  <div className="ro-h">
                    <div>
                      <div className="ro-client">{c.client_name}</div>
                      <div className="ro-id">
                        {c.zone_name || 'Sin zona'} · {FREQ_LABELS[c.delivery_frequency] || c.delivery_frequency}
                        {c.last_call_result && !c.has_order_today && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px', borderRadius: 4, background: callStyle?.bg, color: callStyle?.color }}>{callStyle?.icon} {callStyle?.label}</span>}
                      </div>
                    </div>
                    {c.has_order_today && <span className="st st-dlv">✅ Pedido</span>}
                  </div>
                  {c.dp_address && <div className="ro-addr">📍 {c.dp_name ? c.dp_name + ' — ' : ''}{c.dp_address}</div>}
                  {c.contact_person && <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 2 }}>👤 {c.contact_person}</div>}
                </div>

                <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {/* Phone buttons */}
                  {c.phone && (
                    <a className="contact-btn" href={`tel:${c.phone}`} onClick={(e) => { e.preventDefault(); handleCallAction(c); }}
                      style={{ background: c.has_order_today ? '#F5F5F5' : '#E8F5E9', borderColor: '#C8E6C9', color: '#2E7D32' }}>
                      📞 {c.phone}
                    </a>
                  )}
                  {c.dp_phone && c.dp_phone !== c.phone && (
                    <a className="contact-btn" href={`tel:${c.dp_phone}`}>📞 {c.dp_phone} (punto)</a>
                  )}
                  {/* Quick order button (only if no order today) */}
                  {!c.has_order_today && (
                    <button className="contact-btn" style={{ background: '#E3F2FD', borderColor: '#BBDEFB', color: '#1565C0' }}
                      onClick={() => setOrderingClient({ id: c.client_id, name: c.client_name, phone: c.phone, cif_nif: '', wants_invoice_default: true })}>
                      📝 Crear pedido
                    </button>
                  )}
                  {/* Re-call if no_contesta */}
                  {c.last_call_result === 'no_contesta' && !c.has_order_today && (
                    <button className="contact-btn" style={{ background: '#FFF3E0', borderColor: '#FFE0B2', color: '#E65100' }}
                      onClick={() => { if (c.phone) window.open(`tel:${c.phone}`, '_self'); setTimeout(() => setCallResultClient(c), 500); }}>
                      🔄 Rellamar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>}
      </>}

      {/* ======================== INFORMES ======================== */}
      {tab === 'reports' && <>
        <div className="stit">Informes de Llamadas</div>
        <div className="ssub">Consulta el historial de llamadas y filtra por resultado, zona o periodo</div>

        <div style={{ background: 'var(--b0)', padding: 10, borderRadius: 8, marginTop: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <select className="fi" style={{ flex: 1, minWidth: 110 }} value={reportFilter.result} onChange={e => setReportFilter({ ...reportFilter, result: e.target.value })}>
              <option value="">Todos los resultados</option>
              <option value="no_quiere">🚫 No quiere</option>
              <option value="no_contesta">📵 No contesta</option>
              <option value="pedido">✅ Pedido</option>
            </select>
            <select className="fi" style={{ flex: 1, minWidth: 110 }} value={reportFilter.zone_id} onChange={e => setReportFilter({ ...reportFilter, zone_id: e.target.value })}>
              <option value="">Todas las zonas</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Desde</label>
              <input className="fi" type="date" value={reportFilter.dateFrom} onChange={e => setReportFilter({ ...reportFilter, dateFrom: e.target.value })} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Hasta</label>
              <input className="fi" type="date" value={reportFilter.dateTo} onChange={e => setReportFilter({ ...reportFilter, dateTo: e.target.value })} /></div>
          </div>
          <button className="btn-confirm" style={{ width: '100%', padding: 8, fontSize: 11 }} onClick={loadReport} disabled={reportLoading}>
            {reportLoading ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </div>

        {reportData.length > 0 && (
          <>
            <div className="ssub">{reportData.length} registro{reportData.length !== 1 ? 's' : ''}</div>
            {reportData.map((r, i) => {
              const style = RESULT_STYLES[r.result] || {};
              return (
                <div key={i} style={{ padding: '8px 10px', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 16 }}>{style.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{r.client_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--tm)' }}>
                      {new Date(r.call_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} a las {new Date(r.call_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {r.zone_name && <> · {r.zone_name}</>}
                    </div>
                    <div style={{ fontSize: 10, color: style.color, fontWeight: 500 }}>{style.label}</div>
                    {r.notes && <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 2 }}>📝 {r.notes}</div>}
                    {r.order_id && <div style={{ fontSize: 9, color: '#2E7D32', marginTop: 2 }}>Pedido: {r.order_id}</div>}
                  </div>
                </div>
              );
            })}
          </>
        )}
        {!reportLoading && reportData.length === 0 && reportFilter.dateFrom && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--tm)', fontSize: 12 }}>No se encontraron registros con estos filtros</div>
        )}
      </>}

      {/* Call result modal */}
      {callResultClient && <CallResultScreen client={callResultClient} driverId={driverProfile?.id} onDone={handleCallResult} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
