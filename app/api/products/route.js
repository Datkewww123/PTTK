import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    let products = await prisma.product.findMany({
      where: { inStock: true },
      include: {
        rating: {
          select: {
            createdAt: true,
            rating: true,
            review: true,
            user: { select: { name: true, image: true } }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            isActive: true,

            email: true,
            contact: true,
            status: true
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Respect a dev-only flag to include pending/inactive stores for local testing
    const { searchParams } = new URL(request.url)
    const includePending = searchParams.get('includePending') === 'true'
    const allowPending = includePending && process.env.NODE_ENV !== 'production'

    if (!allowPending) {
      // Chỉ giữ lại sản phẩm của những cửa hàng đang hoạt động (production behavior)
      products = products.filter(product => product.store && product.store.isActive)
    } else {
      console.info('Including pending/inactive stores in /api/products via includePending flag (dev only)')
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}