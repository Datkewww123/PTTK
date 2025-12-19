import Stripe from 'stripe'
import { getAuth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' })

export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'not authorized' }, { status: 401 })

    const { addressId, items, couponCode } = await request.json()

    if (!addressId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing order details.' }, { status: 400 })
    }

    // Build orders grouped by store (same logic as /api/orders)
    const ordersByStore = new Map()
    const lineItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } })
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
      }
      const storeId = product.storeId
      if (!ordersByStore.has(storeId)) ordersByStore.set(storeId, [])
      ordersByStore.get(storeId).push({ ...item, price: product.price })

      // Stripe line item
      lineItems.push({
        price_data: {
          currency: (process.env.NEXT_PUBLIC_CURRENCY_CODE || 'usd').toLowerCase(),
          product_data: { name: product.name, description: product.description },
          unit_amount: Math.round(product.price * 100)
        },
        quantity: item.quantity
      })
    }

    let isShippingFeeAdded = false
    const createdOrderIds = []

    // Create DB orders (isPaid: false) and collect their ids
    for (const [storeId, sellerItems] of ordersByStore.entries()) {
      let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      let coupon = null

      if (couponCode) {
        coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
        if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 400 })
      }

      if (couponCode && coupon && coupon.forNewUser) {
        const userorders = await prisma.order.findMany({ where: { userId } })
        if (userorders.length > 0) return NextResponse.json({ error: 'Coupon valid for new users' }, { status: 400 })
      }

      if (coupon) total -= (total * coupon.discount) / 100

      if (!isShippingFeeAdded) {
        total += 5 // flat shipping fee
        isShippingFeeAdded = true
      }

      const created = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod: 'STRIPE',
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price }))
          }
        }
      })

      createdOrderIds.push(created.id)
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      metadata: { orderIds: JSON.stringify(createdOrderIds) },
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cart`
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error', error)
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 400 })
  }
}
