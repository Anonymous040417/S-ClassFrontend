import React, { useState, useEffect } from 'react'
import type { RecentBooking, Booking, } from '../../types/Types'
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout'
import { 
  Car, DollarSign, ShoppingCart, Users, Plus, FileText, Settings, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Loader2, Eye, 
  Download, RefreshCw, ArrowRight, Star, BarChart3, Calendar,
   Trash2,
} from 'lucide-react'
import { adminApi } from '../../features/api/AdminApi'
import { VehicleApi } from '../../features/api/VehiclesApi'
import { BookingApi } from '../../features/api/BookingsApi'
import { useNavigate } from 'react-router'


const AdminDashboard: React.FC = () => {
    const navigate = useNavigate()
    
    // State for UI
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<string>('current')
    const [vehicleFilter, setVehicleFilter] = useState<'all' | 'available' | 'popular'>('all')
    const [showRevenueChart, setShowRevenueChart] = useState(false)
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
    const [showNewBookingModal, setShowNewBookingModal] = useState(false)
    const [newVehicleData, setNewVehicleData] = useState({
        manufacturer: '',
        model: '',
        year: 2024,
        price: 0,
        category: 'suv'
    })
    const [newBookingData, setNewBookingData] = useState({
        user_id: '',
        vehicle_id: '',
       booking_date: '',
       return_date: ''
    })
    
    // RTK Query Hooks with refetch capabilities
    const { 
        data: dashboardData, 
        isLoading: dashboardLoading, 
        error: dashboardError,
        refetch: refetchDashboard 
    } = adminApi.useGetDashboardStatsQuery()
    
    const { 
        data: analyticsData, 
        isLoading: analyticsLoading, 
       
        refetch: refetchAnalytics 
    } = adminApi.useGetAnalyticsQuery()
    
    const { 
        data: bookingsData, 
        isLoading: bookingsLoading, 
        error: bookingsError,
        refetch: refetchBookings 
    } = BookingApi.useGetAllBookingsQuery()
    
    const { 
        data: usersData, 
        isLoading: usersLoading, 
        error: usersError,
        refetch: refetchUsers 
    } = adminApi.useGetAllUsersQuery()
    
    const { 
        data: vehiclesData, 
        isLoading: vehiclesLoading, 
        error: vehiclesError,
        refetch: refetchVehicles 
    } = VehicleApi.useGetAllVehiclesQuery()
    
    // Mutation hooks for actions
    const [createBooking] = BookingApi.useCreateNewBookingMutation()
    const [addVehicle] = VehicleApi.useAddVehicleMutation()
    const [updateBookingStatus] = adminApi.useUpdateBookingStatusMutation()
    const [deleteBooking] = BookingApi.useCancelBookingMutation()
    const [deleteVehicle] = VehicleApi.useDeleteVehicleMutation()
   

    // Transform API bookings to RecentBooking format
    const transformBookingsToRecent = (bookings: Booking[]): RecentBooking[] => {
        if (!bookings || bookings.length === 0) return []

        // Sort by most recent booking date
        const sortedBookings = [...bookings].sort((a, b) => {
            const dateA = new Date(a.booking_date).getTime()
            const dateB = new Date(b.booking_date).getTime()
            return dateB - dateA
        })

        return sortedBookings.slice(0, 8).map(booking => {
            // Format customer name
            const customerName = booking.first_name && booking.last_name
                ? `${booking.first_name} ${booking.last_name}`
                : booking.user_id ? `User #${booking.user_id}` : 'Unknown User'

            // Format vehicle name
            const vehicleName = booking.manufacturer && booking.model
                ? `${booking.manufacturer} ${booking.model}`
                : booking.vehicle_id ? `Vehicle #${booking.vehicle_id}` : 'Unknown Vehicle'

            // Format time (relative time from booking date)
            const formatTime = (dateString: string): string => {
                try {
                    const bookingDate = new Date(dateString)
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - bookingDate.getTime())
                    const diffMinutes = Math.floor(diffTime / (1000 * 60))
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffMinutes < 60) {
                        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
                    } else if (diffHours < 24) {
                        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
                    } else if (diffDays === 0) {
                        return 'Today'
                    } else if (diffDays === 1) {
                        return 'Yesterday'
                    } else if (diffDays < 7) {
                        return `${diffDays} days ago`
                    } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7)
                        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
                    } else {
                        const months = Math.floor(diffDays / 30)
                        return months === 1 ? '1 month ago' : `${months} months ago`
                    }
                } catch (error) {
                    return 'Recently'
                }
            }

            // Determine status-based time display
            const getTimeDisplay = (status: string, bookingDate: string): string => {
                switch (status) {
                    case 'active':
                        return 'Currently active'
                    case 'completed':
                        return `Completed ${formatTime(bookingDate)}`
                    case 'confirmed':
                        return `Confirmed for ${formatTime(bookingDate)}`
                    case 'pending':
                        return 'Awaiting confirmation'
                    case 'cancelled':
                        return 'Cancelled'
                    default:
                        return formatTime(bookingDate)
                }
            }

            return {
                id: booking.booking_id ?? 0,
                customer: customerName,
                vehicle: vehicleName,
                amount: booking.total_amount || 0,
                status: booking.booking_status || 'pending',
                time: getTimeDisplay(booking.booking_status || 'pending', booking.booking_date || new Date().toISOString()),
                bookingData: booking
            }
        })
    }

    // Effect to update recent bookings when data changes
    useEffect(() => {
        const loadRecentBookings = () => {
            setIsLoading(true)
            setError(null)
            
            try {
                if (bookingsData && bookingsData.length > 0) {
                    const transformedBookings = transformBookingsToRecent(bookingsData)
                    setRecentBookings(transformedBookings)
                } else {
                    setRecentBookings([])
                }
            } catch (err) {
                setError('Failed to load recent bookings')
                setRecentBookings([])
                console.error('Error transforming bookings:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadRecentBookings()
    }, [bookingsData])

    // Calculate popular vehicles
    const getPopularVehicles = () => {
        if (!analyticsData?.popular_vehicles || analyticsData.popular_vehicles.length === 0) {
            return vehiclesData ? 
                vehiclesData.slice(0, 5).map(vehicle => ({
                    ...vehicle,
                    bookings_count: 0,
                    revenue_generated: 0
                })) : []
        }
        
        return analyticsData.popular_vehicles.slice(0, 5)
    }

    // Get revenue trend data
    const getRevenueTrend = () => {
        if (!analyticsData?.monthly_revenue || analyticsData.monthly_revenue.length === 0) {
            // Generate placeholder data
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
            return months.map(month => ({
                month,
                revenue: Math.floor(Math.random() * 100000) + 50000
            }))
        }
        
        return analyticsData.monthly_revenue.slice(0, 6)
    }

    // Get filtered vehicles based on selection
    const getFilteredVehicles = () => {
        if (!vehiclesData) return []
        
        switch (vehicleFilter) {
            case 'available':
                return vehiclesData.filter(v => v.availability)
            case 'popular':
                const popularIds = analyticsData?.popular_vehicles?.slice(0, 5).map(v => ('vehicle_id' in v ? (v as any).vehicle_id : undefined)).filter(Boolean) || []
                return vehiclesData.filter(v => popularIds.includes(v.vehicle_id))
            default:
                return vehiclesData.slice(0, 5)
        }
    }

    // Button click handlers
    const handleViewAllBookings = () => {
        navigate('/admin/bookings')
    }

    const handleViewAllUsers = () => {
        navigate('/admin/users')
    }

    const handleViewAllVehicles = () => {
        navigate('/admin/vehicles')
    }

    const handleAddVehicle = () => {
        setShowAddVehicleModal(true)
    }

    const handleNewBooking = () => {
        setShowNewBookingModal(true)
    }

    const handleViewReports = () => {
        navigate('/admin/reports')
    }

    const handleSettings = () => {
        navigate('/admin/settings')
    }

    const handleRefreshData = () => {
        refetchDashboard()
        refetchAnalytics()
        refetchBookings()
        refetchUsers()
        refetchVehicles()
    }

    const handleExportData = () => {
        // Create CSV data
        const csvData = [
            ['Dashboard Statistics', 'Value'],
            ['Total Bookings', dashboardData?.total_bookings || 0],
            ['Total Revenue', `$${dashboardData?.total_revenue || 0}`],
            ['Total Users', dashboardData?.total_users || 0],
            ['Total Vehicles', dashboardData?.total_vehicles || 0],
            ['Active Bookings', dashboardData?.active_bookings || 0]
        ]
        
        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handleBookingClick = (bookingId: number) => {
        navigate(`/admin/bookings/${bookingId}`)
    }

  
    const handleVehicleClick = (vehicleId: number) => {
        navigate(`/admin/vehicles/${vehicleId}`)
    }

    const handleUpdateBookingStatus = async (bookingId: number, newStatus: string) => {
        try {
            await updateBookingStatus({ 
                booking_id: bookingId, 
                booking_status: newStatus as any 
            }).unwrap()
            refetchBookings()
        } catch (error) {
            console.error('Failed to update booking status:', error)
        }
    }

    const handleDeleteBooking = async (booking_id: number) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await deleteBooking({ booking_id }).unwrap()
                refetchBookings()
            } catch (error) {
                console.error('Failed to delete booking:', error)
            }
        }
    }

    const handleDeleteVehicle = async (vehicleId: number) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await deleteVehicle({ vehicle_id: vehicleId }).unwrap()
                refetchVehicles()
            } catch (error) {
                console.error('Failed to delete vehicle:', error)
            }
        }
    }

    const handleSubmitNewVehicle = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await addVehicle({
                ...newVehicleData,
                category: newVehicleData.category.toUpperCase() as any
            }).unwrap()
            setShowAddVehicleModal(false)
            setNewVehicleData({
                manufacturer: '',
                model: '',
                year: 2024,
                price: 0,
                category: 'suv'
            })
            refetchVehicles()
        } catch (error) {
            console.error('Failed to add vehicle:', error)
        }
    }

    const handleSubmitNewBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createBooking({
                user_id: parseInt(newBookingData.user_id),
                vehicle_id: parseInt(newBookingData.vehicle_id),
               booking_date: newBookingData.booking_date,
               return_date: newBookingData.return_date
            }).unwrap()
            setShowNewBookingModal(false)
            setNewBookingData({
                user_id: '',
                vehicle_id: '',
               booking_date: '',
               return_date: ''
            })
            refetchBookings()
        } catch (error) {
            console.error('Failed to create booking:', error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'active': return <TrendingUp className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    }

    // Calculate utilization rate from actual data
    const utilizationRate = vehiclesData && vehiclesData.length > 0 ? 
        Math.round(((vehiclesData.length - (vehiclesData.filter(v => v.availability).length || 0)) / vehiclesData.length) * 100) : 0

    // Calculate real stats from API data
    const totalCustomers = usersData?.length || dashboardData?.total_users || 0
    const totalVehicles = vehiclesData?.length || dashboardData?.total_vehicles || 0
    const availableVehicles = vehiclesData?.filter(v => v.availability).length || dashboardData?.available_vehicles || 0
    const totalBookings = bookingsData?.length || dashboardData?.total_bookings || 0
    const totalRevenue = dashboardData?.total_revenue || 0

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Loading state
    const isDataLoading = dashboardLoading || bookingsLoading || usersLoading || vehiclesLoading || isLoading

    // Error state
    const hasError = dashboardError || bookingsError || usersError || vehiclesError || error

    // Popular vehicles data
    const popularVehicles = getPopularVehicles()
    const revenueTrend = getRevenueTrend()
    const filteredVehicles = getFilteredVehicles()

    // Calculate performance metrics
    const activeBookings = bookingsData ? bookingsData.filter(b => b.booking_status === 'active').length : 0
    const completionRate = bookingsData && bookingsData.length > 0 
        ? Math.round((bookingsData.filter(b => b.booking_status === 'completed').length / bookingsData.length) * 100)
        : 0

    return (
        <AdminDashboardLayout>
            {/* Premium Header Section - Responsive */}
            <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-white bg-opacity-20 p-1 sm:p-2 rounded-lg sm:rounded-xl">
                                    <Car className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Car Rental Dashboard</h1>
                                    <p className="text-gray-100 text-sm sm:text-base md:text-lg opacity-90">
                                        {isDataLoading ? 'Loading dashboard data...' : 
                                        bookingsData ? `Managing ${totalBookings} bookings` : 
                                        'Welcome to Premium Car Rental Management System'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleExportData}
                                    className="btn bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-none px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                                <button 
                                    onClick={handleRefreshData}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white border-none px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2 bg-white bg-opacity-10 px-2 sm:px-3 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Performance: {utilizationRate > 70 ? 'Excellent' : utilizationRate > 40 ? 'Good' : 'Normal'}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 bg-white bg-opacity-10 px-2 sm:px-3 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{hasError ? 'System issues detected' : 'All systems operational'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute right-2 sm:right-4 md:right-6 top-2 sm:top-4 md:top-6 opacity-10">
                        <Car size={80} className="hidden sm:block md:hidden" />
                        <Car size={100} className="hidden md:block lg:hidden" />
                        <Car size={120} className="hidden lg:block" />
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                {[
                    {
                        title: "Total Bookings",
                        value: totalBookings,
                        icon: ShoppingCart,
                        color: "bg-blue-500",
                        trend: bookingsData ? `${bookingsData.filter(b => b.booking_status === 'pending').length} pending` : "0 pending",
                        description: "All time bookings",
                        action: () => handleViewAllBookings()
                    },
                    {
                        title: "Total Revenue",
                        value: formatCurrency(totalRevenue),
                        icon: DollarSign,
                        color: "bg-green-500",
                        trend: revenueTrend.length > 0 ? `+${Math.round((revenueTrend[revenueTrend.length - 1].revenue / revenueTrend[0].revenue - 1) * 100)}% growth` : "+0% growth",
                        description: "Revenue growth",
                        action: () => setShowRevenueChart(!showRevenueChart)
                    },
                    {
                        title: "Total Customers",
                        value: totalCustomers,
                        icon: Users,
                        color: "bg-purple-500",
                        trend: usersData ? `${usersData.filter(u => u.role === 'admin').length || 0} admins` : "0 admins",
                        description: "Registered users",
                        action: () => handleViewAllUsers()
                    },
                    {
                        title: "Available Vehicles",
                        value: `${availableVehicles}/${totalVehicles}`,
                        icon: Car,
                        color: "bg-orange-500",
                        trend: `${utilizationRate}% utilized`,
                        description: "Fleet status",
                        action: () => handleViewAllVehicles()
                    }
                ].map((stat, index) => {
                    const IconComponent = stat.icon;

                    return (
                        <div 
                            key={index}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-4 md:p-6 border transform hover:scale-105 transition-all duration-300 hover:shadow-xl sm:hover:shadow-2xl group cursor-pointer"
                            onClick={stat.action}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1 truncate">{stat.title}</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                                        {stat.value}
                                    </p>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
                                            {stat.trend}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate">{stat.description}</span>
                                    </div>
                                </div>
                                <div className={`p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl ${stat.color} text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2 sm:ml-3`}>
                                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Revenue Chart Modal */}
            {showRevenueChart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Revenue Trends</h3>
                                <button 
                                    onClick={() => setShowRevenueChart(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <select 
                                        className="border rounded-lg px-3 py-2"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    >
                                        <option value="current">Current Month</option>
                                        <option value="last3">Last 3 Months</option>
                                        <option value="last6">Last 6 Months</option>
                                        <option value="last12">Last 12 Months</option>
                                    </select>
                                    <span className="font-bold text-green-600">
                                        Total: {formatCurrency(totalRevenue)}
                                    </span>
                                </div>
                                <div className="h-64 bg-gray-50 rounded-lg p-4">
                                    {/* Simple bar chart representation */}
                                    <div className="flex items-end h-full gap-2">
                                        {revenueTrend.map((month, index) => {
                                            const maxRevenue = Math.max(...revenueTrend.map(m => m.revenue))
                                            const height = (month.revenue / maxRevenue) * 100
                                            return (
                                                <div key={index} className="flex flex-col items-center flex-1">
                                                    <div 
                                                        className="w-full bg-gradient-to-t from-green-400 to-green-600 rounded-t-lg transition-all duration-300 hover:opacity-80"
                                                        style={{ height: `${height}%` }}
                                                    ></div>
                                                    <span className="text-xs mt-2 text-gray-600">{month.month}</span>
                                                    <span className="text-xs font-semibold text-green-700">
                                                        {formatCurrency(month.revenue)}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Average Monthly Revenue</p>
                                        <p className="text-xl font-bold">
                                            {formatCurrency(revenueTrend.reduce((sum, m) => sum + m.revenue, 0) / revenueTrend.length)}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600">Growth Rate</p>
                                        <p className="text-xl font-bold">
                                            {revenueTrend.length > 1 
                                                ? `${Math.round((revenueTrend[revenueTrend.length - 1].revenue / revenueTrend[0].revenue - 1) * 100)}%`
                                                : '0%'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid - Responsive */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {/* Recent Bookings - Wider Column */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Bookings</h2>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                    {isDataLoading ? 'Loading recent bookings...' : 
                                     recentBookings.length > 0 ? `Latest ${recentBookings.length} rental activities` : 
                                     'No recent bookings found'}
                                </p>
                            </div>
                            <button 
                                onClick={handleViewAllBookings}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold transform hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto flex items-center gap-2"
                            >
                                <span>View All</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {isDataLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-gray-500">Loading recent bookings...</p>
                            </div>
                        ) : hasError ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-red-600">
                                <AlertCircle className="w-8 h-8" />
                                <p>Failed to load bookings. Please try again.</p>
                                <button 
                                    onClick={handleRefreshData}
                                    className="btn bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : recentBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-gray-500">
                                <ShoppingCart className="w-12 h-12 opacity-50" />
                                <p className="text-lg">No recent bookings found</p>
                                <p className="text-sm">New bookings will appear here</p>
                                <button 
                                    onClick={handleNewBooking}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white mt-4"
                                >
                                    Create New Booking
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {recentBookings.map((booking) => (
                                    <div 
                                        key={booking.id} 
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200 border border-gray-100 gap-3 sm:gap-0 group cursor-pointer"
                                        onClick={() => handleBookingClick(booking.id)}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm border flex-shrink-0">
                                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-blue-600">
                                                    {booking.customer}
                                                </h3>
                                                <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1 truncate">
                                                    <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                    <span className="truncate">{booking.vehicle}</span>
                                                </p>
                                                <p className="text-gray-400 text-xs truncate">{booking.time}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
                                            <div className="text-right">
                                                <p className="font-bold text-green-700 text-base sm:text-lg">
                                                    {formatCurrency(booking.amount)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border ${getStatusColor(booking.status)} flex-shrink-0`}>
                                                    {getStatusIcon(booking.status)}
                                                    <span className="text-xs sm:text-sm font-medium capitalize hidden xs:inline">
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <select 
                                                        className="text-xs border rounded px-2 py-1 bg-white hover:bg-gray-50"
                                                        value={booking.status}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            handleUpdateBookingStatus(booking.id, e.target.value)
                                                        }}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="active">Active</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteBooking(booking.id)
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Popular Vehicles Section */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Popular Vehicles</h2>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                    {analyticsLoading ? 'Loading popular vehicles...' : 
                                     popularVehicles.length > 0 ? 'Most booked vehicles this month' : 
                                     'Vehicle booking analytics'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                                    value={vehicleFilter}
                                    onChange={(e) => setVehicleFilter(e.target.value as any)}
                                >
                                    <option value="all">All Vehicles</option>
                                    <option value="available">Available Only</option>
                                    <option value="popular">Popular</option>
                                </select>
                                <button 
                                    onClick={handleViewAllVehicles}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white border-none px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        
                        {vehiclesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                        ) : vehiclesError ? (
                            <div className="text-center py-8 text-red-600">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                <p>Failed to load vehicles</p>
                            </div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No vehicles found</p>
                                <button 
                                    onClick={handleAddVehicle}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white mt-4"
                                >
                                    Add New Vehicle
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {filteredVehicles.map((vehicle, index) => (
                                    <div 
                                        key={vehicle.vehicle_id || index}
                                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200 border border-gray-100 cursor-pointer group"
                                        onClick={() => handleVehicleClick(vehicle.vehicle_id)}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                vehicle.availability ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-100 group-hover:bg-red-200'
                                            }`}>
                                                <Car className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                    vehicle.availability ? 'text-green-600' : 'text-red-600'
                                                }`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-blue-600">
                                                    {vehicle.manufacturer} {vehicle.model}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-gray-500 text-xs sm:text-sm">
                                                        {vehicle.category} • {formatCurrency(vehicle.price)}/day
                                                    </p>
                                                    {vehicleFilter === 'popular' && 'bookings_count' in vehicle && (
                                                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                            <Star className="w-3 h-3" />
                                                            {String(vehicle.bookings_count)} bookings
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 ml-2 sm:ml-4" onClick={(e) => e.stopPropagation()}>
                                            {vehicle.availability ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                    Booked
                                                </span>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Analytics Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4">
                            {[
                                { 
                                    icon: Plus, 
                                    label: "Add Vehicle", 
                                    color: "bg-blue-600 hover:bg-blue-700",
                                    action: handleAddVehicle 
                                },
                                { 
                                    icon: ShoppingCart, 
                                    label: "New Booking", 
                                    color: "bg-green-600 hover:bg-green-700",
                                    action: handleNewBooking 
                                },
                                { 
                                    icon: FileText, 
                                    label: "View Reports", 
                                    color: "bg-purple-600 hover:bg-purple-700",
                                    action: handleViewReports 
                                },
                                { 
                                    icon: Settings, 
                                    label: "Settings", 
                                    color: "bg-gray-600 hover:bg-gray-700",
                                    action: handleSettings 
                                }
                            ].map((action, index) => {
                                const IconComponent = action.icon;
                                return (
                                    <button 
                                        key={index}
                                        onClick={action.action}
                                        className={`btn ${action.color} text-white border-none flex items-center justify-start p-3 sm:p-4 rounded-lg sm:rounded-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base group`}
                                    >
                                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold truncate">{action.label}</span>
                                        <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-lg font-bold">Performance Metrics</h3>
                            <BarChart3 className="w-5 h-5 opacity-80" />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100 text-sm sm:text-base">Fleet Utilization</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm sm:text-base">{utilizationRate}%</span>
                                    <div className="w-16 bg-blue-800 rounded-full h-2">
                                        <div 
                                            className="bg-white h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${utilizationRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100 text-sm sm:text-base">Active Bookings</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm sm:text-base">{activeBookings}</span>
                                    <TrendingUp className="w-4 h-4 text-green-300" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-100 text-sm sm:text-base">Completion Rate</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm sm:text-base">{completionRate}%</span>
                                    <div className="w-16 bg-blue-800 rounded-full h-2">
                                        <div 
                                            className="bg-green-400 h-2 rounded-full"
                                            style={{ width: `${completionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Trend */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                            <button 
                                onClick={() => setShowRevenueChart(true)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                        {analyticsLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            </div>
                        ) : revenueTrend.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                <p>No revenue data available</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 sm:space-y-3">
                                    {revenueTrend.slice(0, 3).map((month, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className="text-gray-600 text-xs sm:text-sm">{month.month}</span>
                                            <span className="font-bold text-green-600 text-sm sm:text-base">
                                                {formatCurrency(month.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2 sm:pt-3 border-t border-gray-200 mt-2">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-gray-500">Total Revenue</span>
                                        <span className="font-bold text-blue-600">
                                            {formatCurrency(totalRevenue)}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex items-center gap-1">
                                            {revenueTrend.slice(0, 6).map((month, index) => {
                                                const maxRevenue = Math.max(...revenueTrend.map(m => m.revenue))
                                                const height = (month.revenue / maxRevenue) * 30
                                                return (
                                                    <div 
                                                        key={index}
                                                        className="flex-1 bg-gradient-to-t from-green-300 to-green-500 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                                                        style={{ height: `${height}px` }}
                                                        title={`${month.month}: ${formatCurrency(month.revenue)}`}
                                                    ></div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Add New Vehicle</h3>
                                <button 
                                    onClick={() => setShowAddVehicleModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitNewVehicle}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Manufacturer
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={newVehicleData.manufacturer}
                                            onChange={(e) => setNewVehicleData({
                                                ...newVehicleData,
                                                manufacturer: e.target.value
                                            })}
                                            placeholder="e.g., Toyota"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={newVehicleData.model}
                                            onChange={(e) => setNewVehicleData({
                                                ...newVehicleData,
                                                model: e.target.value
                                            })}
                                            placeholder="e.g., Camry"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Year
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={newVehicleData.year}
                                                onChange={(e) => setNewVehicleData({
                                                    ...newVehicleData,
                                                    year: parseInt(e.target.value)
                                                })}
                                                min="2000"
                                                max="2024"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price per Day ($)
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={newVehicleData.price}
                                                onChange={(e) => setNewVehicleData({
                                                    ...newVehicleData,
                                                    price: parseFloat(e.target.value)
                                                })}
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle Type
                                        </label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={newVehicleData.category}
                                            onChange={(e) => setNewVehicleData({
                                                ...newVehicleData,
                                                category: e.target.value
                                            })}
                                        >
                                            <option value="suv">SUV</option>
                                            <option value="sedan">Sedan</option>
                                            <option value="truck">Truck</option>
                                            <option value="van">Van</option>
                                            <option value="sports">Sports</option>
                                            <option value="luxury">Luxury</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddVehicleModal(false)}
                                            className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                        >
                                            Add Vehicle
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* New Booking Modal */}
            {showNewBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Create New Booking</h3>
                                <button 
                                    onClick={() => setShowNewBookingModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitNewBooking}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            User ID
                                        </label>
                                        <select
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={newBookingData.user_id}
                                            onChange={(e) => setNewBookingData({
                                                ...newBookingData,
                                                user_id: e.target.value
                                            })}
                                        >
                                            <option value="">Select User</option>
                                            {usersData?.map(user => (
                                                <option key={user.user_id} value={user.user_id}>
                                                    {user.first_name} {user.last_name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle
                                        </label>
                                        <select
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={newBookingData.vehicle_id}
                                            onChange={(e) => setNewBookingData({
                                                ...newBookingData,
                                                vehicle_id: e.target.value
                                            })}
                                        >
                                            <option value="">Select Vehicle</option>
                                            {vehiclesData?.filter(v => v.availability).map(vehicle => (
                                                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                                    {vehicle.manufacturer} {vehicle.model} - ${vehicle.price}/day
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={newBookingData.booking_date}
                                                onChange={(e) => setNewBookingData({
                                                    ...newBookingData,
                                                   booking_date: e.target.value
                                                })}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={newBookingData.return_date}
                                                onChange={(e) => setNewBookingData({
                                                    ...newBookingData,
                                                   return_date: e.target.value
                                                })}
                                                min={newBookingData.booking_date}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewBookingModal(false)}
                                            className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                            Create Booking
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminDashboardLayout>
    )
}

export default AdminDashboard