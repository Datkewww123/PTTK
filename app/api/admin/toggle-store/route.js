import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "missing storeId" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId }});

    if (!store) {
      return NextResponse.json({ error: "store not found" }, { status: 400 });
    }

    // Đảo ngược trạng thái hoạt động
    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive }
    });

    return NextResponse.json({ message: "Store updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}