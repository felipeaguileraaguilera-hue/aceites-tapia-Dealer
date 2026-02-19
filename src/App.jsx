import { useState, useCallback, useMemo } from "react";

// ============================================================
// ACEITES TAPIA — App del Repartidor
// Gestión de entregas, pagos, modificación de pedidos
// ============================================================

const B = "https://www.aceitestapia.com/wp-content/uploads";

const CATALOG = [
  { id:"F-PET-5L",   name:"PET Filtrado 5L",       desc:"Caja 3 ud",  section:"PET Filtrado",    img:`${B}/2020/06/CAJA-PET-5L-300x300.jpg` },
  { id:"F-PET-2L",   name:"PET Filtrado 2L",       desc:"Caja 6 ud",  section:"PET Filtrado",    img:`${B}/2018/10/caja-PET-2L-300x300.jpg` },
  { id:"F-PET-1L",   name:"PET Filtrado 1L",       desc:"Caja 12 ud", section:"PET Filtrado",    img:`${B}/2018/10/caja-PET-1L-300x300.jpg` },
  { id:"F-PET-500",  name:"PET Filtrado 500ml",    desc:"Caja 20 ud", section:"PET Filtrado",    img:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg` },
  { id:"F-VT-750",   name:"Vidrio Filtrado 750ml", desc:"Caja 15 ud", section:"Vidrio Filtrado",  img:`${B}/2020/06/CAJA-MT750ML-300x300.jpg` },
  { id:"F-VT-500",   name:"Vidrio Filtrado 500ml", desc:"Caja 24 ud", section:"Vidrio Filtrado",  img:`${B}/2020/06/CAJA-MT500ML-300x300.jpg` },
  { id:"SF-PET-5L",  name:"PET Sin Filtrar 5L",    desc:"Caja 3 ud",  section:"PET Sin Filtrar",  img:`${B}/2020/06/CAJA-PET-5L-300x300.jpg` },
  { id:"SF-PET-2L",  name:"PET Sin Filtrar 2L",    desc:"Caja 6 ud",  section:"PET Sin Filtrar",  img:`${B}/2018/10/caja-PET-2L-300x300.jpg` },
  { id:"SF-PET-1L",  name:"PET Sin Filtrar 1L",    desc:"Caja 15 ud", section:"PET Sin Filtrar",  img:`${B}/2018/10/caja-PET-1L-300x300.jpg` },
  { id:"SF-PET-500", name:"PET Sin Filtrar 500ml", desc:"Caja 20 ud", section:"PET Sin Filtrar",  img:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg` },
  { id:"MONO-AOVE",  name:"Monodosis AOVE 20ml",  desc:"Caja 160 ud",section:"Monodosis AOVE",   img:`${B}/2021/05/TARRINA-AOVE-20ML-300x300.jpg` },
  { id:"SF-VT-750",  name:"Vidrio Sin Filtrar 750ml",desc:"Caja 15 ud",section:"Vidrio Sin Filtrar",img:`${B}/2020/06/CAJA-MT750ML-300x300.jpg` },
  { id:"SF-VT-500",  name:"Vidrio Sin Filtrar 500ml",desc:"Caja 24 ud",section:"Vidrio Sin Filtrar",img:`${B}/2020/06/CAJA-MT500ML-300x300.jpg` },
  { id:"VO-L-5L",    name:"Verde Oleum Lata 5L",   desc:"Caja 4 ud",  section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-5L-VERDE-OLEUM-1-300x300.jpg` },
  { id:"VO-L-750",   name:"Verde Oleum Lata 750ml",desc:"Caja 15 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-750ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-B-500",   name:"Verde Oleum Bot. 500ml",desc:"Caja 15 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-BOTELLA-500ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-L-250",   name:"Verde Oleum Lata 250ml",desc:"Caja 28 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-LATA-250ML-VERDE-OLEUM-300x300.jpg` },
  { id:"VO-B-250",   name:"Verde Oleum Bot. 250ml",desc:"Caja 30 ud", section:"Verde Oleum",     img:`${B}/2018/10/CAJA-BOTELLA-250ML-VERDE-OLEUM-300x300.jpg` },
  { id:"DEL-500",    name:"Delirium 500ml",        desc:"Unidad",     section:"Delirium",        img:`${B}/2021/01/DELIRIUM-300x300.jpg` },
];

