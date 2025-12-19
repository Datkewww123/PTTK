import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' })

export async function POST(request) {
  const payload = await request.text()
  const sig = request.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return new Response('Stripe webhook secret not configured', { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderIds = JSON.parse(session.metadata?.orderIds || '[]')
      if (orderIds.length > 0) {
        await prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { isPaid: true } })
        console.info('Marked orders as paid:', orderIds)
      }
    }
  } catch (err) {
    console.error('Error processing webhook', err)
    return new Response('Webhook handler failure', { status: 500 })
  }

  return NextResponse.json({ received: true })
}
