import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request){
  try {
    const { userId } = getAuth(request)
    if(!userId){
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { addressId, items, couponCode, paymentMethod } = await request.json()

    // Check if all required fields are present
    if(!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0){
      return NextResponse.json({ error: "missing order details." }, { status: 400 });
    }

    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      })
      if (!coupon){
        return NextResponse.json({ error: "Coupon not found" }, { status: 400 })
      }

      // expiry check
      if(coupon.expiresAt && new Date(coupon.expiresAt) < new Date()){
        return NextResponse.json({ error: "Coupon expired" }, { status: 400 })
      }
    }

    if(couponCode && coupon?.forNewUser){
      const userorders = await prisma.order.findMany({where: {userId}})
      if(userorders.length > 0){
        return NextResponse.json({ error: "Coupon valid for new users" }, { status: 400 })
      }
    }

    // If coupon is member-only, verify membership via Clerk user metadata
    if (couponCode && coupon?.forMember){
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerkUser = await clerkClient.users.getUser(userId).catch(() => null);
      const plan = clerkUser?.publicMetadata?.plan || clerkUser?.privateMetadata?.plan || null;
      if (plan !== 'plus') {
        return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
      }
    }

    // If coupon is member-only, verify membership via Clerk user metadata
    if (couponCode && coupon.forMember){
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerkUser = await clerkClient.users.getUser(userId).catch(() => null);
      const plan = clerkUser?.publicMetadata?.plan || clerkUser?.privateMetadata?.plan || null;
      if (plan !== 'plus') {
        return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
      }
    }

    const ordersByStore = new Map()

    for(const item of items){
      const product = await prisma.product.findUnique({where: {id: item.id}})
      if(!product){
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
      }
      const storeId = product.storeId
      if(!ordersByStore.has(storeId)){
        ordersByStore.set(storeId, [])
      }
      ordersByStore.get(storeId).push({...item, price: product.price})
    }

    let isShippingFeeAdded = false

    // Create orders for each seller
    for(const [storeId, sellerItems] of ordersByStore.entries()){
      let total = sellerItems.reduce((acc, item)=>acc + (item.price * item.quantity), 0)

      if(couponCode){
        total -= (total * coupon.discount) / 100;
      }
      if(!isShippingFeeAdded){
        total += 5; // flat shipping fee for non-members
        isShippingFeeAdded = true
      }

      await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      })
    }

    // clear the cart
    await prisma.user.update({
      where: {id: userId},
      data: {cart : {}}
    })

    return NextResponse.json({message: 'Orders Placed Successfully'})

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 })
  }
}

// Get all orders for a user
export async function GET(request){
  try {
    const { userId } = getAuth(request)
    if(!userId){
      return NextResponse.json({ error: 'not authorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: { include: { rating: true } } } },
        address: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ orders })

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}