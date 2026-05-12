# 🌸 Mi Lencería — Tienda Online Completa v2.0

Tienda e-commerce completa con React + Vite + MercadoPago, lista para publicar en Vercel.

## ✨ Features incluidas

### Frontend
- Hero animado con galería de imágenes
- **Countdown timer** de oferta en tiempo real
- **Barra de envío gratis** con progreso dinámico
- **Buscador** en tiempo real con filtro por nombre/descripción
- **Filtros por categoría** (Conjuntos, Pijamas, Batas, Bodys, Less, Packs)
- **Ordenamiento** (precio, rating, más reseñas)
- **Modal de producto** con galería, selector de talle/color, guía de talles
- **Guía de talles** con tabla completa (Conjuntos, Pijamas, Batas)
- **Favoritos** (wishlist persistente en sesión)
- **Vista rápida** al hover sobre cada producto
- **Toast notifications** para todas las acciones
- **Carrito lateral** con progreso de envío gratis
- **Indicadores de stock bajo** ("Solo 3 disponibles")
- **Ratings y reseñas** con estrellas
- **Badges** de descuento calculado automáticamente
- **Sección Emprendedoras** con stats
- **Testimonios** con paginación
- **Feed de Instagram** simulado
- **Newsletter** con suscripción
- **Botón flotante de WhatsApp**
- **Botón volver arriba**
- **Footer completo** con medios de pago, envíos y links
- **Diseño responsive** mobile-first

### Backend
- **MercadoPago Checkout Pro** integrado (Serverless en Vercel)
- **Spinner de carga** durante el proceso de pago
- **Manejo de errores** con mensajes claros

---

## 🚀 Instalación rápida

```bash
# 1. Instalar dependencias
npm install
npm install mercadopago

# 2. Crear .env en la raíz
echo "MP_ACCESS_TOKEN=TEST-xxxxxxxx" > .env

# 3. Correr localmente
npm run dev
```

---

## ☁️ Publicar en Vercel

```bash
# Opción A — CLI
npx vercel --prod

# Opción B — GitHub
# 1. Subí a GitHub
# 2. Importá en vercel.com/new
# 3. Agregá MP_ACCESS_TOKEN en Environment Variables
```

---

## 💳 Configurar MercadoPago

1. Entrá a https://www.mercadopago.com.ar/developers/panel
2. Creá una aplicación
3. Copiá el **Access Token**
   - Para pruebas: token TEST-...
   - Para producción: token APP_USR-...
4. Agregalo como variable de entorno `MP_ACCESS_TOKEN`

---

## 🛍️ Personalizar productos

Editá `src/products.js`:

```js
{
  id: 1,
  name: 'Nombre del producto',
  category: 'conjuntos', // conjuntos|pijamas|batas|less|bodys|packs
  price: 9990,
  originalPrice: 12000,  // null si no hay descuento
  description: '...',
  tag: 'Nuevo',          // null | 'Más vendido' | 'Nuevo' | 'Oferta' | '¡Revendé!' | 'Exclusivo'
  images: ['url1', 'url2', 'url3'],  // hasta 3 imágenes
  talles: ['80', '85', '90'],
  colores: [
    { nombre: 'Negro', hex: '#1A1614' },
  ],
  stock: true,
  stockBajo: false,
  unidadesRestantes: null, // número si stockBajo es true
  rating: 4.8,
  reviews: 150,
  material: 'Encaje + elastano',
  cuidados: 'Lavar a mano.',
  tipoTalle: 'conjuntos', // 'conjuntos' | 'pijamas' | 'batas' | null
}
```

---

## 🎨 Personalizar colores

En `src/App.jsx`, objeto `C`:

```js
const C = {
  rose: '#7D1E3A',      // Color principal (bordo/rosa)
  gold: '#C4965A',      // Acento dorado
  cream: '#FAF7F4',     // Fondo
  charcoal: '#1A1614',  // Texto oscuro
}
```

---

## 📱 WhatsApp

Reemplazá el número en `App.jsx`:

```
href="https://wa.me/5491100000000"
```

Por ejemplo: `https://wa.me/5491155667788`

---

## 🗂️ Estructura

```
tienda/
├── src/
│   ├── App.jsx         ← Toda la UI (componentes, lógica, estado)
│   ├── products.js     ← Catálogo de productos y tabla de talles
│   ├── main.jsx        ← Entry point React
│   └── index.css       ← Estilos globales y animaciones
├── api/
│   └── create-preference.js  ← Backend MercadoPago (Vercel Serverless)
├── public/             ← Imágenes estáticas (opcional)
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```