const getProduct = (id) => CATALOG.find(p => p.id === id);

// ============================================================
// Demo orders (simulating orders from clients)
// ============================================================
const INITIAL_ORDERS = [
  {
    id: "PED-2026-052", date: "2026-02-17", status: "pending",
    client: { name: "Bar El Rincón", contact: "Antonio López", phone: "654 321 987", email: "elrincon@email.com", address: "C/ Real 14, Villanueva de Tapia" },
    items: [{ productId: "F-PET-5L", qty: 6 }, { productId: "MONO-AOVE", qty: 2 }, { productId: "VO-B-500", qty: 4 }],
    invoice: true, notes: "Entregar antes de las 12h"
  },
  {
    id: "PED-2026-051", date: "2026-02-17", status: "pending",
    client: { name: "Restaurante La Plaza", contact: "María García", phone: "678 123 456", email: "laplaza@email.com", address: "Plaza Mayor 3, Villanueva de Tapia" },
    items: [{ productId: "F-PET-5L", qty: 3 }, { productId: "F-VT-500", qty: 6 }, { productId: "DEL-500", qty: 2 }],
    invoice: true, notes: ""
  },
  {
    id: "PED-2026-050", date: "2026-02-16", status: "pending",
    client: { name: "Hostal Camino", contact: "Pedro Ruiz", phone: "612 456 789", email: "hostalcamino@email.com", address: "Ctra. A-333 km 57, Villanueva de Tapia" },
    items: [{ productId: "SF-PET-5L", qty: 4 }, { productId: "MONO-AOVE", qty: 3 }],
    invoice: false, notes: "Llamar al llegar"
  },
  {
    id: "PED-2026-048", date: "2026-02-15", status: "delivered",
    client: { name: "Café Central", contact: "Ana Moreno", phone: "645 789 012", email: "cafecentral@email.com", address: "C/ Ancha 8, Villanueva de Tapia" },
    items: [{ productId: "F-PET-2L", qty: 4 }, { productId: "VO-L-750", qty: 6 }],
    invoice: true, notes: "",
    delivery: { date: "2026-02-15", time: "10:30", payment: "efectivo", document: "factura" }
  },
  {
    id: "PED-2026-045", date: "2026-02-14", status: "delivered",
    client: { name: "Bar El Rincón", contact: "Antonio López", phone: "654 321 987", email: "elrincon@email.com", address: "C/ Real 14, Villanueva de Tapia" },
    items: [{ productId: "F-PET-5L", qty: 8 }, { productId: "MONO-AOVE", qty: 2 }],
    invoice: false, notes: "",
    delivery: { date: "2026-02-14", time: "11:15", payment: "transferencia", document: "nota" }
  },
];

// ============================================================
// Fonts & Styles
// ============================================================
if (!document.querySelector('link[data-rep-font]')) {
  const fl = document.createElement("link");
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
  fl.rel = "stylesheet";
  fl.setAttribute("data-rep-font","1");
  document.head.appendChild(fl);
}

