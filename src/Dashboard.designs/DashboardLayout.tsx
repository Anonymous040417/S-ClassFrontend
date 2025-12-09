
import UserSidebar from './UserSideBar'



interface DashboardLayoutProps {
    children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
 

    return (
        <div className="min-h-screen bg-gray-50">
           
         
            <div className="flex-1">
                {/* Sidebar - Pass the user object */}
                <UserSidebar />
                
                {/* Main Content Area */}
                <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
                    <div className="p-6 min-h-[calc(100vh-128px)]">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <div className="flex-1 transition-all duration-300">
                {/* <Footer /> */}
            </div>
        </div>
    )
}

export default DashboardLayout