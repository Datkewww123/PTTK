import { inngest } from './client'
import prisma from '@/lib/prisma'

// 1. Đồng bộ tạo User
export const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-create' },
  { event: 'clerk/user.created' },
  async ({ event, step }) => {
    const { data } = event

    await step.run("save-user-to-db", async () => {
      // Xử lý trường hợp first_name hoặc last_name bị null từ Clerk
      const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "New User";

      return await prisma.user.create({
        data: {
          id: data.id,
          email: data.email_addresses[0].email_address,
          name: fullName,
          image: data.image_url || "",
        },
      })
    })
  }
)

// 2. Đồng bộ xóa User (Dùng deleteMany để tránh lỗi nếu User chưa tồn tại)
export const syncUserDeletion = inngest.createFunction(
  { id: 'sync-user-delete' },
  { event: 'clerk/user.deleted' },
  async ({ event, step }) => {
    const { data } = event

    await step.run("delete-user-from-db", async () => {
      return await prisma.user.deleteMany({
        where: { id: data.id },
      })
    })
  }
)

// 3. Đồng bộ cập nhật User
export const syncUserUpdation = inngest.createFunction(
  { id: 'sync-user-update' },
  { event: 'clerk/user.updated' },
  async ({ event, step }) => {
    const { data } = event

    await step.run("update-user-in-db", async () => {
      const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "Updated User";
      
      return await prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email_addresses[0].email_address,
          name: fullName,
          image: data.image_url,
        },
      })
    })
  }
)
// Inngest Function to delete coupon on expiry
export const deleteCouponOnExpiry = inngest.createFunction(
    {id: 'delete-coupon-on-expiry'},
    {event: 'app/coupon.expired'},
    async ({ event, step }) => {
        const { data } = event
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await prisma.coupon.delete({
                where: { code: data.code }
            })
        })
    }
)