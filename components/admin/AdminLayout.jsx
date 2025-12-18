'use client'
import { useEffect, useState } from "react";
import axios from "axios"; 
import { useUser, useAuth } from "@clerk/nextjs";
import Loading from "../Loading";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import toast from "react-hot-toast";
import Link from "next/link"; // FIX 1: Missing Link
import { ArrowRightIcon } from "lucide-react"; // FIX 2: Missing Icon

const AdminLayout = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to check Admin permissions
  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/admin/is-admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // FIX 3: Based on your log "Result: true", data is the boolean itself.
      // We check for both data.isAdmin OR data directly.
      if (data.isAdmin === true || data === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Admin check error:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
    } else {
      // If no user is logged in, stop loading so it shows Access Denied
      setLoading(false);
    }
  }, [user]);

  if (loading) return <Loading />;

  // ACCESS DENIED UI
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">
          You do not have permission to access this page
        </h1>
        <Link
          href="/"
          className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full"
        >
          Back to Home <ArrowRightIcon size={18} />
        </Link>
      </div>
    );
  }

  // ADMIN AUTHORIZED
  return (
    <div className="flex flex-col h-screen">
      <AdminNavbar />
      <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
        <AdminSidebar />
        <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;