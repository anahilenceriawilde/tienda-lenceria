import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { products, categories, tallasGuide } from './products.js'

// ─── Theme tokens ────────────────────────────────────────────────────────────
const C = {
  rose: '#7D1E3A', roseH: '#9B2547', rosePale: '#F7EAF0', rosePale2: '#FCEEF5',
  gold: '#C4965A', goldL: '#E8C98A',
  cream: '#FAF7F4', cream2: '#F3EDE6',
  charcoal: '#1A1614', muted: '#7A6C68', border: '#E5D9D0',
  green: '#15803D', mpBlue: '#009EE3',
}
const FONT_D = "'Cormorant Garamond',Georgia,serif"
const FONT_B = "'DM Sans',-apple-system,sans-serif"
const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
const FREE_SHIP = 30000

// ─── Tiny helpers ────────────────────────────────────────────────────────────
const tagColors = {
  'Más vendido': { bg: C.rose, color: '#FAF7F4' },
  'Oferta': { bg: '#B91C1C', color: '#FAF7F4' },
  'Nuevo': { bg: C.gold, color: '#FAF7F4' },
  '¡Revendé!': { bg: C.charcoal, color: '#FAF7F4' },
  'Exclusivo': { bg: '#7C3AED', color: '#FAF7F4' },
}

function Badge({ text }) {
  const s = tagColors[text] || { bg: C.muted, color: '#FAF7F4' }
  return <span style={{ display: 'inline-block', padding: '3px 10px', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', borderRadius: 3, background: s.bg, color: s.color }}>{text}</span>
}

function Stars({ rating, reviews, small }) {
  const full = Math.floor(rating), half = rating % 1 >= .5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: C.gold, fontSize: small ? 12 : 14 }}>
        {'★'.repeat(full)}{half ? '½' : ''} {'☆'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      {reviews != null && <span style={{ fontSize: small ? 11 : 12, color: C.muted }}>({reviews})</span>}
    </div>
  )
}

function ColorDot({ color, selected, onClick }) {
  const isLight = ['#E8E8E8', '#F9A8D4', '#F0F0F0', '#F5DEB3', '#BAE6FD', '#BBF7D0', '#DDD6FE', '#FDA4AF', '#93C5FD', '#C4B5FD', '#67E8F9', '#FCA5A5', '#9CA3AF'].includes(color.hex)
  return (
    <button onClick={onClick} title={color.nombre}
      style={{
        width: 22, height: 22, borderRadius: '50%', background: color.hex,
        border: selected ? `3px solid ${C.rose}` : `2px solid ${isLight ? C.border : color.hex}`,
        outline: selected ? `2px solid ${C.rosePale}` : 'none',
        cursor: 'pointer', transition: 'transform .15s', transform: selected ? 'scale(1.2)' : 'scale(1)', flexShrink: 0
      }} />
  )
}

// ─── Toast System ────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? C.green : t.type === 'fav' ? C.rose : C.charcoal,
          color: '#FAF7F4', borderRadius: 8, padding: '12px 20px',
          fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          animation: `${t.exiting ? 'toastOut' : 'toastIn'} .3s ease both`,
          display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>{t.msg}
        </div>
      ))}
    </div>
  )
}

function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = (msg, icon = '✓', type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, icon, type, exiting: false }])
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t)), 2200)
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2500)
  }
  return { toasts, add }
}

// ─── Free Shipping Bar ───────────────────────────────────────────────────────
function ShippingBar({ total }) {
  const pct = Math.min(100, Math.round(total / FREE_SHIP * 100))
  const left = FREE_SHIP - total
  return (
    <div style={{ background: C.rosePale2, borderBottom: `1px solid ${C.border}`, padding: '8px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>🚚</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 5, color: C.charcoal }}>
            {total >= FREE_SHIP
              ? '🎉 ¡Conseguiste envío gratis!'
              : <>Te faltan <strong style={{ color: C.rose }}>{fmt(left)}</strong> para el envío gratis</>}
          </p>
          <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${C.rose},${C.gold})`, borderRadius: 3, transition: 'width .5s ease' }} />
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.rose, minWidth: 36 }}>{pct}%</span>
      </div>
    </div>
  )
}

// ─── Offer Countdown ─────────────────────────────────────────────────────────
function useCountdown(hours = 24) {
  const endRef = useRef(Date.now() + hours * 3600000)
  const [time, setTime] = useState({ h: hours, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endRef.current - Date.now())
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function CountdownBanner() {
  const { h, m, s } = useCountdown(23)
  const pad = n => String(n).padStart(2, '0')
  return (
    <div style={{ background: `linear-gradient(90deg,${C.charcoal},#3D0E20)`, color: '#FAF7F4', padding: '10px 24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, letterSpacing: '.08em', opacity: .8 }}>🔥 OFERTA ESPECIAL — TERMINA EN:</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {[{ v: h, l: 'HS' }, { v: m, l: 'MIN' }, { v: s, l: 'SEG' }].map(({ v, l }, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: i < 2 ? 10 : 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 10px', fontFamily: FONT_D, fontSize: 24, fontWeight: 700, letterSpacing: '.02em', minWidth: 48 }}>{pad(v)}</div>
              <div style={{ fontSize: 9, letterSpacing: '.12em', opacity: .6, marginTop: 2 }}>{l}</div>
            </div>
            {i < 2 && <span style={{ fontSize: 20, fontWeight: 700, opacity: .5, marginBottom: 12 }}>:</span>}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.goldL }}>Descuentos de hasta 25% en packs</span>
    </div>
  )
}

