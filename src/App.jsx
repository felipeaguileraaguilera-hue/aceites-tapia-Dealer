import { useState, useCallback, useMemo, useEffect } from "react";
import * as api from './api';
import { FALLBACK_CATALOG } from './constants';
import ClientManager from './components/ClientManager';
import CreateOrder from './components/CreateOrder';
import AdminPanel from './components/AdminPanel';
import DeliveryRound from './components/DeliveryRound';
import LoadDocument from './components/LoadDocument';
import './styles.css';

if (!document.querySelector('link[data-rep-font]')) {
  const fl = document.createElement("link");
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  fl.rel = "stylesheet"; fl.setAttribute("data-rep-font","1"); document.head.appendChild(fl);
}

const PAYMENT_OPTS = [
  { id:"efectivo", icon:"\u{1F4B6}", label:"Efectivo" },
  { id:"tarjeta", icon:"\u{1F4B3}", label:"Tarjeta" },
  { id:"transferencia", icon:"\u{1F3E6}", label:"Transferencia" },
  { id:"pendiente", icon:"\u23F3", label:"No pagado" },
];
const DOC_OPTS = [
  { id:"nota", label:"Nota de entrega", desc:"Sin datos fiscales" },
  { id:"factura", label:"Factura", desc:"Con datos fiscales" },
  { id:"ambas", label:"Ambas", desc:"Nota + Factura" },
];

function EditableItem({ item, catalog, onChange, onRemove }) {
  const p = catalog.find(c => c.id === item.productId);
  if (!p) return null;
  return (
    <div className="ei">
      <div style={{flex:1}}><div className="ei-name">{p.name}</div><div className="ei-desc">{p.description}</div></div>
      <div className="ei-qc">
        <button className="ei-qb rm" onClick={() => item.qty <= 1 ? onRemove(item.productId) : onChange(item.productId, item.qty-1)}>{"\u2212"}</button>
        <span className="ei-qv">{item.qty}</span>
        <button className="ei-qb" onClick={() => onChange(item.productId, item.qty+1)}>+</button>
      </div>
    </div>
  );
}

