import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import imagekit from "../../../../configs/imageKit";
export const dynamic = 'force-dynamic';
// create the store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    const authHeader = request.headers.get('authorization') || null

    if (!userId) {
      console.info('Create store: unauthenticated request', { authHeaderPresent: Boolean(authHeader) })
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    }

    // Get the data from the form
    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const image = formData.get("image"); // optional

    // basic validation (image is optional in schema)
    if (!name || !username || !description || !email || !contact) {
      console.info('Create store: validation failed', { userId, fields: Array.from(formData.keys()) })
      return NextResponse.json({ error: "missing some info", fields: Array.from(formData.keys()) }, { status: 400 })
    }

    // Ensure a corresponding User row exists in DB (avoid foreign-key failures)
    let clerkUser = null
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      clerkUser = await clerkClient.users.getUser(userId)
    } catch (uErr) {
      console.warn('Could not fetch Clerk user for upsert', uErr)
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: clerkUser ? (`${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Unknown') : 'Unknown',
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || email || '',
        image: clerkUser?.profileImageUrl || ''
      }
    })

    // only select safe fields (avoid touching missing columns like `logo` in older DBs)
    const store = await prisma.store.findFirst({ where: { userId: userId }, select: { id: true, status: true } })

if(store){
    return NextResponse.json({status: store.status})
} 
//check username
const isUsernametaken = await prisma.store.findFirst({
    where: { username: username.toLowerCase() },
    select: { id: true }
})
if(isUsernametaken){
    return NextResponse.json({error:"username is already taken"},{status: 400})
} 
// image upload to imagekit (optional - not stored on Store model)
let optimizedImage = null;
if (image) {
  try {
    const buffer = Buffer.from(await image.arrayBuffer());

    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos"
    });

    optimizedImage = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" }
      ]
    });
  } catch (upErr) {
    console.warn('ImageKit upload failed, continuing without logo', upErr)
  }
}

const newStore = await prisma.store.create({
  data: {
    userId,
    name,
    description,
    username: username.toLowerCase(),
    email,
    contact
  }
})

// link store to user
await prisma.user.update({
  where: { id: userId },
  data: { store: { connect: { id: newStore.id } } }
})
return NextResponse.json({ message: "applied, waiting for approval" })
  } catch (error) {
    const errBody = {
      error: error?.message || 'unknown_error',
      code: error?.code || 'UNKNOWN_ERROR',
      meta: error?.meta || null
    }
    console.error('Create store failed', { err: errBody })
    return NextResponse.json(errBody, { status: 400 })
  }
}

//check xem nguoi dung da dki store nao truoc do chua
export async function GET(request) {
  try {
      const { userId } = getAuth(request);
    const store = await prisma.store.findFirst({
      where: { userId: userId },
      select: { id: true, status: true }
    })

    if (store) {
      return NextResponse.json({ status: store.status })
    }

    return NextResponse.json({ status: "Not registered" })    
  } 
  
  
  catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message }, 
      { status: 400 }
    );
  }
}