// ─── Size Guide Modal ────────────────────────────────────────────────────────
function SizeGuide({ product, onClose }) {
  const key = product?.tipoTalle
  const rows = key ? tallasGuide[key] : null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(26,22,20,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', animation: 'fadeInScale .25s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: FONT_D, fontSize: 26, fontWeight: 600 }}>Guía de Talles</h2>
          <button onClick={onClose} style={{ fontSize: 24, color: C.muted, cursor: 'pointer' }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Medidas en centímetros. Tomate las medidas sin ropa ajustada.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 24 }}>
          {[{ icon: '📏', title: 'Busto', desc: 'Medí la parte más ancha del pecho, pasando por los pezones.' },
          { icon: '📐', title: 'Cintura', desc: 'En el punto más estrecho, generalmente por encima del ombligo.' },
          { icon: '📏', title: 'Cadera', desc: 'En la parte más ancha de tus caderas y glúteos.' }].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: C.cream, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        {rows ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.rose, color: '#FAF7F4' }}>
                  {['Talle', 'Busto', 'Cintura', 'Cadera'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.talle} style={{ background: i % 2 ? C.cream : '#fff' }}>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: C.rose }}>{r.talle}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', color: C.charcoal }}>{r.busto}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', color: C.charcoal }}>{r.cintura}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', color: C.charcoal }}>{r.cadera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: C.muted, textAlign: 'center', padding: '20px 0' }}>Este producto viene en talle único/surtido.</p>
        )}
        <div style={{ marginTop: 20, background: C.rosePale, borderRadius: 8, padding: 12, fontSize: 12, color: C.rose }}>
          💡 <strong>Consejo:</strong> Si estás entre dos talles, te recomendamos elegir el mayor para mayor comodidad. Todos nuestros diseños tienen elastano.
        </div>
      </div>
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onAddToCart, favorites, toggleFav, showToast }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [talle, setTalle] = useState(product.talles[0])
  const [color, setColor] = useState(product.colores[0])
  const [qty, setQty] = useState(1)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const isFav = favorites.has(product.id)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAddToCart({ ...product, selectedTalle: talle, selectedColor: color })
    showToast(`${product.name} agregado al carrito 🛒`)
    onClose()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(26,22,20,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'fadeInScale .3s ease', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 500 }}>
            {/* Gallery */}
            <div style={{ background: C.cream2, position: 'relative' }}>
              <img src={product.images[imgIdx]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 400, transition: 'opacity .25s' }} />
              {product.tag && <div style={{ position: 'absolute', top: 16, left: 16 }}><Badge text={product.tag} /></div>}
              <button onClick={() => toggleFav(product.id)}
                style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
                {isFav ? '❤️' : '🤍'}
              </button>
              {product.images.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                  {product.images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: imgIdx === i ? C.rose : C.border, border: 'none', cursor: 'pointer', transition: 'all .2s' }} />
                  ))}
                </div>
              )}
              {product.images.length > 1 && (
                <div style={{ position: 'absolute', inset: '50% 0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                  <button onClick={() => setImgIdx(p => (p - 1 + product.images.length) % product.images.length)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.9)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                  <button onClick={() => setImgIdx(p => (p + 1) % product.images.length)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.9)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                </div>
              )}
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '8px', background: 'rgba(255,255,255,.6)', position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)' }}>
                  {product.images.map((src, i) => (
                    <img key={i} src={src} alt="" onClick={() => setImgIdx(i)}
                      style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: `2px solid ${imgIdx === i ? C.rose : 'transparent'}`, opacity: imgIdx === i ? 1 : .7, transition: 'all .2s' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{product.category}</p>
                <h2 style={{ fontFamily: FONT_D, fontSize: 28, fontWeight: 600, lineHeight: 1.2, marginBottom: 8 }}>{product.name}</h2>
                <Stars rating={product.rating} reviews={product.reviews} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: FONT_D, fontSize: 34, fontWeight: 700, color: C.rose }}>{fmt(product.price)}</span>
                {product.originalPrice && <span style={{ fontSize: 16, color: C.muted, textDecoration: 'line-through' }}>{fmt(product.originalPrice)}</span>}
                {product.originalPrice && <span style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
              </div>

              {product.stockBajo && product.unidadesRestantes && (
                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚠️ ¡Solo quedan <strong>{product.unidadesRestantes} unidades</strong>!
                </div>
              )}

              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{product.description}</p>

              {/* Color */}
              <div>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Color: <strong>{color.nombre}</strong></p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {product.colores.map(c => (
                    <ColorDot key={c.nombre} color={c} selected={color.nombre === c.nombre} onClick={() => setColor(c)} />
                  ))}
                </div>
              </div>

              {/* Talle */}
              {product.talles.length > 1 && product.talles[0] !== 'Surtido' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 13 }}>Talle: <strong>{talle}</strong></p>
                    <button onClick={() => setShowSizeGuide(true)} style={{ fontSize: 12, color: C.rose, cursor: 'pointer', textDecoration: 'underline' }}>Guía de talles</button>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {product.talles.map(t => (
                      <button key={t} onClick={() => setTalle(t)}
                        style={{ minWidth: 44, padding: '6px 8px', fontSize: 13, border: `1.5px solid ${talle === t ? C.rose : C.border}`, borderRadius: 6, background: talle === t ? C.rosePale : 'transparent', color: talle === t ? C.rose : C.charcoal, fontWeight: talle === t ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 44, fontSize: 18, cursor: 'pointer', color: C.charcoal }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 40, height: 44, fontSize: 18, cursor: 'pointer', color: C.charcoal }}>+</button>
                </div>
                <button onClick={handleAdd}
                  style={{ flex: 1, padding: '12px', background: C.rose, color: '#FAF7F4', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.roseH}
                  onMouseLeave={e => e.currentTarget.style.background = C.rose}>
                  Agregar al carrito
                </button>
              </div>

              {/* Detalles */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['🧵', 'Material', product.material], ['🧼', 'Cuidado', product.cuidados], ['🚚', 'Envío', 'Todo el país · Gratis desde ' + fmt(FREE_SHIP)]].map(([ic, lbl, val]) => (
                  <div key={lbl} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.muted }}>
                    <span>{ic}</span><span><strong style={{ color: C.charcoal }}>{lbl}:</strong> {val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showSizeGuide && <SizeGuide product={product} onClose={() => setShowSizeGuide(false)} />}
    </>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, onOpenModal, favorites, toggleFav }) {
  const [talle, setTalle] = useState(product.talles[0])
  const [color, setColor] = useState(product.colores[0])
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)
  const isFav = favorites.has(product.id)

  const handleAdd = e => {
    e.stopPropagation()
    onAddToCart({ ...product, selectedTalle: talle, selectedColor: color })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const disc = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null

  return (
    <article onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
        transition: 'transform .25s,box-shadow .25s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 40px rgba(125,30,58,.12)` : '0 2px 8px rgba(0,0,0,.04)'
      }}>
      {/* Image */}
      <div style={{ position: 'relative', paddingTop: '115%', overflow: 'hidden', background: C.cream2 }} onClick={() => onOpenModal(product)}>
        <img src={product.images[0]} alt={product.name} loading="lazy"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
        {product.tag && <div style={{ position: 'absolute', top: 10, left: 10 }}><Badge text={product.tag} /></div>}
        {disc && <div style={{ position: 'absolute', top: product.tag ? 34 : 10, left: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 3 }}>-{disc}%</div>}
        {product.stockBajo && product.unidadesRestantes && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(194,65,12,.9)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>
            ¡Solo {product.unidadesRestantes} disponibles!
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); toggleFav(product.id) }}
          style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', opacity: hovered || isFav ? 1 : 0, transition: 'opacity .2s', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>
          {isFav ? '❤️' : '🤍'}
        </button>
        {/* Quick view hint */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,22,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: 'rgba(255,255,255,.95)', color: C.charcoal, fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
              🔍 Vista rápida
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div onClick={() => onOpenModal(product)}>
          <h3 style={{ fontFamily: FONT_D, fontSize: 17, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{product.name}</h3>
          <Stars rating={product.rating} reviews={product.reviews} small />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 700, color: C.rose }}>{fmt(product.price)}</span>
          {product.originalPrice && <span style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through' }}>{fmt(product.originalPrice)}</span>}
        </div>

        {/* Colors */}
        {product.colores.length > 1 && (
          <div onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Color: <strong style={{ color: C.charcoal }}>{color.nombre}</strong></p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {product.colores.map(c => (
                <ColorDot key={c.nombre} color={c} selected={color.nombre === c.nombre} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Talles */}
        {product.talles.length > 1 && product.talles[0] !== 'Surtido' && (
          <div onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Talle: <strong style={{ color: C.charcoal }}>{talle}</strong></p>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {product.talles.map(t => (
                <button key={t} onClick={() => setTalle(t)}
                  style={{
                    minWidth: 32, padding: '3px 5px', fontSize: 11, border: `1px solid ${talle === t ? C.rose : C.border}`, borderRadius: 4,
                    background: talle === t ? C.rosePale : 'transparent', color: talle === t ? C.rose : C.charcoal, fontWeight: talle === t ? 600 : 400, cursor: 'pointer', transition: 'all .15s'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleAdd}
          style={{ marginTop: 'auto', padding: '11px', background: added ? C.green : C.rose, color: '#FAF7F4', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .25s', border: 'none' }}>
          {added ? '✓ ¡Agregado!' : '🛒 Agregar al carrito'}
        </button>
      </div>
    </article>
  )
}

// ─── Cart ────────────────────────────────────────────────────────────────────
function CartSidebar({ cart, open, onClose, onRemove, onQty, onCheckout, cartTotal }) {
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const left = Math.max(0, FREE_SHIP - cartTotal)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,20,.45)', zIndex: 200, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s' }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px,100vw)', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .35s cubic-bezier(.4,0,.2,1)', boxShadow: '-8px 0 40px rgba(0,0,0,.1)'
      }}>

        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 600 }}>Tu carrito</h2>
            <p style={{ fontSize: 12, color: C.muted }}>{count} {count === 1 ? 'producto' : 'productos'}</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 24, color: C.muted, cursor: 'pointer', padding: 4 }}>×</button>
        </div>

        {/* Shipping progress */}
        {cart.length > 0 && (
          <div style={{ padding: '10px 22px', background: C.cream, borderBottom: `1px solid ${C.border}` }}>
            {left > 0
              ? <p style={{ fontSize: 12, color: C.charcoal }}>🚚 Agregá <strong style={{ color: C.rose }}>{fmt(left)}</strong> más para envío gratis</p>
              : <p style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>🎉 ¡Tenés envío gratis!</p>}
            <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.round(cartTotal / FREE_SHIP * 100))}%`, background: `linear-gradient(90deg,${C.rose},${C.gold})`, transition: 'width .4s' }} />
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
              <p style={{ fontFamily: FONT_D, fontSize: 20 }}>Tu carrito está vacío</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>¡Explorá nuestra colección!</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartId} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
              <img src={item.images[0]} alt={item.name} style={{ width: 64, height: 80, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT_D, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Talle: {item.selectedTalle} · {item.selectedColor.nombre}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => onQty(item.cartId, -1)} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.charcoal }}>−</button>
                    <span style={{ fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => onQty(item.cartId, 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.charcoal }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, color: C.rose, fontSize: 15 }}>{fmt(item.price * item.qty)}</span>
                </div>
              </div>
              <button onClick={() => onRemove(item.cartId)} style={{ color: C.muted, fontSize: 20, alignSelf: 'flex-start', cursor: 'pointer', padding: 2, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '18px 22px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>Subtotal</span>
              <span style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 700 }}>{fmt(cartTotal)}</span>
            </div>
            <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 14 }}>Envío calculado al finalizar la compra</p>
            <button onClick={onCheckout}
              style={{ width: '100%', padding: '15px', background: C.mpBlue, color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8, border: 'none', transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#0088CC'}
              onMouseLeave={e => e.currentTarget.style.background = C.mpBlue}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>
              Pagar con MercadoPago
            </button>
            <button onClick={onClose}
              style={{ width: '100%', padding: '11px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Seguir comprando
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  if (!open) return null

  const handlePay = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/create-preference', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(i => ({ title: `${i.name} – Talle ${i.selectedTalle} ${i.selectedColor.nombre}`, quantity: i.qty, unit_price: i.price, currency_id: 'ARS' })) })
      })
      if (!res.ok) throw new Error()
      const { init_point } = await res.json()
      window.location.href = init_point
    } catch {
      setErr('No se pudo conectar con MercadoPago. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(26,22,20,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 460, width: '100%', animation: 'fadeInScale .25s ease' }}>
        <h2 style={{ fontFamily: FONT_D, fontSize: 26, fontWeight: 600, marginBottom: 6 }}>Finalizar compra</h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{cart.reduce((s, i) => s + i.qty, 0)} productos · Total: <strong>{fmt(total)}</strong></p>

        <div style={{ background: C.cream, borderRadius: 10, padding: 16, marginBottom: 22, maxHeight: 200, overflowY: 'auto' }}>
          {cart.map(i => (
            <div key={i.cartId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
              <span>{i.name} <span style={{ color: C.muted }}>×{i.qty} ({i.selectedTalle})</span></span>
              <span style={{ fontWeight: 600 }}>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_D, fontSize: 20, fontWeight: 700, paddingTop: 10, marginTop: 4 }}>
            <span>Total</span><span style={{ color: C.rose }}>{fmt(total)}</span>
          </div>
        </div>

        {err && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>{err}</div>}

        <button onClick={handlePay} disabled={loading}
          style={{ width: '100%', padding: 15, background: loading ? '#7CB9D8' : C.mpBlue, color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginBottom: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {loading ? <><span style={{ display: 'inline-block', width: 18, height: 18, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Conectando...</> : '💳 Pagar con MercadoPago'}
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 12, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
        <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 }}>🔒 Tus datos están protegidos por MercadoPago</p>
      </div>
    </div>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ cartCount, onCartOpen, searchQuery, setSearchQuery, favorites }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const inp = useRef(null)

  useEffect(() => { if (searchOpen) setTimeout(() => inp.current?.focus(), 100) }, [searchOpen])

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Announcement bar */}
      <div style={{ background: C.charcoal, color: '#FAF7F4', height: 34, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3rem', animation: 'marquee 24s linear infinite', whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '.05em' }}>
          {[...Array(5)].flatMap(() => ['✦ Envíos a todo el país', '✦ Talles del 80 al 130', '✦ Cambios y devoluciones', '✦ Aceptamos todas las tarjetas', '✦ Fabricantes — Mayorista & Minorista']).map((t, i) => (
            <span key={i} style={{ marginRight: '3rem' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, gap: 16 }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: C.rose, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_D, fontSize: 18, fontWeight: 700, color: '#FAF7F4' }}>L</div>
          <div>
            <div style={{ fontFamily: FONT_D, fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>Mi Lencería</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '.12em' }}>FABRICANTES · MAYORISTA & MINORISTA</div>
          </div>
        </a>

        {/* Search bar (desktop) */}
        <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.muted, pointerEvents: 'none' }}>🔍</span>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            style={{ width: '100%', padding: '9px 12px 9px 38px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, background: C.cream, outline: 'none', color: C.charcoal, transition: 'border .2s' }}
            onFocus={e => e.target.style.borderColor = C.rose}
            onBlur={e => e.target.style.borderColor = C.border} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: C.muted, cursor: 'pointer', border: 'none', background: 'none', lineHeight: 1 }}>×</button>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <a href="https://wa.me/5491131636361" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#15803D', fontWeight: 500 }}>
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            <span style={{ display: 'none', ['@media(min-width:768px)']: { display: 'inline' } }}>WhatsApp</span>
          </a>
          <a href="#favoritos" style={{ position: 'relative', fontSize: 22, color: favorites.size > 0 ? C.rose : C.muted, transition: 'color .2s' }}>
            {favorites.size > 0 ? '❤️' : '🤍'}
            {favorites.size > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: C.gold, color: '#fff', width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{favorites.size}</span>}
          </a>
          <button onClick={onCartOpen}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, background: C.rose, color: '#FAF7F4', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .2s', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = C.roseH}
            onMouseLeave={e => e.currentTarget.style.background = C.rose}>
            🛒 Carrito
            {cartCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: C.gold, color: '#fff', width: 18, height: 18, borderRadius: '50%', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
          </button>
        </div>
      </nav>
    </header>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const imgs = ['https://images.unsplash.com/photo-1616162589107-3c34f9f1a8cc?w=350&q=70', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=350&q=70', 'https://images.unsplash.com/photo-1588369811054-9fc53af2afd5?w=350&q=70', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=350&q=70']
  return (
    <section style={{ background: `linear-gradient(135deg,${C.charcoal} 0%,#3D0E20 100%)`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 65% 50%, rgba(196,150,90,.18) 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', top: -120, right: -120, width: 450, height: 450, borderRadius: '50%', border: `1px solid rgba(196,150,90,.08)` }} />
      <div style={{ position: 'absolute', top: -70, right: -70, width: 310, height: 310, borderRadius: '50%', border: `1px solid rgba(196,150,90,.12)` }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', position: 'relative' }}>
        <div style={{ animation: 'fadeIn .6s ease' }}>
          <p style={{ color: C.goldL, fontSize: 11, letterSpacing: '.22em', fontWeight: 500, marginBottom: 14, textTransform: 'uppercase' }}>✦ Fabricantes · Mayorista & Minorista</p>
          <h1 style={{ fontFamily: FONT_D, color: '#FAF7F4', fontSize: 'clamp(34px,4.5vw,58px)', fontWeight: 600, lineHeight: 1.15, marginBottom: 18 }}>
            Lencería Premium<br /><em style={{ color: C.goldL }}>para todos los cuerpos</em>
          </h1>
          <p style={{ color: 'rgba(250,247,244,.65)', fontSize: 15, marginBottom: 28, lineHeight: 1.75 }}>
            Talles reales del 80 al 130. Diseños exclusivos con los mejores materiales.<br />Envíos a todo el país.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#productos" style={{ padding: '13px 28px', background: C.rose, color: '#FAF7F4', borderRadius: 7, fontWeight: 600, fontSize: 14, display: 'inline-block' }}>Ver colección →</a>
            <a href="#packs" style={{ padding: '13px 28px', background: 'transparent', color: C.goldL, border: `1px solid ${C.gold}`, borderRadius: 7, fontWeight: 600, fontSize: 14, display: 'inline-block' }}>Packs emprendedoras</a>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[{ n: '+57.000', l: 'Revendedoras' }, { n: 'Talles 80–130', l: 'Para todos los cuerpos' }, { n: 'Todo ARG', l: 'Enviamos gratis' }].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontFamily: FONT_D, fontSize: 20, fontWeight: 700, color: C.goldL }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(250,247,244,.45)', letterSpacing: '.05em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeIn .8s ease .15s both' }}>
          {imgs.map((src, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', transform: i % 2 ? 'translateY(18px)' : 'translateY(0)' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features Strip ───────────────────────────────────────────────────────────
function Features() {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '18px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {[{ icon: '🚚', title: 'Envío gratis', sub: `En compras desde ${fmt(FREE_SHIP)}` }, { icon: '↩️', title: 'Cambios fáciles', sub: 'Hasta 30 días' }, { icon: '🔒', title: 'Pago seguro', sub: 'MercadoPago & más' }, { icon: '📦', title: 'Despacho rápido', sub: 'En 24 – 48 hs hábiles' }, { icon: '💬', title: 'Atención por WhatsApp', sub: 'Lun–Vie 9:00–18:00' }].map(({ icon, title, sub }) => (
          <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{title}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const list = [
    { n: 'Martina G.', c: 'Buenos Aires', r: 5, t: 'Hace dos años que tenemos nuestro emprendimiento y las seguimos eligiendo. La atención es hermosa, son muy amables y la calidad es increíble. ¡Recomiendo 100%!' },
    { n: 'Fiorella P.', c: 'Bariloche', r: 5, t: 'No me termina de llegar el pedido que ya tengo que hacer otro porque VUELA. La calidad, los talles, los diseños, los precios, todo es espectacular.' },
    { n: 'Ayelen M.', c: 'Córdoba', r: 5, t: 'Desde que las encontré no dejé de comprarles. Son muy amorosas, la lencería es preciosa y los talles son muy reales. ¡Mis clientas quedan encantadas!' },
    { n: 'Luciana T.', c: 'Rosario', r: 5, t: 'Empecé con el pack x6 y en una semana vendí todo. Ahora hago el x12 cada quince días. El mejor negocio que hice.' },
    { n: 'Carina V.', c: 'Mendoza', r: 5, t: 'La bata plush es lo más. Mis clientas me la piden todo el tiempo. Súper cómoda y de buena calidad. El envío llegó antes de lo previsto.' },
    { n: 'Romina K.', c: 'Mar del Plata', r: 4, t: 'Primera compra y me sorprendió todo. El embalaje cuidado, la calidad superior a lo que esperaba. Ya hice el segundo pedido!' },
  ]
  const [idx, setIdx] = useState(0)
  const visible = list.slice(idx * 3, (idx + 1) * 3)
  const pages = Math.ceil(list.length / 3)
  return (
    <section style={{ padding: '60px 24px', background: C.rosePale }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.rose, letterSpacing: '.15em', fontWeight: 500, marginBottom: 8 }}>✦ TESTIMONIOS</p>
          <h2 style={{ fontFamily: FONT_D, fontSize: 36, fontWeight: 600, marginBottom: 8 }}>Lo que dicen nuestras clientas</h2>
          <p style={{ color: C.muted, fontSize: 14 }}>Más de 57.000 revendedoras en todo el país</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 28 }}>
          {visible.map(({ n, c, r, t }, i) => (
            <div key={n} style={{ background: '#fff', borderRadius: 14, padding: 24, border: `1px solid ${C.border}`, animation: 'fadeIn .4s ease both', animationDelay: `${i * .07}s` }}>
              <div style={{ color: C.gold, fontSize: 18, marginBottom: 10 }}>{'★'.repeat(r)}</div>
              <p style={{ fontSize: 14, color: C.charcoal, lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' }}>"{t}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAF7F4', fontWeight: 700, fontSize: 15 }}>{n[0]}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{n}</div><div style={{ fontSize: 12, color: C.muted }}>{c}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: 10, height: 10, borderRadius: '50%', background: idx === i ? C.rose : C.border, border: 'none', cursor: 'pointer', transition: 'background .2s' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Instagram / Social ───────────────────────────────────────────────────────
function InstagramSection() {
  const imgs = [
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&q=70',
    'https://images.unsplash.com/photo-1616162589107-3c34f9f1a8cc?w=300&q=70',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=70',
    'https://images.unsplash.com/photo-1588369811054-9fc53af2afd5?w=300&q=70',
    'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=300&q=70',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=70',
  ]
  const [hov, setHov] = useState(null)
  return (
    <section style={{ padding: '56px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: C.rose, letterSpacing: '.15em', fontWeight: 500, marginBottom: 8 }}>✦ @MILENCERIA</p>
          <h2 style={{ fontFamily: FONT_D, fontSize: 36, fontWeight: 600, marginBottom: 8 }}>Seguinos en Instagram</h2>
          <p style={{ color: C.muted, fontSize: 14 }}>Novedades, sorteos y looks de nuestras clientas</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 28 }}>
          {imgs.map((src, i) => (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s', transform: hov === i ? 'scale(1.08)' : 'scale(1)' }} />
              {hov === i && <div style={{ position: 'absolute', inset: 0, background: 'rgba(125,30,58,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 24 }}>📸</span>
              </div>}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <a href="https://instagram.com" target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', border: `2px solid ${C.rose}`, borderRadius: 8, color: C.rose, fontWeight: 600, fontSize: 14, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = '#FAF7F4' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.rose }}>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            Seguir en Instagram
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter({ showToast }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const submit = e => {
    e.preventDefault()
    if (!email) return
    setDone(true)
    showToast('¡Te suscribiste al newsletter! 💌', '💌', 'success')
  }
  return (
    <section style={{ background: `linear-gradient(135deg,${C.charcoal},#3D0E20)`, padding: '52px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <p style={{ color: C.goldL, fontSize: 11, letterSpacing: '.2em', marginBottom: 10 }}>✦ NEWSLETTER</p>
        <h2 style={{ fontFamily: FONT_D, color: '#FAF7F4', fontSize: 34, fontWeight: 600, marginBottom: 10 }}>Suscribite y recibí novedades</h2>
        <p style={{ color: 'rgba(250,247,244,.6)', fontSize: 14, marginBottom: 28 }}>Descuentos exclusivos, lanzamientos y tips de cuidado en tu correo.</p>
        {done ? (
          <div style={{ color: C.goldL, fontSize: 16, fontFamily: FONT_D, fontWeight: 600 }}>✓ ¡Gracias! Pronto recibirás nuestras novedades 💌</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
              style={{ flex: 1, padding: '13px 16px', borderRadius: 8, border: `1px solid rgba(250,247,244,.15)`, background: 'rgba(255,255,255,.08)', color: '#FAF7F4', fontSize: 14, outline: 'none' }} />
            <button type="submit"
              style={{ padding: '13px 22px', background: C.rose, color: '#FAF7F4', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.roseH}
              onMouseLeave={e => e.currentTarget.style.background = C.rose}>
              Suscribirse
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#111', color: 'rgba(250,247,244,.6)', padding: '52px 24px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 40, marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, background: C.rose, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_D, fontSize: 17, fontWeight: 700, color: '#FAF7F4' }}>L</div>
            <span style={{ fontFamily: FONT_D, fontSize: 20, fontWeight: 600, color: '#FAF7F4' }}>Mi Lencería</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>Fabricantes de lencería femenina.<br />Venta mayorista y minorista.<br />Envíos a todo el país.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {['📘', '📸', '🐦'].map((ico, i) => (
              <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}>{ico}</a>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ color: '#FAF7F4', fontWeight: 600, marginBottom: 14, fontSize: 13, letterSpacing: '.08em' }}>PRODUCTOS</h4>
          {['Conjuntos', 'Pijamas', 'Batas', 'Bodys', 'Less & Colaless', 'Packs Emprendedoras'].map(l => (
            <a key={l} href="#productos" style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'rgba(250,247,244,.55)', transition: 'color .15s' }}
              onMouseEnter={e => e.target.style.color = C.goldL}
              onMouseLeave={e => e.target.style.color = 'rgba(250,247,244,.55)'}>{l}</a>
          ))}
        </div>
        <div>
          <h4 style={{ color: '#FAF7F4', fontWeight: 600, marginBottom: 14, fontSize: 13, letterSpacing: '.08em' }}>MEDIOS DE PAGO</h4>
          <p style={{ fontSize: 13, lineHeight: 2.2 }}>💳 MercadoPago<br />💵 Efectivo<br />🏦 Transferencia bancaria<br />💳 Todas las tarjetas<br />📲 Cuotas sin interés</p>
        </div>
        <div>
          <h4 style={{ color: '#FAF7F4', fontWeight: 600, marginBottom: 14, fontSize: 13, letterSpacing: '.08em' }}>ENVÍOS Y CONTACTO</h4>
          <p style={{ fontSize: 13, lineHeight: 2.2 }}>📦 Correo Argentino<br />🚛 Via Cargo<br />🏍️ Motomensajería (CABA/GBA)<br />🏪 Retiro por local gratis<br />📱 WhatsApp: +54 9 11 3163-6361<br />🕐 Lun–Vie 9:00–18:00</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12 }}>
        <span>© {new Date().getFullYear()} Mi Lencería. Todos los derechos reservados.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Política de privacidad', 'Términos y condiciones', 'Defensa del consumidor'].map(l => (
            <a key={l} href="#" style={{ color: C.goldL, fontSize: 11 }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── WhatsApp FAB ─────────────────────────────────────────────────────────────
function WhatsAppFAB() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const h = () => setVisible(window.scrollY > 200)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  return (
    <a href="https://wa.me/5491131636361?text=Hola! Quiero consultar sobre sus productos." target="_blank" rel="noreferrer"
      style={{ position: 'fixed', bottom: 88, right: 22, zIndex: 300, width: 54, height: 54, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,.5)', transition: 'transform .2s, opacity .3s', transform: visible ? 'scale(1)' : 'scale(0.8)', opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    </a>
  )
}

// ─── Back to Top ──────────────────────────────────────────────────────────────
function BackToTop() {
  const [v, setV] = useState(false)
  useEffect(() => { const h = () => setV(window.scrollY > 400); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h) }, [])
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 300, width: 44, height: 44, borderRadius: '50%', background: C.charcoal, color: '#FAF7F4', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.25)', transition: 'opacity .3s, transform .2s', opacity: v ? 1 : 0, transform: v ? 'scale(1)' : 'scale(.8)', pointerEvents: v ? 'auto' : 'none' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      ↑
    </button>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [favorites, setFavorites] = useState(new Set())
  const [productModal, setProductModal] = useState(null)
  const { toasts, add: addToast } = useToasts()

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const key = `${product.id}-${product.selectedTalle}-${product.selectedColor.nombre}`
      const ex = prev.find(i => i.cartId === key)
      if (ex) return prev.map(i => i.cartId === key ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, cartId: key, qty: 1 }]
    })
    addToast(`${product.name} en el carrito`, '🛒')
  }, [addToast])

  const toggleFav = useCallback((id) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); addToast('Eliminado de favoritos', '🤍', 'fav') }
      else { next.add(id); addToast('Guardado en favoritos', '❤️', 'fav') }
      return next
    })
  }, [addToast])

  const filteredProducts = useMemo(() => {
    let arr = activeCategory === 'todos' ? products : products.filter(p => p.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      arr = arr.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (sortBy === 'price-asc') arr = [...arr].sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') arr = [...arr].sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') arr = [...arr].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'reviews') arr = [...arr].sort((a, b) => b.reviews - a.reviews)
    return arr
  }, [activeCategory, searchQuery, sortBy])

  return (
    <div style={{ fontFamily: FONT_B, background: C.cream, minHeight: '100vh' }}>
      <CountdownBanner />
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} favorites={favorites} />
      <ShippingBar total={cartTotal} />
      <Hero />
      <Features />

      {/* Category tabs */}
      <div style={{ position: 'sticky', top: 96, zIndex: 90, background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0', alignItems: 'center' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
              style={{
                padding: '9px 18px', borderRadius: 7, whiteSpace: 'nowrap', flexShrink: 0,
                background: activeCategory === cat.id ? C.rose : 'transparent',
                color: activeCategory === cat.id ? '#FAF7F4' : C.charcoal,
                border: `1px solid ${activeCategory === cat.id ? C.rose : 'transparent'}`,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .2s'
              }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products section */}
      <section id="productos" style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: FONT_D, fontSize: 30, fontWeight: 600 }}>
              {searchQuery ? `Resultados para "${searchQuery}"` : activeCategory === 'todos' ? 'Toda la colección' : categories.find(c => c.id === activeCategory)?.label}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{filteredProducts.length} productos encontrados</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, color: C.muted }}>Ordenar:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, background: '#fff', color: C.charcoal, cursor: 'pointer', outline: 'none' }}>
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="rating">Mejor puntuados</option>
              <option value="reviews">Más reseñas</option>
            </select>
          </div>
        </div>

        {/* No results */}
        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <p style={{ fontFamily: FONT_D, fontSize: 22, marginBottom: 8 }}>No encontramos resultados</p>
            <p style={{ fontSize: 14 }}>Probá con otro término o explorá todas las categorías</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('todos') }} style={{ marginTop: 20, padding: '10px 24px', background: C.rose, color: '#FAF7F4', borderRadius: 7, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none' }}>Ver todo</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 22 }}>
          {filteredProducts.map((p, i) => (
            <div key={p.id} style={{ animation: 'fadeIn .4s ease both', animationDelay: `${i * 0.04}s` }}>
              <ProductCard product={p} onAddToCart={addToCart} onOpenModal={setProductModal} favorites={favorites} toggleFav={toggleFav} />
            </div>
          ))}
        </div>
      </section>

      {/* Packs highlight */}
      <section id="packs" style={{ padding: '60px 24px', background: C.charcoal }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <p style={{ color: C.goldL, fontSize: 11, letterSpacing: '.2em', marginBottom: 10 }}>✦ PARA REVENDEDORAS</p>
            <h2 style={{ fontFamily: FONT_D, color: '#FAF7F4', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 600, marginBottom: 16, lineHeight: 1.2 }}>
              Packs Emprendedoras<br /><em style={{ color: C.goldL }}>hacé tu negocio</em>
            </h2>
            <p style={{ color: 'rgba(250,247,244,.65)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
              Más de 57.000 revendedoras en todo el país ya confían en nosotras. Nuestros packs incluyen modelos de alta rotación, diseños exclusivos y los mejores materiales. El precio por unidad más bajo del mercado.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[{ n: '57.000+', l: 'Revendedoras activas' }, { n: '95%', l: 'Tasa de recompra' }, { n: '48 hs', l: 'Despacho promedio' }, { n: 'Envío gratis', l: `Desde ${fmt(FREE_SHIP)}` }].map(({ n, l }) => (
                <div key={l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 700, color: C.goldL }}>{n}</div>
                  <div style={{ fontSize: 12, color: 'rgba(250,247,244,.5)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveCategory('packs')}
              style={{ padding: '13px 28px', background: C.rose, color: '#FAF7F4', borderRadius: 7, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none', transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.roseH}
              onMouseLeave={e => e.currentTarget.style.background = C.rose}>
              Ver packs disponibles →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=70', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=70', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=70', 'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&q=70'].map((src, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', transform: i % 2 ? 'translateY(16px)' : 'none' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <InstagramSection />
      <Newsletter showToast={(m, i, t) => addToast(m, i, t)} />
      <Footer />

      {/* Floating elements */}
      <WhatsAppFAB />
      <BackToTop />

      {/* Cart */}
      <CartSidebar cart={cart} open={cartOpen} onClose={() => setCartOpen(false)}
        onRemove={id => setCart(p => p.filter(i => i.cartId !== id))}
        onQty={(id, d) => setCart(p => p.map(i => i.cartId === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0))}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
        cartTotal={cartTotal} />

      {/* Checkout */}
      <CheckoutModal cart={cart} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {/* Product Modal */}
      {productModal && (
        <ProductModal product={productModal} onClose={() => setProductModal(null)}
          onAddToCart={addToCart} favorites={favorites} toggleFav={toggleFav}
          showToast={(m) => addToast(m, '🛒')} />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
