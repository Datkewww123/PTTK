import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request){
  try{
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if(!code){
      return NextResponse.json({ error: 'missing_code' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if(!coupon){
      return NextResponse.json({ error: 'coupon_not_found' }, { status: 404 })
    }

    // check expiry
    const now = new Date()
    if(coupon.expiresAt && new Date(coupon.expiresAt) < now){
      return NextResponse.json({ error: 'coupon_expired' }, { status: 400 })
    }

    // return coupon (omit any sensitive fields)
    return NextResponse.json({ coupon })
  }
  catch(err){
    console.error('Validate coupon failed', err)
    return NextResponse.json({ error: err.message || 'unknown_error' }, { status: 500 })
  }
}