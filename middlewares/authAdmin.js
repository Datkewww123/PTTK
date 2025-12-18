import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async (userId) => {
  if (!userId) return false;

  try {
    // Gọi hàm clerkClient() để khởi tạo SDK v5+
    const client = await clerkClient(); 
    const user = await client.users.getUser(userId);
    
    // Tìm email có trạng thái xác thực là 'verified'
    const verifiedEmailObj = user.emailAddresses.find(
      (email) => email.verification?.status === "verified"
    );
    
    const primaryEmail = verifiedEmailObj?.emailAddress;
    
    if (!primaryEmail) {
      console.log("Debug: Không tìm thấy email đã xác thực cho user:", userId);
      return false;
    }

    // Lấy danh sách admin từ file .env
    const adminEmails = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    const isMatch = adminEmails.includes(primaryEmail.toLowerCase());
    console.log(`Debug: Checking ${primaryEmail} -> Result: ${isMatch}`);

    return isMatch;
  } catch (error) {
    console.error("authAdmin error:", error);
    return false;
  }
};

export default authAdmin;