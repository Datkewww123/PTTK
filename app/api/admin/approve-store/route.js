export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middlewares/authAdmin";
import prisma from "@/lib/prisma";

// GET -> return pending store applications
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { status: 'pending' },
      include: { user: true }
    });

    return NextResponse.json({ stores });

  } catch (error) {
    console.error('APPROVE_STORE_GET_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH -> approve or reject a store
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 });
    }

    const { storeId, status } = await request.json();

    if (!storeId || !status) {
      return NextResponse.json({ error: 'missing parameters' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        status,
        isActive: status === 'approved'
      }
    });

    return NextResponse.json({ message: 'Store updated', store });

  } catch (error) {
    console.error('APPROVE_STORE_PATCH_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}