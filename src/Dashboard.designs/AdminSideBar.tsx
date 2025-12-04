import { BarChart, Clipboard, ShoppingCart, Users, Car, CreditCard, Settings, TrendingUp, PieChart, Activity, DollarSign, Calendar, MapPin, Filter } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'

// Import APIs
import { usersApi } from '../features/api/UserAPi'
import { BookingApi } from '../features/api/BookingsApi'
import { VehicleApi } from '../features/api/VehiclesApi'
// import { PaymentApi } from '../features/api/PaymentsApi' // You'll need to create this

interface CurrentUser {
  name: string
  role: string
  email: string
}

interface Vehicle {
  _id: string
  status: 'available' | 'rented' | 'maintenance' | 'reserved'
  [key: string]: any
}

interface Booking {
  _id: string
  totalAmount: number
  status: string
  createdAt: string
  [key: string]: any
}

interface Payment {
  _id: string
  amount: number
  status: string
  [key: string]: any
}

const AdminSidebar: React.FC = () => {
    const location = useLocation()
    const [timeRange, setTimeRange] = useState('week')
    
    // API Calls
    const { data: usersResponse, isLoading: usersLoading } = usersApi.useGetAllUsersQuery()
    const { data: bookingsResponse, isLoading: bookingsLoading } = BookingApi.useGetAllBookingsQuery()
    const { data: vehiclesResponse, isLoading: vehiclesLoading } = VehicleApi.useGetAllVehiclesQuery()
    // Add this Payment API hook (you'll need to create PaymentApi)
    // const { data: paymentsResponse, isLoading: paymentsLoading } = PaymentApi.useGetAllPaymentsQuery()
    
    const [userCount, setUserCount] = useState(0)
    const [bookingCount, setBookingCount] = useState(0)
    const [paymentCount, setPaymentCount] = useState(0)
    const [vehicleCount, setVehicleCount] = useState(0)
    const [revenue, setRevenue] = useState(0)
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [vehicleStatus, setVehicleStatus] = useState([
        { status: 'Available', count: 0, color: 'bg-green-500' },
        { status: 'Rented', count: 0, color: 'bg-blue-500' },
        { status: 'Maintenance', count: 0, color: 'bg-yellow-500' },
        { status: 'Reserved', count: 0, color: 'bg-purple-500' }
    ])
    
    const [currentUser, setCurrentUser] = useState<CurrentUser>({
        name: 'Admin User',
        role: 'Super Administrator',
        email: 'admin@carrental.com'
    })

    // Helper function to extract array from API response
    const extractArrayFromResponse = (response: any): any[] => {
        if (!response) return []
        
        if (Array.isArray(response)) {
            return response
        }
        
        if (response?.data && Array.isArray(response.data)) {
            return response.data
        }
        
        if (response?.users && Array.isArray(response.users)) {
            return response.users
        }
        
        if (response?.bookings && Array.isArray(response.bookings)) {
            return response.bookings
        }
        
        if (response?.vehicles && Array.isArray(response.vehicles)) {
            return response.vehicles
        }
        
        if (response?.success && response?.data && Array.isArray(response.data)) {
            return response.data
        }
        
        console.warn('Unexpected API response structure:', response)
        return []
    }

    // Calculate statistics from API data
    useEffect(() => {
        // Users
        const users = extractArrayFromResponse(usersResponse)
        setUserCount(users.length)
        
        // Bookings
        const bookings = extractArrayFromResponse(bookingsResponse)
        setBookingCount(bookings.length)
        
        // Calculate revenue from bookings
        const totalRevenue = bookings.reduce((sum: number, booking: Booking) => {
            return sum + (booking.totalAmount || 0)
        }, 0)
        setRevenue(totalRevenue)
        
        // Vehicles
        const vehicles = extractArrayFromResponse(vehiclesResponse)
        setVehicleCount(vehicles.length)
        
        // Calculate vehicle status counts
        if (vehicles.length > 0) {
            const statusCounts = {
                available: vehicles.filter((v: Vehicle) => v.status === 'available').length,
                rented: vehicles.filter((v: Vehicle) => v.status === 'rented').length,
                maintenance: vehicles.filter((v: Vehicle) => v.status === 'maintenance').length,
                reserved: vehicles.filter((v: Vehicle) => v.status === 'reserved').length
            }
            
            setVehicleStatus([
                { status: 'Available', count: statusCounts.available, color: 'bg-green-500' },
                { status: 'Rented', count: statusCounts.rented, color: 'bg-blue-500' },
                { status: 'Maintenance', count: statusCounts.maintenance, color: 'bg-yellow-500' },
                { status: 'Reserved', count: statusCounts.reserved, color: 'bg-purple-500' }
            ])
        }
        
        // Generate recent activity from bookings and users
        const activity = []
        if (bookings.length > 0) {
            // Add recent bookings as activity
            const recentBookings = bookings.slice(0, 4).map((booking: Booking, index: number) => ({
                time: `${(index + 1) * 5} min ago`,
                action: `New booking #${booking._id?.slice(-6) || 'CRB' + (100 + index)}`,
                user: booking.userName || 'Customer'
            }))
            activity.push(...recentBookings)
        }
        
        // Add user registrations if we have recent users
        if (users.length > 0) {
            const recentUsers = users.slice(0, 2).map((user: any, index: number) => ({
                time: `${(index + 3) * 6} min ago`,
                action: 'New user registered',
                user: user.name || user.email || 'New User'
            }))
            activity.push(...recentUsers)
        }
        
        // Sort by time (simulated)
        activity.sort((a, b) => {
            const timeA = parseInt(a.time)
            const timeB = parseInt(b.time)
            return timeA - timeB
        })
        
        setRecentActivity(activity.length > 0 ? activity.slice(0, 4) : [
            { time: '2 min ago', action: 'New booking #CRB284', user: 'John Smith' },
            { time: '5 min ago', action: 'Payment received', user: 'Sarah Johnson' },
            { time: '12 min ago', action: 'Vehicle check-in', user: 'Mike Wilson' },
            { time: '18 min ago', action: 'New user registered', user: 'Emma Davis' }
        ])
        
        // Set payment count (you'll need to fetch real payments data)
        setPaymentCount(bookings.filter((b: Booking) => b.status === 'paid').length)
        
    }, [usersResponse, bookingsResponse, vehiclesResponse])

    // Get current user from localStorage or session
    useEffect(() => {
        const userData = localStorage.getItem('currentUser')
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData)
                setCurrentUser(prev => ({
                    ...prev,
                    ...parsedUser
                }))
            } catch (error) {
                console.error('Error parsing user data:', error)
            }
        }
    }, [])

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Calculate percentage changes (you can replace with real calculation)
    const calculateChange = (current: number, previous: number = current * 0.8) => {
        const change = ((current - previous) / previous) * 100
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    }

    const isActive = (path: string) => location.pathname.startsWith(path)

    const navigationItems = [
        {
            name: 'Dashboard',
            path: '/admin/dashboard',
            icon: <BarChart className="w-5 h-5" />,
            badge: ''
        },
        {
            name: 'Bookings',
            path: '/admin/bookings',
            icon: <ShoppingCart className="w-5 h-5" />,
            badge: bookingsLoading ? '...' : bookingCount.toString()
        },
        {
            name: 'Payments',
            path: '/admin/payments',
            icon: <CreditCard className="w-5 h-5" />,
            badge: paymentCount.toString() // Add loading state when you have payments API
        },
        {
            name: 'Users',
            path: '/admin/users',
            icon: <Users className="w-5 h-5" />,
            badge: usersLoading ? '...' : userCount.toString()
        },
        {
            name: 'Vehicles',
            path: '/admin/vehicles',
            icon: <Car className="w-5 h-5" />,
            badge: vehiclesLoading ? '...' : vehicleCount.toString()
        },
        {
            name: 'Services',
            path: '/admin/services',
            icon: <Clipboard className="w-5 h-5" />,
            badge: '0' // Add when you have services API
        }
    ]

  

    // Calculate total vehicles for percentage
    const totalVehicles = vehicleStatus.reduce((sum, status) => sum + status.count, 0) || 1

    return (
        <div className="bg-gray-900 border-r border-gray-700 shadow-2xl transition-all duration-300 w-80 min-h-screen fixed left-0 top-0 z-40 overflow-y-auto">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Car className="w-8 h-8 text-red-600 mr-3" />
                        <div>
                            <h1 className="text-lg font-bold text-white">S-Class Analytics</h1>
                            <p className="text-gray-400 text-xs">Executive Dashboard</p>
                        </div>
                    </div>
                </div>
                
           
            {/* Navigation Menu */}
            <nav className="p-4 space-y-1">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Navigation</h3>
                    <Settings className="w-4 h-4 text-gray-500" />
                </div>
                {navigationItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                            isActive(item.path)
                                ? 'bg-red-600 text-white shadow-lg transform scale-[1.02] border-l-4 border-red-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:border-l-4 hover:border-gray-600'
                        }`}
                    >
                        <span className={`shrink-0 mr-3 transition-colors ${
                            isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-red-400'
                        }`}>
                            {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        
                        {/* Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-bold min-w-6 text-center ${
                            isActive(item.path) 
                                ? 'bg-white text-red-600' 
                                : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
                        }`}>
                            {item.badge}
                        </span>

                        {/* Active indicator */}
                        {isActive(item.path) && (
                            <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Vehicle Status Overview */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Fleet Status</h3>
                    <Activity className="w-4 h-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                    {vehicleStatus.map((status, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                                <span className="text-sm text-gray-400">{status.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{status.count}</span>
                                <div className="w-16 bg-gray-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${status.color} transition-all duration-1000`}
                                        style={{ width: `${(status.count / totalVehicles) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Activity</h3>
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{activity.action}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">{activity.user}</span>
                                    <span className="text-xs text-gray-500">{activity.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Analytics */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">User Analytics</h3>
                    <Users className="w-4 h-4 text-gray-500" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Total Registered Users</span>
                        <span className="text-xs text-green-500 font-semibold">
                            {userCount > 0 ? `+${Math.round(userCount * 0.05)}%` : '0%'}
                        </span>
                    </div>
                    {/* User growth visualization */}
                    <div className="flex items-end justify-between h-16 gap-1">
                        {[20, 35, 50, 65, 45, 70, userCount > 0 ? Math.min(100, (userCount / 10) * 7) : 80].map((height, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div 
                                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-500 hover:from-purple-500 hover:to-purple-300"
                                    style={{ height: `${height}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-1">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs text-gray-400">
                            {userCount} total users • {Math.round(userCount * 0.15)} active today
                        </span>
                    </div>
                </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center group-hover:from-red-500 group-hover:to-red-700 transition-colors">
                        <span className="text-white font-bold text-sm">
                            {currentUser.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
                        {currentUser.email && (
                            <p className="text-xs text-gray-500 truncate mt-1">{currentUser.email}</p>
                        )}
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
                </div>
                
                {/* Quick User Stats */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                        <div className="text-white text-sm font-bold">{userCount}</div>
                        <div className="text-gray-400 text-xs">Users</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                        <div className="text-white text-sm font-bold">12</div>
                        <div className="text-gray-400 text-xs">Active</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                        <div className="text-white text-sm font-bold">5</div>
                        <div className="text-gray-400 text-xs">New</div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}

export default AdminSidebar