export const dynamic = 'force-dynamic';
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// get all approved
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: {
        status: 'approved'
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        contact: true,
        status: true,
        isActive: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json({ stores });
    
  } catch (error) {
    console.error('ADMIN_STORES_GET_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}