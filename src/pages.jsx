// src/pages.jsx — Páginas de retorno de MercadoPago

const C = {
  rose: '#7D1E3A', gold: '#C4965A', cream: '#FAF7F4',
  charcoal: '#1A1614', muted: '#7A6C68', green: '#15803D',
  greenPale: '#F0FDF4', redPale: '#FEF2F2', yellowPale: '#FFFBEB',
}
const FONT_D = "'Cormorant Garamond',Georgia,serif"

function Layout({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans',-apple-system,sans-serif",
      padding: 24,
    }}>
      {/* Logo */}
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 40, textDecoration: 'none',
      }}>
        <div style={{
          width: 40, height: 40, background: C.rose, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_D, fontSize: 20, fontWeight: 700, color: '#FAF7F4',
        }}>L</div>
        <div>
          <div style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 700, color: C.charcoal, lineHeight: 1.1 }}>Mi Lencería</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: '.12em' }}>FABRICANTES · MAYORISTA & MINORISTA</div>
        </div>
      </a>

      {children}

      {/* Volver */}
      <a href="/" style={{
        marginTop: 32, fontSize: 14, color: C.rose, fontWeight: 500,
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ← Volver a la tienda
      </a>
    </div>
  )
}

// ─── Pago aprobado ────────────────────────────────────────────────────────────
export function PagoAprobado() {
  // Leer el payment_id de la URL si MercadoPago lo pasa
  const params = new URLSearchParams(window.location.search)
  const paymentId = params.get('payment_id')
  const status = params.get('status')

  return (
    <Layout>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,.08)',
        border: `1px solid #D1FAE5`,
        animation: 'fadeIn .4s ease',
      }}>
        {/* Ícono */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: C.greenPale, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 40,
        }}>
          ✅
        </div>

        <h1 style={{
          fontFamily: FONT_D, fontSize: 34, fontWeight: 600,
          color: C.charcoal, marginBottom: 12,
        }}>
          ¡Pago aprobado!
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 28 }}>
          Tu compra fue procesada con éxito. Nos vamos a comunicar con vos a la brevedad para coordinar el envío.
        </p>

        {paymentId && (
          <div style={{
            background: C.greenPale, borderRadius: 10, padding: '14px 20px',
            marginBottom: 28, fontSize: 13, color: '#065F46',
          }}>
            🔖 Número de pago: <strong>#{paymentId}</strong>
          </div>
        )}

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* WhatsApp */}
          <a
            href="https://wa.me/5491100000000?text=Hola! Acabo de hacer una compra en la tienda y quiero coordinar el envío."
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', background: '#25D366', color: '#fff',
              borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
            💬 Coordinar envío por WhatsApp
          </a>
          {/* Seguir comprando */}
          <a href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '13px 24px', background: C.rose, color: '#FAF7F4',
            borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>
            🛍️ Seguir comprando
          </a>
        </div>
      </div>
    </Layout>
  )
}

// ─── Pago rechazado ───────────────────────────────────────────────────────────
export function PagoRechazado() {
  const params = new URLSearchParams(window.location.search)
  const reason = params.get('collection_status') || 'rejected'

  return (
    <Layout>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,.08)',
        border: `1px solid #FCA5A5`,
        animation: 'fadeIn .4s ease',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: C.redPale, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 40,
        }}>
          ❌
        </div>

        <h1 style={{
          fontFamily: FONT_D, fontSize: 34, fontWeight: 600,
          color: C.charcoal, marginBottom: 12,
        }}>
          Pago no procesado
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 28 }}>
          No pudimos procesar tu pago. Puede ser por fondos insuficientes, datos incorrectos o un rechazo del banco. Podés intentarlo nuevamente con otro medio de pago.
        </p>

        <div style={{
          background: C.redPale, borderRadius: 10, padding: '14px 20px',
          marginBottom: 28, fontSize: 13, color: '#B91C1C',
        }}>
          💡 Tip: Verificá los datos de tu tarjeta o probá con otra.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '13px 24px', background: C.rose, color: '#FAF7F4',
            borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>
            🔄 Volver a intentar
          </a>
          <a
            href="https://wa.me/5491100000000?text=Hola! Tuve un problema con el pago en la tienda, me podés ayudar?"
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', background: '#25D366', color: '#fff',
              borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
            💬 Contactar por WhatsApp
          </a>
        </div>
      </div>
    </Layout>
  )
}

// ─── Pago pendiente ───────────────────────────────────────────────────────────
export function PagoPendiente() {
  const params = new URLSearchParams(window.location.search)
  const paymentId = params.get('payment_id')

  return (
    <Layout>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,.08)',
        border: `1px solid #FCD34D`,
        animation: 'fadeIn .4s ease',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: C.yellowPale, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 40,
        }}>
          ⏳
        </div>

        <h1 style={{
          fontFamily: FONT_D, fontSize: 34, fontWeight: 600,
          color: C.charcoal, marginBottom: 12,
        }}>
          Pago pendiente
        </h1>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 28 }}>
          Tu pago está siendo procesado. Esto puede tardar unos minutos. Te vamos a contactar cuando se confirme.
        </p>

        {paymentId && (
          <div style={{
            background: C.yellowPale, borderRadius: 10, padding: '14px 20px',
            marginBottom: 28, fontSize: 13, color: '#92400E',
          }}>
            🔖 Número de pago: <strong>#{paymentId}</strong><br />
            <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Guardá este número por si necesitás hacer una consulta.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="https://wa.me/5491100000000?text=Hola! Tengo un pago pendiente y quiero saber el estado."
            target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', background: '#25D366', color: '#fff',
              borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
            💬 Consultar por WhatsApp
          </a>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '13px 24px', background: 'transparent', color: C.muted,
            border: `1px solid #E5D9D0`, borderRadius: 8, fontWeight: 500,
            fontSize: 14, textDecoration: 'none',
          }}>
            Volver a la tienda
          </a>
        </div>
      </div>
    </Layout>
  )
}
