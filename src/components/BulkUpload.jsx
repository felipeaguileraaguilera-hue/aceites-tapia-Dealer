import { useState, useRef } from "react";
import * as api from '../api';

const TABLES = [
  {
    id: 'zones', label: 'Zonas', icon: '🗺️', desc: 'Zonas de reparto con día y códigos postales',
    columns: ['Código', 'Nombre', 'Descripción', 'Día de reparto', 'Códigos postales', 'Orden de ruta'],
    mapRow: (r) => ({ code: r[0], name: r[1], description: r[2], delivery_day: r[3], postal_codes: r[4], route_order: r[5] }),
    required: ['name', 'delivery_day'],
    upload: (rows) => api.bulkUpsertZones(rows),
    backupTable: 'zones',
  },
  {
    id: 'clients', label: 'Clientes', icon: '👥', desc: 'Datos básicos, tipo, zona y frecuencia',
    columns: ['CIF/NIF', 'Nombre', 'Razón social', 'Tipo', 'Subtipo', 'Contacto', 'Teléfono', 'Email', 'Dirección',
      'Dir. fiscal', 'Ciudad fiscal', 'C.P. fiscal', 'Provincia fiscal', 'Código zona', 'Frecuencia', 'Cód. Alprivawin', 'Notas'],
    mapRow: (r) => ({
      cif_nif: r[0], name: r[1], fiscal_name: r[2], client_type: r[3], client_subtype: r[4],
      contact_person: r[5], phone: r[6], email: r[7], address: r[8],
      fiscal_address: r[9], fiscal_city: r[10], fiscal_postal_code: r[11], fiscal_province: r[12],
      zone_code: r[13], delivery_frequency: r[14], alprivawin_code: r[15], notes: r[16],
    }),
    required: ['cif_nif', 'name'],
    upload: async (rows) => {
      const { data: zones } = await api.getZones(false);
      return api.bulkUpsertClients(rows, zones || []);
    },
    backupTable: 'clients',
  },
  {
    id: 'delivery_points', label: 'Puntos de entrega', icon: '📍', desc: 'Vinculados a cliente por CIF/NIF',
    columns: ['CIF/NIF cliente', 'Nombre punto', 'Dirección', 'Ciudad', 'C.P.', 'Contacto', 'Teléfono', 'Por defecto', 'Es dir. fiscal'],
    mapRow: (r) => ({
      cif_nif: r[0], name: r[1], address: r[2], city: r[3], postal_code: r[4],
      contact_person: r[5], phone: r[6], is_default: r[7], is_fiscal: r[8],
    }),
    required: ['cif_nif', 'name', 'address'],
    upload: (rows) => api.bulkUpsertDeliveryPoints(rows),
    backupTable: 'delivery_points',
  },
  {
    id: 'products', label: 'Productos', icon: '📦', desc: 'Catálogo con precios base',
    columns: ['Código', 'Nombre', 'Descripción', 'Sección', 'Precio base (sin IVA)', 'IVA (%)', 'URL imagen', 'Orden', 'Activo'],
    mapRow: (r) => ({
      code: r[0], name: r[1], description: r[2], section: r[3], base_price: r[4],
      vat_pct: r[5], image_url: r[6], display_order: r[7], active: r[8],
    }),
    required: ['code', 'name'],
    upload: (rows) => api.bulkUpsertProducts(rows),
    backupTable: 'products',
  },
  {
    id: 'price_levels', label: 'Niveles de tarifa', icon: '💰', desc: '% de descuento por nivel',
    columns: ['Código nivel', 'Nombre', '% Descuento', 'Descripción', 'Orden'],
    mapRow: (r) => ({ code: r[0], name: r[1], discount_pct: r[2], description: r[3], sort_order: r[4] }),
    required: ['code', 'name'],
    upload: (rows) => api.bulkUpsertPriceLevels(rows),
    backupTable: 'price_levels',
  },
  {
    id: 'distributor_prices', label: 'Precios distribuidores', icon: '🏷️', desc: 'Tarifa específica por producto',
    columns: ['Código producto', 'Nombre (referencia)', 'Precio (sin IVA)'],
    mapRow: (r) => ({ product_code: r[0], name_ref: r[1], price: r[2] }),
    required: ['product_code', 'price'],
    upload: (rows) => api.bulkUpsertDistributorPrices(rows),
    backupTable: 'distributor_prices',
  },
  {
    id: 'volume_tiers', label: 'Tramos de volumen', icon: '📊', desc: 'Descuento progresivo anual',
    columns: ['Desde (€)', 'Hasta (€)', '% Descuento adicional', 'Nivel sugerido'],
    mapRow: (r) => ({ min_amount: r[0], max_amount: r[1], extra_discount_pct: r[2], suggested_level: r[3] }),
    required: ['min_amount'],
    upload: (rows) => api.bulkUpsertVolumeTiers(rows),
    backupTable: 'volume_discount_tiers',
  },
];

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        resolve(raw);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsArrayBuffer(file);
  });
}

