import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalLoader from '@/components/GlobalLoader'

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "GoCart. - Shop smarter",
    description: "GoCart. - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
        <html lang="en">
            <body className={`${outfit.className} antialiased`}>
                <StoreProvider>
                    <Toaster />
                    {/* Load global data into Redux on client */}
                    <script type="module">/* placeholder to ensure module support */</script>
                    {/* GlobalLoader is client-only and dispatches product/address fetches */}
                    <GlobalLoader />
                    {children}
                </StoreProvider>
            </body>
        </html>
        </ClerkProvider>
    );
}
