import imagekit from "@/configs/imageKit"
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "../../../../middlewares/authSeller";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// Add a new product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const mrp = Number(formData.get('mrp'));
    const price = Number(formData.get('price'));
    const category = formData.get('category');
    const images = formData.getAll('images'); // Đây là một mảng các File

    if (!name || !description || !mrp || !price || !category || images.length < 1) {
      return NextResponse.json({ error: 'missing product details' }, { status: 400 });
    }

    // XỬ LÝ UPLOAD ẢNH
    const imagesUrl = await Promise.all(images.map(async (image) => {
      // SỬA LỖI: Sử dụng image (từng file) thay vì images (mảng)
      const buffer = Buffer.from(await image.arrayBuffer()); 
      
      const response = await imagekit.upload({
        file: buffer,
        fileName: image.name, // SỬA LỖI: imagekit dùng fileName (N viết hoa)
        folder: 'products'
      });

      // Trả về URL đã qua biến đổi (Transformation)
      return imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: 'auto' },
          { format: 'webp' },
          { width: '1024' }
        ]
      });
    }));

    // LƯU VÀO DATABASE
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imagesUrl,
        storeId
      }
    });

    return NextResponse.json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Get all products for a seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'not authorized' }, { status: 401 });
    }

    // SỬA LỖI: Cú pháp where của Prisma
    const products = await prisma.product.findMany({
      where: { storeId: storeId } 
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}