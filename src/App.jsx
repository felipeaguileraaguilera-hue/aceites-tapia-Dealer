import { useState, useCallback, useMemo, useEffect } from "react";
import * as api from './api';
import { FALLBACK_CATALOG, SEC_COLORS, SECTION_BG, FILTER_CATS } from './constants';
import './styles.css';

// Load fonts
if (!document.querySelector('link[data-tapia-font]')) {
  const fl = document.createElement("link");
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  fl.rel = "stylesheet"; fl.setAttribute("data-tapia-font","1"); document.head.appendChild(fl);
}

// ============================================================
// Small Components
// ============================================================

function ProductImage({ src, section }) {
  const [failed, setFailed] = useState(false);
  const emojis = {"PET Filtrado":"📦🫒","Vidrio Filtrado":"🍶🫒","PET Sin Filtrar":"📦🌿","Monodosis AOVE":"🔸","Vidrio Sin Filtrar":"🍶🌿","Verde Oleum":"🌿","Delirium":"✨"};
  if (failed) return <div className="pimg-fb" style={{background:SECTION_BG[section]||"#F5F5F5"}}>{emojis[section]||"🫒"}</div>;
  return <img className="pimg" src={src} alt="" loading="lazy" onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
}

function ProductCard({ product, qty, onQtyChange }) {
  return (
    <div className={`pcard ${qty>0?"sel":""}`}>
      <div className="pimg-w" style={{background:SECTION_BG[product.section]||"#FAF6EF"}}>
        {qty>0 && <span className="psel-b">×{qty}</span>}
        <ProductImage src={product.image_url} section={product.section} />
      </div>
      <div className="pc-b">
        <div className="pn">{product.name}</div>
        <div className="pd">{product.description}</div>
        {qty===0
          ? <button className="ab" onClick={() => onQtyChange(product.id,1)}>+ Añadir</button>
          : <div className="qc">
              <button className="qb rm" onClick={() => onQtyChange(product.id,qty-1)}>−</button>
              <span className="qv">{qty}</span>
              <button className="qb" onClick={() => onQtyChange(product.id,qty+1)}>+</button>
            </div>
        }
      </div>
    </div>
  );
}

function OrderCard({ order, catalog, onClone }) {
  const stL = { pending:"Pendiente", delivered:"Entregado", cancelled:"Cancelado" };
  const stC = { pending:"st-p", delivered:"st-d", cancelled:"st-p" };
  const items = order.order_items || [];
  const summary = items.map(i => {
    const p = catalog.find(c => c.id === i.product_id);
    return p ? `${i.quantity}× ${p.name}` : "";
  }).filter(Boolean).join(", ");
  return (
    <div className="ocard">
      <div className="oh">
        <div><span className="oid">{order.id}</span><span className="odt">{new Date(order.created_at).toLocaleDateString("es-ES",{day:"numeric",month:"short"})}</span></div>
        <span className={`ost ${stC[order.status]||"st-p"}`}>{stL[order.status]||order.status}</span>
      </div>
      <div className="osum">{summary || "Sin productos"}</div>
      {order.status !== "cancelled" && <button className="clb" onClick={() => onClone(items)}>🔄 Repetir pedido</button>}
    </div>
  );
}

function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}

