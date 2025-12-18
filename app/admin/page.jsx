'use client'
import { dummyAdminDashboardData } from "@/assets/assets"
import axios from "axios";
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useAuth } from "@clerk/nextjs"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {
    const { getToken } = useAuth();  
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
    })

    // FIX: Using fallback values to prevent "undefined"
    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData?.products || 0, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + (dashboardData?.revenue || 0).toLocaleString(), icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData?.orders || 0, icon: TagsIcon },
        { title: 'Total Stores', value: dashboardData?.stores || 0, icon: StoreIcon },
    ]

const fetchDashboardData = async () => {
  try {
    setLoading(true);
    // 1. Get the fresh token from Clerk
    const token = await getToken(); 
    
    // 2. Send request with Bearer token
    const { data } = await axios.get('/api/admin/dashboard', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache' 
      }
    });

    // 3. Set data (ensure the mapping matches the API response)
    setDashboardData(data);
    
  } catch (error) {
    console.error("Detailed Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
    }
  } finally {
    setLoading(false);
  }
};
const handleApprove = async ({ storeId, status }) => {
  try {
    const token = await getToken()
    const { data } = await axios.post('/api/admin/approve-store', {
      storeId,
      status
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    toast.success(data.message)
    await fetchStores()
  } catch (error) {
    toast.error(error?.response?.data?.error || error.message)
  }
}

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {dashboardCardsData.map((card, index) => (
                    <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg">
                        <div className="flex flex-col gap-3 text-xs">
                            <p>{card.title}</p>
                            <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                        </div>
                        <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                    </div>
                ))}
            </div>

            <OrdersAreaChart allOrders={dashboardData.allOrders || []} />
        </div>
    )
}