const CSS = `
:root {
  --b9:#1A2016;--b8:#2A3326;--b7:#3D4F3A;--b6:#4B6848;--b5:#5A8055;--b4:#72A06E;
  --b3:#95C090;--b2:#BDD9B8;--b1:#DCF0D8;--b0:#F0F9EE;
  --g5:#E6A817;--g4:#F4C430;--g3:#FFE082;--g2:#FFF3D0;
  --cr:#FAFDF9;--wm:#F4F7F3;--tx:#1A2016;--t2:#4A5A46;--tm:#8A9A86;
  --rd:#C62828;--rd1:#FFEBEE;--bl:#1565C0;--bl1:#E3F2FD;
  --or:#E65100;--or1:#FFF3E0;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:var(--cr);color:var(--tx);-webkit-font-smoothing:antialiased}

.app{min-height:100vh;max-width:540px;margin:0 auto;background:#fff;position:relative;box-shadow:0 0 40px rgba(26,32,22,.1)}

/* Header - darker theme for repartidor */
.hdr{background:linear-gradient(145deg,#1A2016,#2A3326 70%);padding:16px 14px 12px;position:sticky;top:0;z-index:100}
.hdr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.logo-a{display:flex;align-items:center;gap:8px}
.logo-m{width:30px;height:30px;background:var(--g5);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--b9);font-family:'Playfair Display',serif}
.logo-t{font-family:'Playfair Display',serif;font-size:15px;color:#fff}
.logo-s{font-size:8px;color:var(--b3);letter-spacing:2.5px;text-transform:uppercase;font-weight:500}
.driver-name{font-size:11px;color:var(--b2);background:rgba(255,255,255,.08);padding:4px 10px;border-radius:14px}

.nav{display:flex;gap:2px;background:rgba(0,0,0,.2);border-radius:8px;padding:2px}
.nb{flex:1;padding:6px 3px;text-align:center;font-size:10.5px;font-weight:500;color:var(--b3);border:none;background:0;border-radius:6px;cursor:pointer;transition:.2s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.nb.on{background:#fff;color:var(--b8);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.bdg{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:var(--or);color:#fff;font-size:8px;font-weight:700;margin-left:3px}
.bdg-g{background:var(--b5)}

.main{padding:12px;padding-bottom:24px}
.stit{font-family:'Playfair Display',serif;font-size:18px;color:var(--b9);margin-bottom:2px}
.ssub{font-size:11px;color:var(--tm);margin-bottom:12px}

/* Order cards for repartidor */
.ro{background:#fff;border:1.5px solid #EEE;border-radius:12px;margin-bottom:10px;overflow:hidden;transition:.2s}
.ro:hover{border-color:var(--b3);box-shadow:0 4px 16px rgba(26,32,22,.06)}
.ro-top{padding:12px 14px;cursor:pointer}
.ro-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.ro-client{font-weight:700;font-size:14px;color:var(--b8)}
.ro-id{font-size:10px;color:var(--tm);margin-top:1px}
.ro-addr{font-size:11px;color:var(--t2);margin-bottom:4px;display:flex;align-items:center;gap:4px}
.ro-notes{font-size:10px;color:var(--or);background:var(--or1);padding:3px 8px;border-radius:6px;margin-top:4px;display:inline-block}
.ro-items{font-size:11px;color:var(--t2);line-height:1.5;margin-top:6px}

/* Status badges */
.st{display:inline-block;padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
.st-pend{background:var(--or1);color:var(--or)}
.st-dlv{background:var(--b0);color:var(--b5)}
.st-transit{background:var(--bl1);color:var(--bl)}

/* Delivery form panel */
.dlv-panel{background:var(--wm);border-top:1.5px solid #EEE;padding:14px}

.dlv-section{margin-bottom:14px}
.dlv-label{font-size:10px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:block}

/* Editable items list */
.ei{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #E8E8E8}
.ei:last-child{border-bottom:none}
.ei-name{flex:1;font-size:11px;color:var(--tx);font-weight:500}
.ei-desc{font-size:9px;color:var(--tm)}
.ei-qc{display:flex;align-items:center;gap:0}
.ei-qb{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--b3);background:#fff;color:var(--b7);font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;font-family:'DM Sans',sans-serif}
.ei-qb:hover{background:var(--b1);border-color:var(--b5)}
.ei-qb.rm{border-color:var(--rd);color:var(--rd)}
.ei-qb.rm:hover{background:var(--rd1)}
.ei-qv{width:24px;text-align:center;font-size:13px;font-weight:700;color:var(--b9)}

.add-prod-btn{width:100%;padding:7px;border:1.5px dashed var(--b3);border-radius:8px;background:0;color:var(--b6);font-size:11px;font-weight:600;cursor:pointer;transition:.2s;font-family:'DM Sans',sans-serif;margin-top:8px}
.add-prod-btn:hover{background:var(--b0);border-color:var(--b5)}

/* Payment options */
.pay-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.pay-opt{padding:10px 8px;border:1.5px solid #DDD;border-radius:8px;background:#fff;cursor:pointer;text-align:center;transition:.2s;font-family:'DM Sans',sans-serif}
.pay-opt:hover{border-color:var(--b4)}
.pay-opt.sel{border-color:var(--b6);background:var(--b0);box-shadow:0 0 0 2px rgba(75,104,72,.15)}
.pay-ic{font-size:18px;margin-bottom:2px}
.pay-lb{font-size:10px;font-weight:600;color:var(--tx)}

/* Document options */
.doc-opts{display:flex;gap:6px}
.doc-opt{flex:1;padding:9px 6px;border:1.5px solid #DDD;border-radius:8px;background:#fff;cursor:pointer;text-align:center;transition:.2s;font-family:'DM Sans',sans-serif}
.doc-opt:hover{border-color:var(--b4)}
.doc-opt.sel{border-color:var(--b6);background:var(--b0)}
.doc-lb{font-size:10px;font-weight:600;color:var(--tx)}
.doc-desc{font-size:8px;color:var(--tm);margin-top:1px}

/* DateTime row */
.dt-row{display:flex;gap:8px}
.dt-row>div{flex:1}
.fi{width:100%;padding:8px 10px;border:1.5px solid #DDD;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--tx);background:#fff;transition:.2s}
.fi:focus{outline:none;border-color:var(--b5);box-shadow:0 0 0 3px rgba(90,128,85,.12)}

/* Action buttons */
.act-row{display:flex;gap:8px;margin-top:14px}
.btn-confirm{flex:1;padding:11px;background:var(--b6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.2s}
.btn-confirm:hover{background:var(--b5)}
.btn-confirm:disabled{opacity:.4;cursor:not-allowed}
.btn-cancel{padding:11px 16px;background:0;border:1.5px solid #DDD;border-radius:8px;font-size:12px;cursor:pointer;color:var(--t2);font-family:'DM Sans',sans-serif;transition:.2s}
.btn-cancel:hover{border-color:var(--b3)}

/* Add product modal */
.mov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;z-index:200;animation:fi .2s}
@keyframes fi{from{opacity:0}to{opacity:1}}
.mod{background:#fff;border-radius:14px 14px 0 0;width:100%;max-width:540px;max-height:75vh;overflow-y:auto;box-shadow:0 -8px 30px rgba(0,0,0,.15);animation:su .3s}
@keyframes su{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.mod-h{padding:14px 14px 10px;border-bottom:1px solid #F0F0F0;display:flex;justify-content:space-between;align-items:center}
.mod-h-t{font-family:'Playfair Display',serif;font-size:16px;color:var(--b9)}
.mod-close{width:28px;height:28px;border-radius:50%;border:none;background:#F0F0F0;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--t2)}
.mod-b{padding:10px 14px}
.mod-srch{width:100%;padding:8px 12px;border:1.5px solid #EEE;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;margin-bottom:10px;background:var(--wm)}
.mod-srch:focus{outline:none;border-color:var(--b4);background:#fff}
.mod-item{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F5F5;cursor:pointer;transition:.1s}
.mod-item:hover{background:var(--b0);margin:0 -14px;padding:8px 14px}
.mod-item-n{font-size:12px;font-weight:500;color:var(--tx)}
.mod-item-d{font-size:9px;color:var(--tm)}
.mod-item-add{font-size:10px;font-weight:600;color:var(--b6);white-space:nowrap}

/* Delivery confirmation toast */
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--b8);color:#fff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 8px 30px rgba(0,0,0,.2);z-index:300;animation:toastin .3s ease}
@keyframes toastin{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}

/* Delivery summary in completed orders */
.dlv-sum{background:var(--b0);padding:10px 14px;border-top:1.5px solid var(--b2);font-size:11px;color:var(--t2)}
.dlv-sum-row{display:flex;justify-content:space-between;padding:2px 0}
.dlv-sum-label{color:var(--tm);font-weight:500}
.dlv-sum-val{font-weight:600;color:var(--b7)}

/* Changes badge */
.changes-badge{font-size:9px;background:var(--g2);color:var(--g5);padding:2px 6px;border-radius:6px;font-weight:600;margin-left:6px}

.div{height:1px;background:#F0F0F0;margin:10px 0}

/* Contact row */
.contact-row{display:flex;gap:6px;margin-top:6px}
.contact-btn{padding:5px 10px;border:1.5px solid var(--b2);border-radius:6px;background:#fff;font-size:10px;color:var(--b6);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:.2s;text-decoration:none;display:flex;align-items:center;gap:3px}
.contact-btn:hover{background:var(--b0);border-color:var(--b4)}
`;