function PreviewTable({ columns, rows, errors }) {
  const errorRows = new Set(errors.map(e => e.row));
  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 6px', background: 'var(--b8)', color: '#fff', textAlign: 'left', fontSize: 9, whiteSpace: 'nowrap' }}>#</th>
            {columns.map((c, i) => (
              <th key={i} style={{ padding: '4px 6px', background: 'var(--b8)', color: '#fff', textAlign: 'left', fontSize: 9, whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, ri) => (
            <tr key={ri} style={{ background: errorRows.has(ri + 1) ? '#FFF3E0' : ri % 2 ? '#FAFAFA' : '#fff' }}>
              <td style={{ padding: '3px 6px', borderBottom: '1px solid #EEE', color: 'var(--tm)', fontSize: 9 }}>{ri + 1}</td>
              {columns.map((_, ci) => (
                <td key={ci} style={{ padding: '3px 6px', borderBottom: '1px solid #EEE', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row[ci] !== undefined ? String(row[ci]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && <div style={{ fontSize: 9, color: 'var(--tm)', padding: 6 }}>...y {rows.length - 50} filas más</div>}
    </div>
  );
}

export default function BulkUpload({ driverProfile }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [file, setFile] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [step, setStep] = useState('select'); // select, preview, uploading, done
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const raw = await parseExcel(f);
      // Skip header row (row 0) and any rows that start before the data
      // Find the header row (first row that matches expected columns)
      let dataStartIdx = 1; // Default: skip first row (header)
      // Skip rows that are title/subtitle (typically rows 0-3 in our templates)
      const table = TABLES.find(t => t.id === selectedTable);
      const numCols = table.columns.length;
      
      // Find where actual data starts by looking for rows with enough non-empty values
      for (let i = 0; i < Math.min(raw.length, 10); i++) {
        const nonEmpty = raw[i].filter(v => v !== '').length;
        if (nonEmpty >= Math.min(2, numCols)) {
          // Check if this looks like a header
          const firstVal = String(raw[i][0] || '').toLowerCase();
          if (firstVal.includes('código') || firstVal.includes('cif') || firstVal.includes('desde') || firstVal === table.columns[0].toLowerCase()) {
            dataStartIdx = i + 1;
            break;
          }
        }
      }

      const dataRows = raw.slice(dataStartIdx).filter(r => r.some(cell => cell !== '' && cell !== undefined && cell !== null));
      setRawRows(dataRows);

      // Map and validate
      const mapped = dataRows.map(r => table.mapRow(r));
      const errors = [];
      mapped.forEach((row, idx) => {
        const missing = table.required.filter(f => !row[f] && row[f] !== 0);
        if (missing.length) errors.push({ row: idx + 1, error: `Campos obligatorios vacíos: ${missing.join(', ')}` });
      });
      setParsedRows(mapped);
      setValidationErrors(errors);
      setStep('preview');
    } catch (err) {
      alert('Error al leer el archivo: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    const table = TABLES.find(t => t.id === selectedTable);
    setStep('uploading');
    setLoading(true);

    // Backup current data
    const backup = await api.getTableBackup(table.backupTable);

    // Execute upload
    const res = await table.upload(parsedRows);
    setResult(res);

    // Log the upload
    await api.logBulkUpload({
      table_name: table.backupTable,
      uploaded_by: driverProfile?.id || null,
      filename: file?.name || '',
      rows_processed: parsedRows.length,
      rows_success: res.success,
      rows_error: res.errors?.length || 0,
      errors: res.errors?.length ? res.errors : null,
      backup_data: backup,
      status: res.errors?.length ? 'completed_with_errors' : 'completed',
    });

    setLoading(false);
    setStep('done');
  };

  const reset = () => {
    setSelectedTable(null); setFile(null); setRawRows([]); setParsedRows([]);
    setValidationErrors([]); setStep('select'); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // STEP 1: Select table
  if (step === 'select' && !selectedTable) {
    return (
      <>
        <div className="stit">Carga Masiva de Datos</div>
        <div className="ssub">Selecciona la tabla que quieres actualizar con un archivo Excel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {TABLES.map(t => (
            <div key={t.id} className="ro" style={{ cursor: 'pointer' }} onClick={() => { setSelectedTable(t.id); }}>
              <div className="ro-top" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24 }}>{t.icon}</div>
                <div>
                  <div className="ro-client">{t.label}</div>
                  <div className="ro-id">{t.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  const table = TABLES.find(t => t.id === selectedTable);

  // STEP 1b: File upload
  if (step === 'select' && selectedTable) {
    return (
      <>
        <button className="btn-cancel" style={{ padding: '5px 12px', fontSize: 10, marginBottom: 10 }} onClick={reset}>← Volver</button>
        <div className="stit">{table.icon} {table.label}</div>
        <div className="ssub">{table.desc}</div>

        <div style={{ background: 'var(--b0)', padding: 14, borderRadius: 10, marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', textTransform: 'uppercase', marginBottom: 6 }}>Columnas esperadas</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {table.columns.map((c, i) => {
              const fieldName = Object.keys(table.mapRow(table.columns.map(() => '')))[i];
              const isRequired = table.required.includes(fieldName);
              return (
                <span key={i} style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 4, background: isRequired ? '#FFF3E0' : '#F5F5F5',
                  border: isRequired ? '1px solid #FFE0B2' : '1px solid #EEE', fontWeight: isRequired ? 600 : 400,
                }}>{c}{isRequired ? ' *' : ''}</span>
              );
            })}
          </div>

          <div style={{ fontSize: 10, color: 'var(--tm)', marginBottom: 8 }}>
            Los campos marcados con * son obligatorios. La primera fila del Excel debe ser la cabecera (se ignora automáticamente).
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 16, border: '2px dashed var(--b3)', borderRadius: 10, cursor: 'pointer',
            background: '#FAFAFA', transition: '.2s',
          }}>
            <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleFileSelect} style={{ display: 'none' }} />
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>
                {loading ? 'Procesando...' : 'Haz clic para seleccionar archivo'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--tm)' }}>.xlsx, .xls o .csv</div>
            </div>
          </label>
        </div>
      </>
    );
  }

  // STEP 2: Preview
  if (step === 'preview') {
    return (
      <>
        <button className="btn-cancel" style={{ padding: '5px 12px', fontSize: 10, marginBottom: 10 }} onClick={reset}>← Volver</button>
        <div className="stit">{table.icon} {table.label} — Vista previa</div>
        <div className="ssub">{parsedRows.length} fila{parsedRows.length !== 1 ? 's' : ''} encontrada{parsedRows.length !== 1 ? 's' : ''} en {file?.name}</div>

        {validationErrors.length > 0 && (
          <div style={{ background: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#E65100', marginBottom: 4 }}>⚠️ {validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} de validación</div>
            <div style={{ maxHeight: 100, overflowY: 'auto' }}>
              {validationErrors.map((e, i) => (
                <div key={i} style={{ fontSize: 10, color: '#BF360C', padding: '1px 0' }}>Fila {e.row}: {e.error}</div>
              ))}
            </div>
          </div>
        )}

        <PreviewTable columns={table.columns} rows={rawRows} errors={validationErrors} />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn-cancel" style={{ flex: 1 }} onClick={reset}>Cancelar</button>
          <button className="btn-confirm" style={{ flex: 1 }} onClick={handleUpload}>
            ✓ Cargar {parsedRows.length} fila{parsedRows.length !== 1 ? 's' : ''}
            {validationErrors.length > 0 && ` (${validationErrors.length} con errores)`}
          </button>
        </div>

        <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 6, textAlign: 'center' }}>
          Se creará un backup automático de los datos actuales antes de la carga.
          {validationErrors.length > 0 && ' Las filas con error se omitirán.'}
        </div>
      </>
    );
  }

  // STEP 3: Uploading
  if (step === 'uploading') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <div className="loading-spin" style={{ margin: '0 auto 16px' }} />
        <div className="stit" style={{ fontSize: 15 }}>Cargando datos...</div>
        <div className="ssub">Procesando {parsedRows.length} filas en {table.label}</div>
      </div>
    );
  }

  // STEP 4: Done
  if (step === 'done') {
    const hasErrors = result?.errors?.length > 0;
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{hasErrors ? '⚠️' : '✅'}</div>
        <div className="stit">{hasErrors ? 'Carga completada con errores' : '¡Carga completada!'}</div>
        <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginTop: 8 }}>
          <strong>{result.success}</strong> fila{result.success !== 1 ? 's' : ''} cargada{result.success !== 1 ? 's' : ''} correctamente
          {hasErrors && <><br /><strong style={{ color: 'var(--rd)' }}>{result.errors.length}</strong> error{result.errors.length !== 1 ? 'es' : ''}</>}
        </div>

        {hasErrors && (
          <div style={{ background: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 12, textAlign: 'left', maxHeight: 150, overflowY: 'auto' }}>
            {result.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 10, color: '#BF360C', padding: '2px 0' }}>Fila {e.row}: {e.error}</div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 10 }}>
          Se ha guardado un backup de los datos anteriores para posible restauración.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button className="btn-confirm" style={{ padding: '10px 24px' }} onClick={reset}>Otra carga</button>
        </div>
      </div>
    );
  }

  return null;
}