function AddProductModal({ open, onClose, onAdd, existingIds, catalog }) {
  const [search, setSearch] = useState("");
  const available = useMemo(() => catalog.filter(p => !existingIds.includes(p.id)).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase())
  ), [search, existingIds, catalog]);
  if (!open) return null;
  return (
    <div className="mov" onClick={onClose}>
      <div className="mod" onClick={e => e.stopPropagation()}>
        <div className="mod-h"><span className="mod-h-t">A\u00f1adir producto</span><button className="mod-close" onClick={onClose}>{"\u2715"}</button></div>
        <div className="mod-b">
          <input className="mod-srch" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          {available.map(p => (
            <div key={p.id} className="mod-item" onClick={() => { onAdd(p.id); onClose(); }}>
              <div><div className="mod-item-n">{p.name}</div><div className="mod-item-d">{p.section} \u00b7 {p.description}</div></div>
              <span className="mod-item-add">+ A\u00f1adir</span>
            </div>
          ))}
          {!available.length && <div style={{padding:20,textAlign:"center",color:"#8A9A86",fontSize:12}}>No hay m\u00e1s productos disponibles</div>}
        </div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!email || !password) { setError("Rellena todos los campos"); return; }
    setLoading(true); setError("");
    const { error: e } = await api.signIn(email, password);
    setLoading(false);
    if (e) setError("Email o contrase\u00f1a incorrectos");
  };
  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-logo"><div className="auth-logo-m">AT</div><div className="auth-logo-t">Aceites Tapia</div><div className="auth-logo-s">Panel del Repartidor</div></div>
        {error && <div className="auth-err">{error}</div>}
        <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
        <div className="fg"><label className="fl">Contrase\u00f1a</label><input className="fi" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" onKeyDown={e => e.key==="Enter" && handleSubmit()} /></div>
        <button className="bp" style={{padding:12}} disabled={loading} onClick={handleSubmit}>{loading ? "Cargando..." : "Entrar"}</button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState(null);
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [tab, setTab] = useState("pendientes");
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editItems, setEditItems] = useState({});
  const [deliveryData, setDeliveryData] = useState({});
  const [showAddModal, setShowAddModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSession().then(s => { setSession(s); setAuthLoading(false); });
    const { data: { subscription } } = api.onAuthChange((_ev, s) => { setSession(s); if (!s) setDriverProfile(null); });
    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const [{ data: pending }, { data: delivered }] = await Promise.all([api.getAllPendingOrders(), api.getAllDeliveredOrders()]);
    if (pending) setPendingOrders(pending);
    if (delivered) setDeliveredOrders(delivered);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data: profile } = await api.getClientProfile(session.user.id);
      if (profile) setDriverProfile(profile);
      const { data: products } = await api.getProducts();
      if (products?.length > 0) setCatalog(products);
      await loadOrders();
    })();
  }, [session, loadOrders]);

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const order = pendingOrders.find(o => o.id === id);
    if (order && !editItems[id]) {
      setEditItems(prev => ({ ...prev, [id]: (order.order_items||[]).map(i => ({ productId: i.product_id, qty: i.quantity, originalQty: i.quantity })) }));
    }
    if (!deliveryData[id]) {
      const now = new Date();
      setDeliveryData(prev => ({ ...prev, [id]: { date: now.toISOString().split("T")[0], time: now.toTimeString().slice(0,5), payment: null, document: order?.wants_invoice ? "factura" : "nota" } }));
    }
  };

  const handleItemQty = (oid, pid, q) => setEditItems(prev => ({ ...prev, [oid]: prev[oid].map(i => i.productId===pid ? {...i,qty:q} : i) }));
  const handleItemRemove = (oid, pid) => setEditItems(prev => ({ ...prev, [oid]: prev[oid].filter(i => i.productId!==pid) }));
  const handleAddProduct = (oid, pid) => setEditItems(prev => ({ ...prev, [oid]: [...(prev[oid]||[]), { productId:pid, qty:1, originalQty:0 }] }));
  const handleDeliveryField = (oid, f, v) => setDeliveryData(prev => ({ ...prev, [oid]: { ...prev[oid], [f]: v } }));

  const hasChanges = (oid) => {
    const order = pendingOrders.find(o => o.id === oid);
    const edited = editItems[oid];
    if (!order || !edited) return false;
    const orig = order.order_items || [];
    if (orig.length !== edited.length) return true;
    return orig.some(o => { const e = edited.find(x => x.productId===o.product_id); return !e || e.qty!==o.quantity; }) || edited.some(e => !orig.find(o => o.product_id===e.productId));
  };

  const confirmDelivery = async (oid) => {
    const dd = deliveryData[oid];
    if (!dd?.payment) return;
    const modified = hasChanges(oid) ? editItems[oid] : null;
    const { error } = await api.confirmDelivery(oid, dd, modified, driverProfile?.id);
    if (error) { alert("Error: " + error.message); return; }
    setExpandedId(null);
    setToast("\u2705 " + oid + " entregado");
    setTimeout(() => setToast(null), 3000);
    await loadOrders();
  };

  const getProduct = (id) => catalog.find(p => p.id === id);
  const isAdmin = driverProfile?.role === 'admin';

  if (authLoading) return <div className="app"><div className="loading"><div className="loading-spin"/><p>Cargando...</p></div></div>;
  if (!session) return <AuthScreen />;
  if (loading && !pendingOrders.length && !deliveredOrders.length) return <div className="app"><div className="loading"><div className="loading-spin"/><p>Cargando pedidos...</p></div></div>;

  const renderOrderCard = (order, isPending) => {
    const isExpanded = expandedId === order.id;
    const client = order.clients || {};
    const dp = order.delivery_points;
    const items = isExpanded && editItems[order.id] ? editItems[order.id] : (order.order_items||[]).map(i => ({ productId: i.product_id, qty: i.quantity }));
    const dd = deliveryData[order.id];
    const changed = isExpanded && hasChanges(order.id);

    return (
      <div key={order.id} className="ro">
        <div className="ro-top" onClick={() => isPending && toggleExpand(order.id)}>
          <div className="ro-h">
            <div><div className="ro-client">{client.name || "Cliente"}</div><div className="ro-id">{order.id} \u00b7 {new Date(order.created_at).toLocaleDateString("es-ES",{day:"numeric",month:"short"})}{order.total_amount > 0 ? " \u00b7 " + order.total_amount.toFixed(2) + "\u20ac" : ""}</div></div>
            <span className={"st " + (isPending?"st-pend":"st-dlv")}>{isPending?"Pendiente":"Entregado"}</span>
          </div>
          <div className="ro-addr">{"\u{1F4CD}"} {dp ? dp.name + " \u2014 " + dp.address : client.address || "Sin direcci\u00f3n"}</div>
          <div className="ro-items">
            {items.map(i => { const p = getProduct(i.productId); return p ? i.qty + "\u00d7 " + p.name : ""; }).filter(Boolean).join(" \u00b7 ")}
            {changed && <span className="changes-badge">Modificado</span>}
          </div>
          {order.notes && <div className="ro-notes">{"\u{1F4DD}"} {order.notes}</div>}
          {isPending && client.phone && <div className="contact-row"><a className="contact-btn" href={"tel:" + client.phone}>{"\u{1F4DE}"} {client.phone}</a></div>}
        </div>

        {!isPending && order.delivery_date && (
          <div className="dlv-sum">
            <div className="dlv-sum-row"><span className="dlv-sum-label">Entregado</span><span className="dlv-sum-val">{order.delivery_date} a las {order.delivery_time}</span></div>
            <div className="dlv-sum-row"><span className="dlv-sum-label">Pago</span><span className="dlv-sum-val" style={{textTransform:"capitalize"}}>{order.delivery_payment}</span></div>
            <div className="dlv-sum-row"><span className="dlv-sum-label">Documento</span><span className="dlv-sum-val" style={{textTransform:"capitalize"}}>{order.delivery_document}</span></div>
            {order.total_amount > 0 && <div className="dlv-sum-row"><span className="dlv-sum-label">Importe</span><span className="dlv-sum-val">{order.total_amount.toFixed(2)}\u20ac</span></div>}
            {order.delivery_modified && <div className="dlv-sum-row"><span className="dlv-sum-label">Pedido</span><span className="dlv-sum-val" style={{color:"var(--or)"}}>Modificado en entrega</span></div>}
          </div>
        )}

        {isExpanded && isPending && dd && (
          <div className="dlv-panel">
            <div className="dlv-section">
              <span className="dlv-label">Productos del pedido</span>
              {(editItems[order.id]||[]).map(item => <EditableItem key={item.productId} item={item} catalog={catalog} onChange={(pid,q) => handleItemQty(order.id,pid,q)} onRemove={(pid) => handleItemRemove(order.id,pid)} />)}
              <button className="add-prod-btn" onClick={() => setShowAddModal(order.id)}>+ A\u00f1adir producto</button>
            </div>
            <div className="div" />
            <div className="dlv-section">
              <span className="dlv-label">Fecha y hora</span>
              <div className="dt-row"><div><input type="date" className="fi" value={dd.date} onChange={e => handleDeliveryField(order.id,"date",e.target.value)} /></div><div><input type="time" className="fi" value={dd.time} onChange={e => handleDeliveryField(order.id,"time",e.target.value)} /></div></div>
            </div>
            <div className="dlv-section">
              <span className="dlv-label">M\u00e9todo de pago</span>
              <div className="pay-opts">{PAYMENT_OPTS.map(po => <div key={po.id} className={"pay-opt " + (dd.payment===po.id?"sel":"")} onClick={() => handleDeliveryField(order.id,"payment",po.id)}><div className="pay-ic">{po.icon}</div><div className="pay-lb">{po.label}</div></div>)}</div>
            </div>
            <div className="dlv-section">
              <span className="dlv-label">Documento</span>
              <div className="doc-opts">{DOC_OPTS.map(d => <div key={d.id} className={"doc-opt " + (dd.document===d.id?"sel":"")} onClick={() => handleDeliveryField(order.id,"document",d.id)}><div className="doc-lb">{d.label}</div><div className="doc-desc">{d.desc}</div></div>)}</div>
            </div>
            <div className="act-row"><button className="btn-cancel" onClick={() => setExpandedId(null)}>Cancelar</button><button className="btn-confirm" disabled={!dd.payment} onClick={() => confirmDelivery(order.id)}>{"\u2713"} Confirmar Entrega</button></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="hdr">
        <div className="hdr-top">
          <div className="logo-a"><div className="logo-m">AT</div><div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Panel Repartidor</div></div></div>
          <button className="driver-name" onClick={() => api.signOut()}>{"\u{1F69A}"} {driverProfile?.name || "Repartidor"} {"\u2715"}</button>
        </div>
        <div className="nav">
          <button className={"nb " + (tab==="pendientes"?"on":"")} onClick={() => setTab("pendientes")}>Pendientes{pendingOrders.length>0 && <span className="bdg">{pendingOrders.length}</span>}</button>
          <button className={"nb " + (tab==="entregados"?"on":"")} onClick={() => setTab("entregados")}>Entregados{deliveredOrders.length>0 && <span className="bdg bdg-g">{deliveredOrders.length}</span>}</button>
          <button className={"nb " + (tab==="nuevo"?"on":"")} onClick={() => setTab("nuevo")}>+ Pedido</button>
          <button className={"nb " + (tab==="ronda"?"on":"")} onClick={() => setTab("ronda")}>📞 Ronda</button>
          <button className={"nb " + (tab==="carga"?"on":"")} onClick={() => setTab("carga")}>🚚 Carga</button>
          <button className={"nb " + (tab===="clientes"?"on":"")} onClick={() => setTab("clientes")}>{"\u{1F465}"} Clientes</button>
          {isAdmin && <button className={"nb " + (tab==="admin"?"on":"")} onClick={() => setTab("admin")}>{"\u2699\uFE0F"} Admin</button>}
        </div>
      </div>

      <div className="main">
        {tab === "pendientes" && <>
          <div className="stit">Pedidos Pendientes</div>
          <div className="ssub">{pendingOrders.length} pedido{pendingOrders.length!==1?"s":""} por entregar</div>
          {!pendingOrders.length ? <div style={{textAlign:"center",padding:40,color:"var(--tm)"}}><div style={{fontSize:48,marginBottom:8,opacity:.4}}>{"\u2705"}</div><p style={{fontSize:13}}>{"\u00a1Todo entregado!"}</p></div> : pendingOrders.map(o => renderOrderCard(o, true))}
        </>}

        {tab === "entregados" && <>
          <div className="stit">Pedidos Entregados</div>
          <div className="ssub">{deliveredOrders.length} entrega{deliveredOrders.length!==1?"s":""} registrada{deliveredOrders.length!==1?"s":""}</div>
          {!deliveredOrders.length ? <div style={{textAlign:"center",padding:40,color:"var(--tm)"}}><div style={{fontSize:48,marginBottom:8,opacity:.4}}>{"\u{1F4E6}"}</div><p style={{fontSize:13}}>A\u00fan no hay entregas registradas.</p></div> : deliveredOrders.map(o => renderOrderCard(o, false))}
        </>}

        {tab === "nuevo" && <CreateOrder catalog={catalog} onDone={() => { setTab("pendientes"); loadOrders(); }} />}

        {tab === "ronda" && <DeliveryRound catalog={catalog} driverProfile={driverProfile} />}

        {tab === "carga" && <LoadDocument catalog={catalog} />}

        {tab === "clientes" && <ClientManager isAdmin={isAdmin} />}

        {tab === "admin" && isAdmin && <AdminPanel driverProfile={driverProfile} />}
      </div>

      <AddProductModal open={showAddModal!==null} onClose={() => setShowAddModal(null)} catalog={catalog} onAdd={(pid) => handleAddProduct(showAddModal, pid)} existingIds={(editItems[showAddModal]||[]).map(i => i.productId)} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
