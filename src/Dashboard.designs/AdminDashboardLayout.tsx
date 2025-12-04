import React from 'react'

// import Footer from '../components/footer'
import AdminSidebar from './AdminSideBar'

interface DashboardLayoutProps {
    children: React.ReactNode
}

const AdminDashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {



    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            

            {/* Layout Container */}
            <div className="flex ">
                {/* Sidebar */}
                <AdminSidebar />
                <div className=" lg:ml-30 justify-center min-h-screen">
                        {/* Main Content */}
                <main className="transition-all duration-300  ml-64" >
                    <div className="p-6 min-h-[calc(100vh-128px)] ">
                        {children}
                    </div>
                </main>
                </div>

            
            </div>

            {/* Footer positioned at bottom */}
            <div className=" flex-1 transition-all duration-300 " >
                {/* <Footer /> */}
            </div>
        </div>
    )
}

export default AdminDashboardLayout;