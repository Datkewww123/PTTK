import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
export const dynamic = 'force-dynamic';

// Get Dashboard Data for Seller ( total orders, total earnings, total products )
export async function GET(request){
  try {
    let { userId } = getAuth(request)

    // Dev bypass: allow using header x-dev-userid when running locally (host includes localhost) OR DEV_BYPASS_SELLER=true
    const devUser = request.headers.get('x-dev-userid')
    if (!userId && devUser && (process.env.DEV_BYPASS_SELLER === 'true' || request.headers.get('host')?.includes('localhost'))) {
      userId = devUser
      console.info('Dev bypass used for userId:', devUser)
    }

    const storeId = await authSeller(userId)

    if (!storeId) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 })
    }

    // Get all orders for seller
    const orders = await prisma.order.findMany({ where: { storeId } })

    // Get all products with ratings for seller
    const products = await prisma.product.findMany({ where: { storeId } })

    const ratings = await prisma.rating.findMany({
      where: {productId: {in: products.map(product => product.id)}},
      include: {user: true, product: true}
    })

    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(orders.reduce((acc, order)=> acc + order.
      total, 0)),
      totalProducts: products.length
    }
    return NextResponse.json({dashboardData})
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status:
    400 })
  }
}