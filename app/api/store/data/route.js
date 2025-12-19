// Get store info & store products
import prisma from "../../../../lib/prisma";
export const dynamic = 'force-dynamic';    
import { NextResponse } from "next/server";

export async function GET(request){
  try {
    // Get store username from query params
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username').toLowerCase();

    if(!username){
      return NextResponse.json({error: "missing username"}, { status: 400 })
    }

    // Get store info and inStock products with ratings
    const store = await prisma.store.findFirst({
      where: { username, isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        description: true,
        email: true,
        contact: true,
        status: true,
        isActive: true,
        Product: {
          where: { inStock: true },
          include: { rating: true }
        }
      }
    })

    if (!store) {
      return NextResponse.json({ error: "store not found" }, { status: 404 })
    }

    return NextResponse.json({ store })

  } catch (error) {
    console.error(error);
    return NextResponse.json({error: error.code|| error.message}, {status:400})
  }
}