import { useState } from "react";
import ZoneManager from './ZoneManager';
import PriceLevelManager from './PriceLevelManager';
import BulkOperations from './BulkOperations';
import BulkUpload from './BulkUpload';

const SECTIONS = [
  { id: 'zones', icon: '🗺️', label: 'Zonas', desc: 'Gestión de zonas de reparto' },
  { id: 'pricing', icon: '💰', label: 'Tarifas', desc: 'Niveles y descuentos' },
  { id: 'bulk', icon: '⚡', label: 'En bloque', desc: 'Operaciones masivas' },
  { id: 'upload', icon: '📤', label: 'Carga masiva', desc: 'Subir datos desde Excel' },
];

export default function AdminPanel({ driverProfile }) {
  const [section, setSection] = useState(null);

  if (!section) {
    return (
      <>
        <div className="stit">Panel de Administración</div>
        <div className="ssub">Gestión avanzada del sistema</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {SECTIONS.map(s => (
            <div key={s.id} className="ro" style={{ cursor: 'pointer' }} onClick={() => setSection(s.id)}>
              <div className="ro-top" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div>
                  <div className="ro-client">{s.label}</div>
                  <div className="ro-id">{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <button className="btn-cancel" style={{ padding: '5px 12px', fontSize: 10, marginBottom: 10 }}
        onClick={() => setSection(null)}>← Panel Admin</button>
      {section === 'zones' && <ZoneManager />}
      {section === 'pricing' && <PriceLevelManager />}
      {section === 'bulk' && <BulkOperations />}
      {section === 'upload' && <BulkUpload driverProfile={driverProfile} />}
    </>
  );
}