{ let s = document.querySelector("style[data-rep]"); if(!s){s=document.createElement("style");s.setAttribute("data-rep","1");document.head.appendChild(s)} s.textContent=CSS; }

// ============================================================
// Components
// ============================================================

function EditableItem({ item, onChange, onRemove }) {
  const p = getProduct(item.productId);
  if (!p) return null;
  return (
    <div className="ei">
      <div style={{ flex: 1 }}>
        <div className="ei-name">{p.name}</div>
        <div className="ei-desc">{p.desc}</div>
      </div>
      <div className="ei-qc">
        <button className="ei-qb rm" onClick={() => item.qty <= 1 ? onRemove(item.productId) : onChange(item.productId, item.qty - 1)}>−</button>
        <span className="ei-qv">{item.qty}</span>
        <button className="ei-qb" onClick={() => onChange(item.productId, item.qty + 1)}>+</button>
      </div>
    </div>
  );
}

function AddProductModal({ open, onClose, onAdd, existingIds }) {
  const [search, setSearch] = useState("");
  const available = useMemo(() => {
    return CATALOG.filter(p => !existingIds.includes(p.id)).filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.section.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, existingIds]);

  if (!open) return null;
  return (
    <div className="mov" onClick={onClose}>
      <div className="mod" onClick={e => e.stopPropagation()}>
        <div className="mod-h">
          <span className="mod-h-t">Añadir producto</span>
          <button className="mod-close" onClick={onClose}>✕</button>
        </div>
        <div className="mod-b">
          <input className="mod-srch" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          {available.map(p => (
            <div key={p.id} className="mod-item" onClick={() => { onAdd(p.id); onClose(); }}>
              <div>
                <div className="mod-item-n">{p.name}</div>
                <div className="mod-item-d">{p.section} · {p.desc}</div>
              </div>
              <span className="mod-item-add">+ Añadir</span>
            </div>
          ))}
          {available.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#8A9A86", fontSize: 12 }}>No hay más productos disponibles</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main App
// ============================================================

export default function RepartidorApp() {
  const [tab, setTab] = useState("pendientes");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [expandedId, setExpandedId] = useState(null);
  const [editItems, setEditItems] = useState({});
  const [deliveryData, setDeliveryData] = useState({});
  const [showAddModal, setShowAddModal] = useState(null); // orderId or null
  const [toast, setToast] = useState(null);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === "pending"), [orders]);
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === "delivered"), [orders]);

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const order = orders.find(o => o.id === id);
      if (order && !editItems[id]) {
        setEditItems(prev => ({ ...prev, [id]: order.items.map(i => ({ ...i })) }));
      }
      if (!deliveryData[id]) {
        const now = new Date();
        setDeliveryData(prev => ({
          ...prev,
          [id]: {
            date: now.toISOString().split("T")[0],
            time: now.toTimeString().slice(0, 5),
            payment: null,
            document: order?.invoice ? "factura" : "nota"
          }
        }));
      }
    }
  };

  const handleItemQtyChange = (orderId, productId, newQty) => {
    setEditItems(prev => ({
      ...prev,
      [orderId]: prev[orderId].map(i => i.productId === productId ? { ...i, qty: newQty } : i)
    }));
  };

  const handleItemRemove = (orderId, productId) => {
    setEditItems(prev => ({
      ...prev,
      [orderId]: prev[orderId].filter(i => i.productId !== productId)
    }));
  };

  const handleAddProduct = (orderId, productId) => {
    setEditItems(prev => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), { productId, qty: 1 }]
    }));
  };

  const handleDeliveryField = (orderId, field, value) => {
    setDeliveryData(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }));
  };

  const hasChanges = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const edited = editItems[orderId];
    if (!order || !edited) return false;
    if (order.items.length !== edited.length) return true;
    return order.items.some((orig, i) => {
      const ed = edited.find(e => e.productId === orig.productId);
      return !ed || ed.qty !== orig.qty;
    }) || edited.some(e => !order.items.find(o => o.productId === e.productId));
  };

  const confirmDelivery = (orderId) => {
    const dd = deliveryData[orderId];
    if (!dd?.payment) return;

    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: "delivered",
        items: editItems[orderId] || o.items,
        delivery: {
          date: dd.date,
          time: dd.time,
          payment: dd.payment,
          document: dd.document,
          modified: hasChanges(orderId)
        }
      };
    }));

    setExpandedId(null);
    setToast(`✅ ${orderId} entregado — notificación enviada`);
    setTimeout(() => setToast(null), 3000);
  };

  const PAYMENT_OPTS = [
    { id: "efectivo", icon: "💶", label: "Efectivo" },
    { id: "tarjeta", icon: "💳", label: "Tarjeta" },
    { id: "transferencia", icon: "🏦", label: "Transferencia" },
    { id: "pendiente", icon: "⏳", label: "No pagado" },
  ];

  const DOC_OPTS = [
    { id: "nota", label: "Nota de entrega", desc: "Sin datos fiscales" },
    { id: "factura", label: "Factura", desc: "Con datos fiscales" },
    { id: "ambas", label: "Ambas", desc: "Nota + Factura" },
  ];

  const renderOrderCard = (order) => {
    const isExpanded = expandedId === order.id;
    const isPending = order.status === "pending";
    const items = isExpanded && editItems[order.id] ? editItems[order.id] : order.items;
    const dd = deliveryData[order.id];
    const changed = isExpanded && hasChanges(order.id);

    return (
      <div key={order.id} className="ro">
        <div className="ro-top" onClick={() => isPending && toggleExpand(order.id)}>
          <div className="ro-h">
            <div>
              <div className="ro-client">{order.client.name}</div>
              <div className="ro-id">{order.id} · {new Date(order.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</div>
            </div>
            <span className={`st ${isPending ? "st-pend" : "st-dlv"}`}>
              {isPending ? "Pendiente" : "Entregado"}
            </span>
          </div>
          <div className="ro-addr">📍 {order.client.address}</div>
          <div className="ro-items">
            {items.map(i => { const p = getProduct(i.productId); return p ? `${i.qty}× ${p.name}` : ""; }).filter(Boolean).join(" · ")}
            {changed && <span className="changes-badge">Modificado</span>}
          </div>
          {order.notes && <div className="ro-notes">📝 {order.notes}</div>}
          {isPending && (
            <div className="contact-row">
              <a className="contact-btn" href={`tel:${order.client.phone}`}>📞 {order.client.phone}</a>
            </div>
          )}
        </div>

        {/* Delivery summary for completed orders */}
        {!isPending && order.delivery && (
          <div className="dlv-sum">
            <div className="dlv-sum-row"><span className="dlv-sum-label">Entregado</span><span className="dlv-sum-val">{order.delivery.date} a las {order.delivery.time}</span></div>
            <div className="dlv-sum-row"><span className="dlv-sum-label">Pago</span><span className="dlv-sum-val" style={{ textTransform: "capitalize" }}>{order.delivery.payment}</span></div>
            <div className="dlv-sum-row"><span className="dlv-sum-label">Documento</span><span className="dlv-sum-val" style={{ textTransform: "capitalize" }}>{order.delivery.document}</span></div>
            {order.delivery.modified && <div className="dlv-sum-row"><span className="dlv-sum-label">Pedido</span><span className="dlv-sum-val" style={{ color: "var(--or)" }}>Modificado en entrega</span></div>}
          </div>
        )}

        {/* Expanded delivery form */}
        {isExpanded && isPending && dd && (
          <div className="dlv-panel">
            {/* Editable items */}
            <div className="dlv-section">
              <span className="dlv-label">Productos del pedido</span>
              {(editItems[order.id] || []).map(item => (
                <EditableItem
                  key={item.productId}
                  item={item}
                  onChange={(pid, q) => handleItemQtyChange(order.id, pid, q)}
                  onRemove={(pid) => handleItemRemove(order.id, pid)}
                />
              ))}
              <button className="add-prod-btn" onClick={() => setShowAddModal(order.id)}>
                + Añadir producto al pedido
              </button>
            </div>

            <div className="div" />

            {/* Date & Time */}
            <div className="dlv-section">
              <span className="dlv-label">Fecha y hora de entrega</span>
              <div className="dt-row">
                <div>
                  <input type="date" className="fi" value={dd.date} onChange={e => handleDeliveryField(order.id, "date", e.target.value)} />
                </div>
                <div>
                  <input type="time" className="fi" value={dd.time} onChange={e => handleDeliveryField(order.id, "time", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="dlv-section">
              <span className="dlv-label">Método de pago</span>
              <div className="pay-opts">
                {PAYMENT_OPTS.map(po => (
                  <div key={po.id} className={`pay-opt ${dd.payment === po.id ? "sel" : ""}`} onClick={() => handleDeliveryField(order.id, "payment", po.id)}>
                    <div className="pay-ic">{po.icon}</div>
                    <div className="pay-lb">{po.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document type */}
            <div className="dlv-section">
              <span className="dlv-label">Documento entregado</span>
              <div className="doc-opts">
                {DOC_OPTS.map(d => (
                  <div key={d.id} className={`doc-opt ${dd.document === d.id ? "sel" : ""}`} onClick={() => handleDeliveryField(order.id, "document", d.id)}>
                    <div className="doc-lb">{d.label}</div>
                    <div className="doc-desc">{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="act-row">
              <button className="btn-cancel" onClick={() => setExpandedId(null)}>Cancelar</button>
              <button className="btn-confirm" disabled={!dd.payment} onClick={() => confirmDelivery(order.id)}>
                ✓ Confirmar Entrega
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="hdr">
        <div className="hdr-top">
          <div className="logo-a">
            <div className="logo-m">AT</div>
            <div><div className="logo-t">Aceites Tapia</div><div className="logo-s">Panel Repartidor</div></div>
          </div>
          <span className="driver-name">🚚 Repartidor</span>
        </div>
        <div className="nav">
          <button className={`nb ${tab === "pendientes" ? "on" : ""}`} onClick={() => setTab("pendientes")}>
            Pendientes{pendingOrders.length > 0 && <span className="bdg">{pendingOrders.length}</span>}
          </button>
          <button className={`nb ${tab === "entregados" ? "on" : ""}`} onClick={() => setTab("entregados")}>
            Entregados{deliveredOrders.length > 0 && <span className="bdg bdg-g">{deliveredOrders.length}</span>}
          </button>
        </div>
      </div>

      <div className="main">
        {tab === "pendientes" && (
          <>
            <div className="stit">Pedidos Pendientes</div>
            <div className="ssub">{pendingOrders.length} pedido{pendingOrders.length !== 1 ? "s" : ""} por entregar · Toca para gestionar</div>
            {pendingOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--tm)" }}>
                <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.4 }}>✅</div>
                <p style={{ fontSize: 13 }}>¡Todo entregado! No hay pedidos pendientes.</p>
              </div>
            ) : pendingOrders.map(renderOrderCard)}
          </>
        )}

        {tab === "entregados" && (
          <>
            <div className="stit">Pedidos Entregados</div>
            <div className="ssub">{deliveredOrders.length} entrega{deliveredOrders.length !== 1 ? "s" : ""} registrada{deliveredOrders.length !== 1 ? "s" : ""}</div>
            {deliveredOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--tm)" }}>
                <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.4 }}>📦</div>
                <p style={{ fontSize: 13 }}>Aún no hay entregas registradas hoy.</p>
              </div>
            ) : deliveredOrders.map(renderOrderCard)}
          </>
        )}
      </div>

      {/* Add product modal */}
      <AddProductModal
        open={showAddModal !== null}
        onClose={() => setShowAddModal(null)}
        onAdd={(pid) => handleAddProduct(showAddModal, pid)}
        existingIds={(editItems[showAddModal] || []).map(i => i.productId)}
      />

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
