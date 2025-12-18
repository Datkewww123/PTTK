// SAI (Bản cũ): import { auth } from "@clerk/nextjs";
// ĐÚNG (Bản mới):
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";
import prisma from "../../../../lib/prisma";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'not authorized' }, { status: 401 });

    const [products, stores, allOrders] = await Promise.all([
      prisma.product.count().catch(() => 0),
      prisma.store.count().catch(() => 0),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => [])
    ]);

    const revenue = allOrders
      .filter(order => order.isPaid === true)
      .reduce((total, order) => total + Number(order.amount || 0), 0);

    return NextResponse.json({
      products,
      revenue,
      orders: allOrders.length,
      stores,
      allOrders
    });

  } catch (error) {
    console.error("DASHBOARD_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}