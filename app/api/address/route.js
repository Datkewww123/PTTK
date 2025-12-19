import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: create a new address for the authenticated user
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, street, city, state, zip, country, phone } = body;

    if (!name || !email || !street || !city || !state || !zip || !country || !phone) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        name,
        email,
        street,
        city,
        state,
        zip,
        country,
        phone
      }
    });

    return NextResponse.json({ message: 'Address saved', address: newAddress });
  } catch (error) {
    console.error('Address POST failed', error);
    return NextResponse.json({ error: error.message || 'failed' }, { status: 400 });
  }
}

// GET: list addresses for the authenticated user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ addAddress: addresses });
  } catch (error) {
    console.error('Address GET failed', error);
    return NextResponse.json({ error: error.message || 'failed' }, { status: 400 });
  }
}
