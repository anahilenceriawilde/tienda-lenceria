/**
 * api/create-preference.js — Vercel Serverless Function
 *
 * Setup:
 *   npm install mercadopago
 *   Vercel env var: MP_ACCESS_TOKEN = tu Access Token
 *   (https://www.mercadopago.com.ar/developers/panel)
 */
import { MercadoPagoConfig, Preference } from 'mercadopago'

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' })

  try {
    const { items } = req.body
    if (!items?.length)
      return res.status(400).json({ error: 'Carrito vacío' })

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preference = new Preference(client)
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://tutienda.vercel.app'

    const result = await preference.create({
      body: {
        items: items.map(i => ({
          title: i.title,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          currency_id: 'ARS',
        })),
        back_urls: {
          success: `${site}/gracias`,
          failure: `${site}/error-pago`,
          pending: `${site}/pago-pendiente`,
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 3600000).toISOString(),
      },
    })

    const isProd = process.env.NODE_ENV === 'production'
    return res.status(200).json({
      init_point: isProd ? result.init_point : result.sandbox_init_point,
      id: result.id,
    })
  } catch (err) {
    console.error('MP error:', err)
    return res.status(500).json({ error: 'Error al crear preferencia', detail: err.message })
  }
}
