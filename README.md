# Aceites Tapia — Panel del Repartidor HORECA

Aplicación para gestionar entregas, registrar pagos y modificar pedidos en el momento de la entrega.

## Funcionalidades

- 📋 Lista de pedidos pendientes con datos del cliente
- 📞 Acceso directo al teléfono del cliente
- ✏️ Modificar cantidades y añadir productos al pedido
- 💶 Registrar método de pago (efectivo/tarjeta/transferencia/pendiente)
- 🧾 Elegir documento entregado (nota/factura/ambas)
- 📅 Registrar fecha y hora de entrega
- ✅ Historial de entregas completadas
- 📧 Notificación automática al cliente y administración

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

```bash
cp .env.example .env
```

Edita `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_key
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Se abrirá en http://localhost:3001

### 4. Compilar para producción

```bash
npm run build
```

## Tecnologías

- React 18
- Vite 5
- Supabase (backend/auth)