// ============================================================
// Auth Screen
// ============================================================

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError("Rellena todos los campos"); return; }
    setLoading(true); setError("");
    const fn = mode === "login" ? api.signIn : api.signUp;
    const { error: e } = await fn(email, password);
    setLoading(false);
    if (e) {
      if (e.message.includes("Invalid login")) setError("Email o contraseña incorrectos");
      else if (e.message.includes("already registered")) setError("Este email ya está registrado. Inicia sesión.");
      else setError(e.message);
    }
  };

  return (
    <div className="auth">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-m">AT</div>
          <div className="auth-logo-t">Aceites Tapia</div>
          <div className="auth-logo-s">Portal de Pedidos HORECA</div>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"on":""}`} onClick={() => {setMode("login");setError("")}}>Iniciar sesión</button>
          <button className={`auth-tab ${mode==="signup"?"on":""}`} onClick={() => {setMode("signup");setError("")}}>Registrarse</button>
        </div>
        {error && <div className="auth-err">{error}</div>}
        <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
        <div className="fg"><label className="fl">Contraseña</label><input className="fi" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==="Enter" && handleSubmit()} /></div>
        <button className="bp" style={{width:"100%",padding:12,marginBottom:8}} disabled={loading} onClick={handleSubmit}>
          {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
        </button>
        <div className="auth-or">o</div>
        <button className="auth-google" onClick={() => api.signInWithGoogle()}><GoogleIcon /> Continuar con Google</button>
      </div>
    </div>
  );
}

// ============================================================
// Setup Profile
// ============================================================

function SetupProfile({ user, onComplete }) {
  const [form, setForm] = useState({ name:"", contact_person:"", phone:"", address:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.name) { setError("El nombre del establecimiento es obligatorio"); return; }
    setLoading(true);
    const { data, error: e } = await api.createClientProfile(user.id, { ...form, email: user.email });
    setLoading(false);
    if (e) setError(e.message); else onComplete(data);
  };

  return (
    <div className="app">
      <div className="hdr"><div className="hdr-top"><div className="logo-a"><div className="logo-m">AT</div><div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Pedidos HORECA</div></div></div></div></div>
      <div className="main" style={{paddingBottom:24}}>
        <div className="stit">¡Bienvenido!</div>
        <div className="ssub">Completa los datos de tu establecimiento para empezar a hacer pedidos</div>
        {error && <div className="auth-err">{error}</div>}
        <div className="fg"><label className="fl">Nombre del establecimiento *</label><input className="fi" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Bar El Rincón" /></div>
        <div className="fg"><label className="fl">Persona de contacto</label><input className="fi" value={form.contact_person} onChange={e => setForm({...form,contact_person:e.target.value})} placeholder="Antonio López" /></div>
        <div className="fg"><label className="fl">Teléfono</label><input className="fi" type="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="654 321 987" /></div>
        <div className="fg"><label className="fl">Dirección de entrega</label><input className="fi" value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="C/ Real 14, Villanueva de Tapia" /></div>
        <button className="bp" style={{width:"100%",padding:12}} disabled={loading} onClick={handleSave}>{loading ? "Guardando..." : "Guardar y continuar"}</button>
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
  const [clientProfile, setClientProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [tab, setTab] = useState("pedido");
  const [qty, setQty] = useState({});
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("Todos");
  const [showConf, setShowConf] = useState(false);
  const [showSucc, setShowSucc] = useState(false);
  const [wantInv, setWantInv] = useState(true);
  const [notes, setNotes] = useState("");
  const [orders, setOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  useEffect(() => {
    api.getSession().then(s => { setSession(s); setAuthLoading(false); });
    const { data: { subscription } } = api.onAuthChange((_ev, s) => {
      setSession(s);
      if (!s) { setClientProfile(null); setOrders([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      setProfileLoading(true);
      const { data: profile } = await api.getClientProfile(session.user.id);
      if (profile) {
        setClientProfile(profile);
        setWantInv(profile.wants_invoice_default ?? true);
        const { data: ord } = await api.getClientOrders(profile.id);
        if (ord) setOrders(ord);
      }
      const { data: products } = await api.getProducts();
      if (products?.length > 0) setCatalog(products);
      setProfileLoading(false);
    })();
  }, [session]);

  const sections = useMemo(() => {
    const secs = []; let cur = null;
    const af = FILTER_CATS.find(c => c.label === catF);
    catalog.filter(p => {
      const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase());
      const mc = !af?.match || af.match.includes(p.section);
      return ms && mc;
    }).forEach(p => {
      if (p.section !== cur) { cur = p.section; secs.push({ name: p.section, products: [] }); }
      secs[secs.length - 1].products.push(p);
    });
    return secs;
  }, [catalog, search, catF]);

  const cartItems = useMemo(() => Object.entries(qty).filter(([_,q]) => q > 0).map(([id, q]) => ({ product: catalog.find(p => p.id === id), qty: q })).filter(i => i.product), [qty, catalog]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);

  const suggested = useMemo(() => {
    if (!orders.length) return null;
    const freq = {};
    orders.slice(0, 3).forEach(o => (o.order_items || []).forEach(i => {
      if (!freq[i.product_id]) freq[i.product_id] = { total: 0, count: 0 };
      freq[i.product_id].total += i.quantity; freq[i.product_id].count++;
    }));
    if (!Object.keys(freq).length) return null;
    const s = {};
    Object.entries(freq).forEach(([id, d]) => { s[id] = Math.round(d.total / d.count); });
    return s;
  }, [orders]);

  const handleQty = useCallback((id, n) => setQty(prev => { const next = { ...prev }; if (n <= 0) delete next[id]; else next[id] = n; return next; }), []);
  const handleClone = useCallback((items) => { const nq = {}; items.forEach(i => { nq[i.product_id] = i.quantity; }); setQty(nq); setTab("pedido"); }, []);

  const submitOrder = async () => {
    if (!clientProfile) return;
    setSubmitting(true);
    const items = cartItems.map(i => ({ productId: i.product.id, qty: i.qty }));
    const { data, error } = await api.createOrder(clientProfile.id, items, wantInv, notes);
    setSubmitting(false);
    if (error) { alert("Error al enviar el pedido: " + error.message); return; }
    setLastOrderId(data.id);
    const { data: ord } = await api.getClientOrders(clientProfile.id);
    if (ord) setOrders(ord);
    setQty({}); setNotes(""); setShowConf(false); setShowSucc(true);
  };

  // --- RENDER ---
  if (authLoading) return <div className="app"><div className="loading"><div className="loading-spin" /><p>Cargando...</p></div></div>;
  if (!session) return <AuthScreen />;
  if (profileLoading) return <div className="app"><div className="loading"><div className="loading-spin" /><p>Cargando perfil...</p></div></div>;
  if (!clientProfile) return <SetupProfile user={session.user} onComplete={setClientProfile} />;

  const initials = clientProfile.name ? clientProfile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="app">
      <div className="hdr">
        <div className="hdr-top">
          <div className="logo-a"><div className="logo-m">AT</div><div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Pedidos HORECA</div></div></div>
          <button className="u-p" onClick={() => setTab("perfil")}><span className="u-a">{initials}</span>{clientProfile.name.split(" ")[0]}</button>
        </div>
        <div className="nav">
          <button className={`nb ${tab==="pedido"?"on":""}`} onClick={() => setTab("pedido")}>Nuevo Pedido{cartCount > 0 && <span className="bdg">{cartCount}</span>}</button>
          <button className={`nb ${tab==="historial"?"on":""}`} onClick={() => setTab("historial")}>Historial{orders.length > 0 && <span className="bdg">{orders.length}</span>}</button>
          <button className={`nb ${tab==="perfil"?"on":""}`} onClick={() => setTab("perfil")}>Mi Perfil</button>
        </div>
      </div>

      <div className="main">
        {tab === "pedido" && !showSucc && <>
          <div className="stit">Nuevo Pedido</div>
          <div className="ssub">Selecciona productos y cantidades</div>
          {suggested && !Object.keys(qty).length && (
            <div className="sug">
              <div className="sug-t">💡 Pedido sugerido</div>
              <div className="sug-d">Basado en tus últimos pedidos: {Object.entries(suggested).map(([id, q]) => { const p = catalog.find(c => c.id === id); return p ? `${q}× ${p.name}` : ""; }).filter(Boolean).join(", ")}</div>
              <button className="sug-b" onClick={() => setQty(suggested)}>Usar pedido sugerido</button>
            </div>
          )}
          <div className="srch-w"><span className="srch-i">🔍</span><input className="srch" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="chips">{FILTER_CATS.map(c => <span key={c.label} className={`chip ${catF===c.label?"on":""}`} onClick={() => setCatF(c.label)}>{c.label}</span>)}</div>
          {sections.map(sec => { const sc = SEC_COLORS[sec.name] || { bg:"#F5F5F5", color:"#333", icon:"📦" }; return (
            <div key={sec.name}>
              <div className="sec-h" style={{background:sc.bg,color:sc.color}}><span>{sc.icon}</span> {sec.name}</div>
              <div className="pgrid">{sec.products.map(p => <ProductCard key={p.id} product={p} qty={qty[p.id]||0} onQtyChange={handleQty} />)}</div>
            </div>
          ); })}
          {!sections.length && <div className="emp"><div className="emp-i">🔍</div><p>No se encontraron productos</p></div>}
        </>}

        {tab === "pedido" && showSucc && (
          <div className="suc">
            <div className="suc-ic">✅</div>
            <div className="suc-t">¡Pedido enviado!</div>
            <div className="suc-m">Tu pedido <strong>{lastOrderId}</strong> ha sido registrado.<br/>Recibirás confirmación cuando esté en reparto.</div>
            <button className="bp" style={{padding:"10px 24px"}} onClick={() => { setShowSucc(false); setTab("historial"); }}>Ver mis pedidos</button>
            <div style={{height:8}} />
            <button className="bs" style={{padding:"10px 24px"}} onClick={() => setShowSucc(false)}>Hacer otro pedido</button>
          </div>
        )}

        {tab === "historial" && <>
          <div className="stit">Historial de Pedidos</div>
          <div className="ssub">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</div>
          {!orders.length ? <div className="emp"><div className="emp-i">📦</div><p>Aún no has realizado ningún pedido</p></div>
            : orders.map(o => <OrderCard key={o.id} order={o} catalog={catalog} onClone={handleClone} />)}
        </>}

        {tab === "perfil" && <>
          <div className="stit">Mi Perfil</div>
          <div className="ssub">Datos de tu establecimiento</div>
          <div className="fg"><label className="fl">Establecimiento</label><input className="fi" value={clientProfile.name} readOnly style={{background:"#F5F5F5"}} /></div>
          <div className="fg"><label className="fl">Email</label><input className="fi" value={clientProfile.email} readOnly style={{background:"#F5F5F5"}} /></div>
          <div className="fg"><label className="fl">Persona de contacto</label><input className="fi" value={clientProfile.contact_person||""} readOnly style={{background:"#F5F5F5"}} /></div>
          <div className="fg"><label className="fl">Teléfono</label><input className="fi" value={clientProfile.phone||""} readOnly style={{background:"#F5F5F5"}} /></div>
          <div className="fg"><label className="fl">Dirección de entrega</label><input className="fi" value={clientProfile.address||""} readOnly style={{background:"#F5F5F5"}} /></div>
          <div className="div" />
          <div className="trow">
            <div><div className="tl">Factura por defecto</div><div className="td">Se aplicará a todos los pedidos nuevos</div></div>
            <button className={`tog ${wantInv?"on":""}`} onClick={() => { const nv = !wantInv; setWantInv(nv); api.updateClientProfile(clientProfile.id, { wants_invoice_default: nv }); }} />
          </div>
          <button className="logout-btn" onClick={() => api.signOut()}>Cerrar sesión</button>
        </>}
      </div>

      {tab === "pedido" && !showSucc && cartCount > 0 && (
        <div className="cart">
          <div><div className="cart-n">{cartCount} producto{cartCount!==1?"s":""}</div><div className="cart-t">{cartItems.length} referencia{cartItems.length!==1?"s":""}</div></div>
          <button className="cart-b" onClick={() => setShowConf(true)}>Revisar Pedido →</button>
        </div>
      )}

      {showConf && (
        <div className="mov" onClick={() => setShowConf(false)}>
          <div className="mod" onClick={e => e.stopPropagation()}>
            <div className="mod-h"><div className="stit" style={{fontSize:16}}>Confirmar Pedido</div><div className="ssub" style={{marginBottom:0}}>Revisa tu pedido antes de enviarlo</div></div>
            <div className="mod-b">
              {cartItems.map(i => <div key={i.product.id} className="li"><span className="li-n">{i.product.name}</span><span className="li-q">{i.qty} {i.qty===1?"caja":"cajas"}</span></div>)}
              <div className="div" />
              <div className="trow" style={{borderBottom:"none"}}><div><div className="tl">Solicitar factura</div></div><button className={`tog ${wantInv?"on":""}`} onClick={() => setWantInv(!wantInv)} /></div>
              <div className="fg" style={{marginTop:8}}><label className="fl">Notas para la entrega</label><textarea className="ft" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Entregar antes de las 12h" /></div>
            </div>
            <div className="mod-f"><button className="bs" onClick={() => setShowConf(false)}>Volver</button><button className="bp" disabled={submitting} onClick={submitOrder}>{submitting ? "Enviando..." : "✓ Enviar Pedido"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
