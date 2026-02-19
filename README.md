# Aceites Tapia — Portal de Pedidos HORECA (Cliente)

Portal web para que los clientes del canal HORECA realicen pedidos de aceite de oliva virgen extra.

## Funcionalidades

- 📦 Catálogo visual con fotos de productos (solo cajas + Delirium ud)
- 🔍 Buscador y filtros por categoría
- 🛒 Selector de cantidades intuitivo
- 💡 Pedido sugerido basado en historial
- 🔄 Clonar pedidos anteriores
- 🧾 Control de facturación por pedido
- 👤 Perfil de cliente con datos de entrega

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

Copia el archivo de ejemplo y rellena con tus datos:

```bash
cp .env.example .env
```

Edita `.env` con tu URL y key de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_key
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Se abrirá en http://localhost:3000

### 4. Compilar para producción

```bash
npm run build
```

Los archivos se generan en la carpeta `dist/`.

## Despliegue

### GitHub Pages

1. Sube el repositorio a GitHub
2. Ve a Settings → Pages → Source: GitHub Actions
3. O usa Vercel/Netlify conectando el repositorio

### Vercel (recomendado)

1. Conecta tu repositorio de GitHub en vercel.com
2. Configura las variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
3. Deploy automático en cada push

## Tecnologías

- React 18
- Vite 5
- Supabase (backend/auth)
