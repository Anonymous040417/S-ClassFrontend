import { BarChart, Clipboard, ShoppingCart, Users, Car, CreditCard, Settings, TrendingUp, PieChart, Activity, DollarSign, Calendar, MapPin, Filter } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'

// Import APIs
import { usersApi } from '../features/api/UserAPi'
import { BookingApi } from '../features/api/BookingsApi'
import { VehicleApi } from '../features/api/VehiclesApi'
import { PaymentsApi } from '../features/api/PaymentApi'
import type { Payment, Booking, Vehicle, User } from '../types/Types'

interface CurrentUser {
  name: string
  role: string
  email: string
}

interface DashboardStats {
  totalPayments: number
  completedPayments: number
  pendingPayments: number
  totalRevenue: number
}

const AdminSidebar: React.FC = () => {
    const location = useLocation()
    const [timeRange, setTimeRange] = useState('week')
    
    // API Calls
    const { data: usersResponse, isLoading: usersLoading } = usersApi.useGetAllUsersQuery()
    const { data: bookingsResponse, isLoading: bookingsLoading } = BookingApi.useGetAllBookingsQuery()
    const { data: vehiclesResponse, isLoading: vehiclesLoading } = VehicleApi.useGetAllVehiclesQuery()
    const { data: paymentsResponse, isLoading: paymentsLoading } = PaymentsApi.useGetAllPaymentsQuery()
    
    // State variables
    const [userCount, setUserCount] = useState(0)
    const [bookingCount, setBookingCount] = useState(0)
    const [paymentCount, setPaymentCount] = useState(0)
    const [vehicleCount, setVehicleCount] = useState(0)
    const [revenue, setRevenue] = useState(0)
    const [paymentStats, setPaymentStats] = useState<DashboardStats>({
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0,
        totalRevenue: 0
    })
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
        
        if (response?.payments && Array.isArray(response.payments)) {
            return response.payments
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
            return sum + (booking.total_amount || 0)
        }, 0)
        setRevenue(totalRevenue)
        
        // Vehicles
        const vehicles = extractArrayFromResponse(vehiclesResponse)
        setVehicleCount(vehicles.length)
        
        // Calculate vehicle status counts
        if (vehicles.length > 0) {
            const statusCounts = {
                available: vehicles.filter((v: Vehicle) => v.status === 'available' || v.availability === true).length,
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
        
        // PAYMENTS: Calculate payment statistics
        const payments = extractArrayFromResponse(paymentsResponse)
        if (payments.length > 0) {
            setPaymentCount(payments.length)
            
            const completedPayments = payments.filter((p: Payment) => 
                p.payment_status === 'completed' || p.payment_status === 'paid'
            ).length
            
            const pendingPayments = payments.filter((p: Payment) => 
                p.payment_status === 'pending'
            ).length
            
            const totalPaymentRevenue = payments
                .filter((p: Payment) => p.payment_status === 'completed' || p.payment_status === 'paid')
                .reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0)
            
            setPaymentStats({
                totalPayments: payments.length,
                completedPayments,
                pendingPayments,
                totalRevenue: totalPaymentRevenue
            })
        } else {
            // Fallback: estimate payment count from bookings
            const paidBookings = bookings.filter((b: Booking) => 
                b.booking_status === 'completed' || b.booking_status === 'confirmed'
            ).length
            setPaymentCount(paidBookings)
        }
        
        // Generate recent activity from bookings, payments, and users
        const activity = []
        
        // Add recent payments as activity
        if (payments.length > 0) {
            const recentPayments = payments.slice(0, 3).map((payment: Payment, index: number) => ({
                time: `${(index + 1) * 5} min ago`,
                action: `Payment ${payment.payment_status}`,
                details: `$${payment.amount} - ${payment.payment_method || 'Payment'}`,
                user: payment.user?.first_name || payment.booking?.user_name || 'Customer'
            }))
            activity.push(...recentPayments)
        }
        
        // Add recent bookings as activity
        if (bookings.length > 0) {
            const recentBookings = bookings.slice(0, 2).map((booking: Booking, index: number) => ({
                time: `${(index + 4) * 5} min ago`,
                action: `New booking`,
                details: `#${booking.booking_id?.toString().slice(-6) || 'CRB' + (100 + index)}`,
                user: booking.first_name || 'Customer'
            }))
            activity.push(...recentBookings)
        }
        
        // Add user registrations if we have recent users
        if (users.length > 0) {
            const recentUsers = users.slice(0, 1).map((user: User, index: number) => ({
                time: `${(index + 6) * 6} min ago`,
                action: 'New user registered',
                details: user.email,
                user: `${user.first_name} ${user.last_name}`
            }))
            activity.push(...recentUsers)
        }
        
        // Sort by time (simulated)
        activity.sort((a, b) => {
            const timeA = parseInt(a.time)
            const timeB = parseInt(b.time)
            return timeA - timeB
        })
        
        // If no activity from API, show sample data
        if (activity.length === 0) {
            setRecentActivity([
                { time: '2 min ago', action: 'Payment completed', details: '$450 - Mpesa', user: 'John Smith' },
                { time: '5 min ago', action: 'New booking', details: '#CRB284', user: 'Sarah Johnson' },
                { time: '12 min ago', action: 'Payment pending', details: '$320 - Card', user: 'Mike Wilson' },
                { time: '18 min ago', action: 'New user registered', details: 'user@example.com', user: 'Emma Davis' }
            ])
        } else {
            setRecentActivity(activity.slice(0, 4))
        }
        
    }, [usersResponse, bookingsResponse, vehiclesResponse, paymentsResponse])

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
            badge: paymentsLoading ? '...' : paymentStats.totalPayments.toString()
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
            name: 'Analytics',
            path: '/admin/analytics',
            icon: <TrendingUp className="w-5 h-5" />,
            badge: ''
        },
    ]

    // If you want to add a payment statistics section in the sidebar:
    const renderPaymentStats = () => (
        <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Payment Overview</h3>
                <CreditCard className="w-4 h-4 text-green-400" />
            </div>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Payments:</span>
                    <span className="text-white font-bold">{paymentStats.totalPayments}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Completed:</span>
                    <span className="text-green-400 font-bold">{paymentStats.completedPayments}</span>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pending:</span>
                    <span className="text-yellow-400 font-bold">{paymentStats.pendingPayments}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-gray-400 text-sm">Revenue:</span>
                    <span className="text-green-400 font-bold">{formatCurrency(paymentStats.totalRevenue)}</span>
                </div>
            </div>
        </div>
    )

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
                
                {/* User Info */}
                <div className="mt-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-lg">
                                {currentUser.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{currentUser.name}</h3>
                            <p className="text-gray-400 text-sm">{currentUser.role}</p>
                        </div>
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
                        {item.badge && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold min-w-6 text-center ${
                                isActive(item.path) 
                                    ? 'bg-white text-red-600' 
                                    : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
                            }`}>
                                {item.badge}
                            </span>
                        )}

                        {/* Active indicator */}
                        {isActive(item.path) && (
                            <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Payment Statistics Section */}
            {renderPaymentStats()}

            {/* Vehicle Status Overview */}
            <div className="mt-6 p-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Vehicle Status</h3>
                <div className="space-y-3">
                    {vehicleStatus.map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                                <span className="text-gray-400 text-sm">{item.status}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-white font-bold mr-2">{item.count}</span>
                                <span className="text-gray-500 text-xs">
                                    ({((item.count / totalVehicles) * 100).toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-6 p-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Recent Activity</h3>
                <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="text-white text-sm">{activity.action}</span>
                                    <span className="text-gray-500 text-xs">{activity.time}</span>
                                </div>
                                <p className="text-gray-400 text-xs">{activity.details || activity.user}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-bold">{bookingCount}</div>
                    <div className="text-gray-400 text-xs">Bookings</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-bold">{paymentStats.totalPayments}</div>
                    <div className="text-gray-400 text-xs">Payments</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-bold">{formatCurrency(revenue)}</div>
                    <div className="text-gray-400 text-xs">Revenue</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-bold">{userCount}</div>
                    <div className="text-gray-400 text-xs">Users</div>
                </div>
            </div>
        </div>
    )
}

export default AdminSidebar