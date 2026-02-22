import { useState, useEffect, useMemo } from "react";
import * as api from '../api';

const KG_PER_LITRE = 0.916;

export default function LoadDocument({ catalog }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [surplus, setSurplus] = useState({}); // productId -> extra boxes
  const [showSurplus, setShowSurplus] = useState(false);
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await api.getAllPendingOrders();
      if (data) setOrders(data);
      setDateLabel(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      setLoading(false);
    })();
  }, []);

  // Aggregate quantities per product across all pending orders
  const productTotals = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      (o.order_items || []).forEach(item => {
        if (!map[item.product_id]) map[item.product_id] = { ordered: 0, orders: 0 };
        map[item.product_id].ordered += item.quantity || 0;
        map[item.product_id].orders++;
      });
    });
    return map;
  }, [orders]);

  // Build load lines
  const loadLines = useMemo(() => {
    const lines = [];
    catalog.forEach(p => {
      const ordered = productTotals[p.id]?.ordered || 0;
      const extra = parseInt(surplus[p.id]) || 0;
      const total = ordered + extra;
      if (total <= 0) return;

      const unitsPerBox = p.units_per_box || 1;
      const mlPerUnit = p.ml_per_unit || 0;
      const litresPerBox = (unitsPerBox * mlPerUnit) / 1000;
      const totalLitres = total * litresPerBox;
      const totalKg = totalLitres * KG_PER_LITRE;

      lines.push({
        id: p.id, name: p.name, section: p.section, description: p.description,
        ordered, extra, total,
        unitsPerBox, mlPerUnit, litresPerBox,
        totalUnits: total * unitsPerBox,
        totalLitres, totalKg,
      });
    });
    return lines;
  }, [catalog, productTotals, surplus]);

  // Grand totals
  const grandTotals = useMemo(() => ({
    boxes: loadLines.reduce((s, l) => s + l.total, 0),
    units: loadLines.reduce((s, l) => s + l.totalUnits, 0),
    litres: loadLines.reduce((s, l) => s + l.totalLitres, 0),
    kg: loadLines.reduce((s, l) => s + l.totalKg, 0),
  }), [loadLines]);

  const handleSurplus = (productId, val) => {
    setSurplus(prev => {
      const next = { ...prev };
      const n = parseInt(val) || 0;
      if (n <= 0) delete next[productId];
      else next[productId] = n;
      return next;
    });
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="loading"><div className="loading-spin" /><p>Cargando pedidos...</p></div>;

  return (
    <div>
      {/* Screen header (hidden on print) */}
      <div className="no-print">
        <div className="stit">Documento de Carga</div>
        <div className="ssub">{dateLabel} · {orders.length} pedido{orders.length !== 1 ? 's' : ''} pendientes</div>

        {/* Surplus toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
          <button className={`chip ${showSurplus ? 'on' : ''}`} style={{ fontSize: 10, padding: '4px 12px' }}
            onClick={() => setShowSurplus(!showSurplus)}>
            {showSurplus ? '✓ Excedente activado' : '+ Añadir excedente'}
          </button>
          <button className="btn-confirm" style={{ padding: '6px 14px', fontSize: 11 }} onClick={handlePrint}>🖨️ Imprimir</button>
        </div>
      </div>

      {/* Print header (shown only on print) */}
      <div className="print-only" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1A2016', paddingBottom: 8 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>Aceites Tapia</div>
            <div style={{ fontSize: 11, color: '#666' }}>Documento de Carga</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{dateLabel}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{orders.length} pedidos</div>
          </div>
        </div>
      </div>

      {/* Load table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#2A3326', color: '#fff' }}>
            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 600 }}>Producto</th>
            <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: 9, fontWeight: 600, width: 50 }}>Pedido</th>
            {showSurplus && <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: 9, fontWeight: 600, width: 60 }} className="no-print-cell">Extra</th>}
            <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: 9, fontWeight: 600, width: 50 }}>Total</th>
            <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: 9, fontWeight: 600, width: 55 }}>Litros</th>
            <th style={{ padding: '6px 4px', textAlign: 'right', fontSize: 9, fontWeight: 600, width: 55 }}>Kg</th>
          </tr>
        </thead>
        <tbody>
          {loadLines.map((l, i) => (
            <tr key={l.id} style={{ background: i % 2 ? '#FAFAFA' : '#fff', borderBottom: '1px solid #EEE' }}>
              <td style={{ padding: '5px 8px' }}>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{l.name}</div>
                <div style={{ fontSize: 9, color: '#8A9A86' }}>
                  {l.description}{l.litresPerBox > 0 && ` · ${l.litresPerBox.toFixed(1)}L/caja`}
                </div>
              </td>
              <td style={{ textAlign: 'center', fontWeight: 600 }}>{l.ordered}</td>
              {showSurplus && (
                <td style={{ textAlign: 'center' }} className="no-print-cell">
                  <input type="number" min="0" value={surplus[l.id] || ''} onChange={e => handleSurplus(l.id, e.target.value)}
                    style={{ width: 42, padding: '2px 4px', border: '1.5px solid #DDD', borderRadius: 4, textAlign: 'center', fontSize: 11, fontFamily: "'DM Sans',sans-serif" }} placeholder="0" />
                </td>
              )}
              <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: l.extra > 0 ? '#E6A817' : '#1A2016' }}>
                {l.total}{l.extra > 0 && <span style={{ fontSize: 8, color: '#E6A817', display: 'block' }}>+{l.extra}</span>}
              </td>
              <td style={{ textAlign: 'right', color: '#4A5A46' }}>{l.totalLitres > 0 ? l.totalLitres.toFixed(1) : '—'}</td>
              <td style={{ textAlign: 'right', color: '#4A5A46' }}>{l.totalKg > 0 ? l.totalKg.toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#F0F9EE', borderTop: '2px solid #2A3326' }}>
            <td style={{ padding: '8px', fontWeight: 700, fontSize: 12 }}>TOTAL</td>
            <td colSpan={showSurplus ? 2 : 1} style={{ textAlign: 'center' }}></td>
            <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display',serif" }}>{grandTotals.boxes}</td>
            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{grandTotals.litres > 0 ? grandTotals.litres.toFixed(1) + ' L' : '—'}</td>
            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{grandTotals.kg > 0 ? grandTotals.kg.toFixed(1) + ' kg' : '—'}</td>
          </tr>
        </tfoot>
      </table>

      {/* Summary boxes */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 80, background: '#F0F9EE', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{grandTotals.boxes}</div>
          <div style={{ fontSize: 9, color: '#8A9A86', fontWeight: 600 }}>CAJAS</div>
        </div>
        {grandTotals.litres > 0 && (
          <div style={{ flex: 1, minWidth: 80, background: '#FFF3E0', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: '#E6A817' }}>{grandTotals.litres.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: '#8A9A86', fontWeight: 600 }}>LITROS</div>
          </div>
        )}
        {grandTotals.kg > 0 && (
          <div style={{ flex: 1, minWidth: 80, background: '#E3F2FD', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: '#1565C0' }}>{grandTotals.kg.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: '#8A9A86', fontWeight: 600 }}>KG</div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 80, background: '#FAFAFA', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{loadLines.length}</div>
          <div style={{ fontSize: 9, color: '#8A9A86', fontWeight: 600 }}>REFERENCIAS</div>
        </div>
      </div>

      {/* Per-order breakdown (collapsible) */}
      <details style={{ marginTop: 16 }} className="no-print">
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#4A5A46', padding: '8px 0' }}>
          📦 Detalle por pedido ({orders.length})
        </summary>
        {orders.map(o => {
          const client = o.clients || {};
          return (
            <div key={o.id} style={{ padding: '6px 0', borderBottom: '1px solid #F0F0F0', fontSize: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{client.name || 'Cliente'}</span>
                <span style={{ color: '#8A9A86' }}>{o.id}</span>
              </div>
              <div style={{ color: '#4A5A46' }}>
                {(o.order_items || []).map(i => {
                  const p = catalog.find(x => x.id === i.product_id);
                  return `${i.quantity}× ${p?.name || i.product_id}`;
                }).join(' · ')}
              </div>
            </div>
          );
        })}
      </details>

      {/* Print styles injected */}
      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print, .no-print-cell, .hdr, .nav { display: none !important; }
          .print-only { display: block !important; }
          .app { box-shadow: none; max-width: 100%; }
          .main { padding: 0; }
          body { background: #fff; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
