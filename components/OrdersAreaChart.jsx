'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Thêm giá trị mặc định là mảng rỗng [] để tránh lỗi undefined.reduce
export default function OrdersAreaChart({ allOrders = [] }) {

    // Nếu dữ liệu chưa về hoặc không phải mảng, hiện thông báo nhẹ thay vì văng lỗi
    if (!allOrders || allOrders.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                Chưa có dữ liệu đơn hàng để hiển thị biểu đồ.
            </div>
        )
    }

    // Group orders by date
    const ordersPerDay = allOrders.reduce((acc, order) => {
        // Kiểm tra nếu order.createdAt tồn tại để tránh lỗi Split
        if (order.createdAt) {
            const date = new Date(order.createdAt).toISOString().split('T')[0] 
            acc[date] = (acc[date] || 0) + 1
        }
        return acc
    }, {})

    // Convert to array for Recharts
    const chartData = Object.entries(ordersPerDay).map(([date, count]) => ({
        date,
        orders: count
    }))

    return (
        <div className="w-full max-w-4xl h-[300px] text-xs">
            <h3 className="text-lg font-medium text-slate-800 mb-4 pt-2 text-right"> 
                <span className='text-slate-500'>Orders /</span> Day
            </h3>
            <ResponsiveContainer width="100%" height="100%"> 
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} label={{ value: 'Orders', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#4f46e5" fill="#8884d8" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}