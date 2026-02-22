import { useState, useMemo, useCallback, useEffect } from "react";
import * as api from '../api';
import { FALLBACK_CATALOG, SEC_COLORS, SECTION_BG, FILTER_CATS } from '../constants';

function ProductImage({ src, section }) {
  const [failed, setFailed] = useState(false);
  const emojis = { "PET Filtrado":"📦🫒","Vidrio Filtrado":"🍶🫒","PET Sin Filtrar":"📦🌿","Monodosis AOVE":"🔸","Vidrio Sin Filtrar":"🍶🌿","Verde Oleum":"🌿","Delirium":"✨" };
  if (failed) return <div className="pimg-fb" style={{ background: SECTION_BG[section] || "#F5F5F5" }}>{emojis[section] || "🫒"}</div>;
  return <img className="pimg" src={src} alt="" loading="lazy" onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
}

export default function CreateOrder({ catalog, onDone }) {
  const [step, setStep] = useState('client'); // client, order, confirm, success
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [selectedDP, setSelectedDP] = useState(null);
  const [qty, setQty] = useState({});
  const [search, setSearch] = useState('');
  const [catF, setCatF] = useState('Todos');
  const [wantInv, setWantInv] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [searching, setSearching] = useState(false);

  // Client search with debounce
  useEffect(() => {
    if (clientSearch.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await api.searchClients(clientSearch);
      if (data) setSearchResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  const selectClient = async (client) => {
    setSelectedClient(client);
    setWantInv(client.wants_invoice_default ?? true);
    const { data: dps } = await api.getDeliveryPoints(client.id);
    if (dps?.length) {
      setDeliveryPoints(dps);
      setSelectedDP(dps.find(dp => dp.is_default) || dps[0]);
    }
    setStep('order');
  };

  const products = catalog.length ? catalog : FALLBACK_CATALOG;

  const sections = useMemo(() => {
    const secs = []; let cur = null;
    const af = FILTER_CATS.find(c => c.label === catF);
    products.filter(p => {
      const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase());
      const mc = !af?.match || af.match.includes(p.section);
      return ms && mc;
    }).forEach(p => {
      if (p.section !== cur) { cur = p.section; secs.push({ name: p.section, products: [] }); }
      secs[secs.length - 1].products.push(p);
    });
    return secs;
  }, [products, search, catF]);

  const cartItems = useMemo(() => Object.entries(qty).filter(([_, q]) => q > 0).map(([id, q]) => ({ product: products.find(p => p.id === id), qty: q })).filter(i => i.product), [qty, products]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);

  const handleQty = useCallback((id, n) => setQty(prev => { const next = { ...prev }; if (n <= 0) delete next[id]; else next[id] = n; return next; }), []);

  const submitOrder = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    const items = cartItems.map(i => ({ productId: i.product.id, qty: i.qty }));
    const { data, error } = await api.createOrder(selectedClient.id, items, wantInv, notes, selectedDP?.id);
    setSubmitting(false);
    if (error) { alert('Error: ' + error.message); return; }
    setLastOrderId(data.id);
    setStep('success');
  };

  // STEP 1: Select client
  if (step === 'client') {
    return (
      <>
        <div className="stit">Nuevo Pedido</div>
        <div className="ssub">Busca el cliente por nombre, CIF o código</div>
        <input className="fi" placeholder="🔍 Buscar cliente..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} autoFocus />
        {searching && <div style={{ padding: 10, textAlign: 'center', color: 'var(--tm)', fontSize: 11 }}>Buscando...</div>}
        <div style={{ marginTop: 8 }}>
          {searchResults.map(c => (
            <div key={c.id} className="ro" style={{ marginBottom: 6 }}>
              <div className="ro-top" onClick={() => selectClient(c)}>
                <div className="ro-client">{c.name}</div>
                <div className="ro-id">{c.cif_nif || ''} · {c.price_levels?.name || 'Silver'} {c.contact_person && `· ${c.contact_person}`}</div>
                {c.address && <div className="ro-addr">📍 {c.address}</div>}
              </div>
            </div>
          ))}
          {clientSearch.length >= 2 && !searching && !searchResults.length && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--tm)', fontSize: 12 }}>No se encontraron clientes</div>
          )}
        </div>
        <button className="btn-cancel" style={{ width: '100%', marginTop: 12 }} onClick={onDone}>Cancelar</button>
      </>
    );
  }

  // STEP SUCCESS
  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <div className="stit">¡Pedido creado!</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16 }}>
          Pedido <strong>{lastOrderId}</strong> para <strong>{selectedClient?.name}</strong>
        </div>
        <button className="btn-confirm" style={{ padding: '10px 24px', marginBottom: 8 }} onClick={() => { setQty({}); setNotes(''); setSelectedClient(null); setStep('client'); }}>Crear otro pedido</button>
        <div style={{ height: 6 }} />
        <button className="btn-cancel" style={{ padding: '10px 24px' }} onClick={onDone}>Volver</button>
      </div>
    );
  }

  // STEP 2: Select products (same as client app but with client header)
  return (
    <>
      {/* Client header */}
      <div style={{ background: 'var(--b0)', padding: 10, borderRadius: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedClient.name}</div>
            <div style={{ fontSize: 10, color: 'var(--tm)' }}>{selectedClient.cif_nif} · {selectedClient.price_levels?.name || 'Silver'}</div>
          </div>
          <button style={{ background: 0, border: 'none', fontSize: 10, color: 'var(--b6)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }} onClick={() => { setStep('client'); setSelectedClient(null); setQty({}); }}>Cambiar</button>
        </div>
        {deliveryPoints.length > 1 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', marginBottom: 3 }}>Punto de entrega</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {deliveryPoints.map(dp => (
                <span key={dp.id} className={`chip ${selectedDP?.id === dp.id ? 'on' : ''}`} style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => setSelectedDP(dp)}>{dp.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="stit" style={{ fontSize: 15 }}>Seleccionar productos</div>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input className="fi" placeholder="🔍 Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="chips" style={{ paddingBottom: 8 }}>
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
                  <div className="pimg-w" style={{ background: SECTION_BG[p.section] || '#FAF6EF' }}>
                    {(qty[p.id] || 0) > 0 && <span className="psel-b">×{qty[p.id]}</span>}
                    <ProductImage src={p.image_url} section={p.section} />
                  </div>
                  <div className="pc-b">
                    <div className="pn">{p.name}</div>
                    <div className="pd">{p.description}</div>
                    {p.base_price > 0 && <div style={{ fontSize: 9, color: 'var(--b5)', fontWeight: 600, marginBottom: 3 }}>{p.base_price?.toFixed(2)}€</div>}
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

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--b9)', padding: '10px 14px', marginTop: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--b3)' }}>{cartCount} caja{cartCount !== 1 ? 's' : ''}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#fff' }}>{cartItems.length} ref.</div>
          </div>
          <button className="btn-confirm" style={{ background: 'var(--g5)', color: 'var(--b9)' }} onClick={() => setStep('confirm')}>Revisar →</button>
        </div>
      )}

      {/* Confirm modal */}
      {step === 'confirm' && (
        <div className="mov" onClick={() => setStep('order')}>
          <div className="mod" onClick={e => e.stopPropagation()} style={{ borderRadius: 14 }}>
            <div className="mod-h"><span className="mod-h-t">Confirmar Pedido</span></div>
            <div className="mod-b">
              <div style={{ background: 'var(--b0)', padding: 8, borderRadius: 8, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{selectedClient.name}</div>
                {selectedDP && <div style={{ fontSize: 10, color: 'var(--tm)' }}>📍 {selectedDP.name} — {selectedDP.address}</div>}
              </div>
              {cartItems.map(i => (
                <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F5F5F5', fontSize: 11 }}>
                  <span>{i.product.name}</span>
                  <span style={{ color: 'var(--tm)' }}>{i.qty} {i.qty === 1 ? 'caja' : 'cajas'}</span>
                </div>
              ))}
              <div className="div" />
              <div className="trow" style={{ borderBottom: 'none' }}>
                <div className="tl" style={{ fontSize: 11 }}>Solicitar factura</div>
                <button className={`tog ${wantInv ? 'on' : ''}`} onClick={() => setWantInv(!wantInv)} />
              </div>
              <div className="fg" style={{ marginTop: 6 }}><label className="fl">Notas</label>
                <textarea className="fi" style={{ minHeight: 40, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas para la entrega..." /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setStep('order')}>Volver</button>
                <button className="btn-confirm" style={{ flex: 1 }} disabled={submitting} onClick={submitOrder}>{submitting ? 'Enviando...' : '✓ Crear Pedido'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
