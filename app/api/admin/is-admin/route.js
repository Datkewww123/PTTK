import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";

export async function GET() {
  try {
    // auth() tự động lấy Secret Key từ .env và xác thực cho bạn
    const { userId } = await auth(); 

    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const isAdmin = await authAdmin(userId);
    return NextResponse.json({ isAdmin: !!isAdmin });
    
  } catch (error) {
    // Nếu vẫn lỗi jwtKey, log ra để kiểm tra Secret Key
    console.error("Lỗi xác thực Clerk:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}