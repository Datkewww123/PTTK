import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
// Add new coupon
export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    const isAdmin = await authAdmin(userId)

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 })
    }

    const { coupon } = await request.json()
    // Chuyển mã coupon thành chữ in hoa trước khi lưu
    coupon.code = coupon.code.toUpperCase()

    await prisma.coupon.create({ data: coupon })

    return NextResponse.json({ message: "Coupon added successfully" })

  } catch (error) {
    console.error('COUPON_POST_ERROR', error)
    return NextResponse.json(
      { error: error.code || error.message }, 
      { status: 400 }
    )
  }
}
// delete cuppon
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');

    await prisma.coupon.delete({ where: { code } });
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
       console.error('COUPON_DELETE_ERROR', error)
    return NextResponse.json(
      { error: error.code || error.message }, 
      { status: 400 }
    )
  }
}
// Get all coupons
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({});
    
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('COUPON_GET_ERROR', error);
    return NextResponse.json(
      { error: error.code || error.message }, 
      { status: 400 }
    );
  }
}