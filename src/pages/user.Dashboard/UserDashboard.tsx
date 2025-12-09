import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { 
  User,
  CreditCard,
  Calendar,
  Car,
  Bell, // Kept for future use
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  HelpCircle,
  ChevronRight,
  Activity,
  Award,
  Star,
  DollarSign,
  RefreshCw,
  Loader2
} from 'lucide-react'
import DashboardLayout from '../../Dashboard.designs/DashboardLayout'
import type { RootState } from '../../store/store'
import { format, differenceInDays, isFuture, parseISO } from 'date-fns'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetUserBookingsQuery } from '../../features/api/BookingsApi'
import { useGetPaymentsByUserIdQuery } from '../../features/api/PaymentApi'
import type { Booking, Payment } from '../../types/Types'

const UserDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.authSlice) as {
    isAuthenticated: boolean;
    user: any;
  }

  // State for UI
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // State for Derived Data
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalPayments: 0,
    totalSpent: 0,
    upcomingBookingsCount: 0,
    pendingPayments: 0,
    loyaltyPoints: 0
  })

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number | string;
    type: 'payment' | 'booking';
    description: string;
    time: string;
    status: string;
    rawDate: string; // for sorting
  }>>([])

  const [upcomingBookingsList, setUpcomingBookingsList] = useState<Booking[]>([])

  // --- API QUERIES ---

  // Fetch Bookings
  const { 
    data: bookingsData, 
    isLoading: isLoadingBookings, 
    isError: isBookingsError,
    refetch: refetchBookings 
  } = useGetUserBookingsQuery(
    isAuthenticated && user ? { user_id: user.user_id } : skipToken,
    { pollingInterval: 60000 } // Poll every minute
  )

  // Fetch Payments
  const { 
    data: paymentsData, 
    isLoading: isLoadingPayments, 
    isError: isPaymentsError,
    refetch: refetchPayments 
  } = useGetPaymentsByUserIdQuery(
    isAuthenticated && user ? { user_id: user.user_id } : skipToken,
    { pollingInterval: 60000 }
  )

  // --- DATA PROCESSING HELPERS ---

  // Helper to safely extract array from API response
  const extractArray = <T,>(data: any): T[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.results && Array.isArray(data.results)) return data.results
    return []
  }

  // Helper to calculate time ago (simple version)
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHrs = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffHrs < 1) return 'Just now'
      if (diffHrs < 24) return `${diffHrs} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      return format(date, 'MMM dd')
    } catch (e) {
      return 'Unknown date'
    }
  }

  // --- EFFECT: PROCESS DATA ---
  useEffect(() => {
    if ((bookingsData || []) && (paymentsData || [])) {
      const bookings = extractArray<Booking>(bookingsData)
      const payments = extractArray<Payment>(paymentsData)

      // 1. Calculate Stats
      const totalBookings = bookings.length
      const totalPayments = payments.length
      
      // Calculate total spent (sum of completed payments)
      const totalSpent = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      // Calculate Loyalty Points (Example logic: 1 point per 100 spent + 10 per booking)
      const points = Math.floor(totalSpent / 100) + (totalBookings * 10)

      // Count pending payments
      const pendingPayments = payments.filter(p => p.status === 'pending').length

      // 2. Identify Upcoming Bookings
      const upcoming = bookings
        .filter(b => b.booking_date && isFuture(parseISO(b.booking_date)) && b.booking_status !== 'cancelled')
        .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
        .slice(0, 3)

      setUpcomingBookingsList(upcoming)

      // 3. Generate Recent Activity Feed
      const activities = [
        ...bookings.map(b => ({
          id: `b-${b.booking_id}`,
          type: 'booking' as const,
          description: `Booking for ${b.manufacturer || ''} ${b.model || 'Vehicle'}`,
          time: getTimeAgo(b.created_at || b.booking_date),
          rawDate: b.created_at || b.booking_date,
          status: b.booking_status || 'pending'
        })),
        ...payments.map(p => ({
          id: `p-${p.payment_id}`,
          type: 'payment' as const,
          description: `${p.payment_method} payment of ${p.currency} ${p.amount}`,
          time: getTimeAgo(p.created_at),
          rawDate: p.created_at,
          status: p.status
        }))
      ]

      // Sort by newest first and take top 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
        .slice(0, 5)

      setRecentActivity(sortedActivities)

      // Update Stats State
      setStats({
        totalBookings,
        totalPayments,
        totalSpent,
        upcomingBookingsCount: upcoming.length,
        pendingPayments,
        loyaltyPoints: points
      })
    }
  }, [bookingsData, paymentsData])

  // --- HANDLERS ---

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchBookings(), refetchPayments()])
    } catch (error) {
      console.error("Refresh failed", error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  const handleNavigation = (page: string) => {
    navigate(`/user/${page}`) // Ensure your routes match this structure
  }

  const handleLogout = () => {
    // Dispatch logout action here if utilizing redux auth actions
    navigate('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // --- RENDER STATES ---

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 w-full"
            >
              Go to Login
            </button>
        </div>
      </div>
    )
  }

  if (isLoadingBookings || isLoadingPayments) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (isBookingsError || isPaymentsError) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center m-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">We couldn't fetch your latest data.</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user.first_name}!
              </h1>
              <p className="text-gray-600 mt-2">Welcome to your personal dashboard</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/help')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-blue-100">{user.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded">
                      <Shield className="w-3 h-3" />
                      Verified
                    </span>
                    <span className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded">
                      <Star className="w-3 h-3" />
                      {stats.totalBookings > 10 ? 'Gold' : stats.totalBookings > 5 ? 'Silver' : 'Bronze'} Member
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-200 mb-1">Loyalty Points</div>
                <div className="text-3xl font-bold">{stats.loyaltyPoints}</div>
                <div className="text-xs text-blue-200 mt-1">Based on spending history</div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleNavigation('bookings')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-600 mt-3">
                <ChevronRight className="w-4 h-4" />
                View all bookings
              </div>
            </div>

            <div 
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleNavigation('payments')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPayments}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-3">
                <ChevronRight className="w-4 h-4" />
                View payment history
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-purple-600 mt-3">
                <TrendingUp className="w-4 h-4" />
                Lifetime spending
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingBookingsCount}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Car className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-yellow-600 mt-3">
                <Clock className="w-4 h-4" />
                Next 7 days
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </h3>
                  <span className="text-xs text-gray-400">Last 5 actions</span>
                </div>
                <div className="p-6">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 rounded-full bg-gray-50 mb-3">
                         <Activity className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No recent activity found</p>
                      <p className="text-sm text-gray-400">Book a car to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                          <div className={`p-2 rounded-lg mt-1 ${
                            activity.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {activity.type === 'payment' ? (
                              <CreditCard className="w-4 h-4 text-green-600" />
                            ) : (
                              <Calendar className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.description}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            activity.status === 'completed' || activity.status === 'confirmed' || activity.status === 'active' 
                              ? 'bg-green-100 text-green-800' :
                            activity.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {recentActivity.length > 0 && (
                    <button
                      onClick={() => handleNavigation('activity')}
                      className="w-full mt-6 py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm border-t border-gray-100 pt-4"
                    >
                      View All Activity
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/book-vehicle')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Car className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Book a Vehicle</p>
                        <p className="text-sm text-gray-500">Start a new reservation</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigation('payments')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Make Payment</p>
                        <p className="text-sm text-gray-500">Pay for bookings</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigation('profile')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Update Profile</p>
                        <p className="text-sm text-gray-500">Edit account details</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/help')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                        <HelpCircle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Get Help</p>
                        <p className="text-sm text-gray-500">Contact support</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Upcoming & Profile Summary */}
            <div className="space-y-8">
              
              {/* Upcoming Bookings List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Trips
                  </h3>
                </div>
                <div className="p-6">
                  {upcomingBookingsList.length === 0 ? (
                    <div className="text-center py-6">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming trips</p>
                      <button
                        onClick={() => navigate('/book-vehicle')}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Book a vehicle now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookingsList.map((booking) => (
                        <div key={booking.booking_id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-gray-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 truncate pr-2">
                              {booking.manufacturer} {booking.model}
                            </h4>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {booking.booking_status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {differenceInDays(new Date(booking.return_date), new Date(booking.booking_date))} days duration
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/user/bookings`)} // Or specific detail page
                            className="mt-3 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded bg-white"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile/Account Summary */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Summary
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-medium">
                        {user.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-medium">{stats.totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending Payments</span>
                      <span className={`font-medium ${stats.pendingPayments > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.pendingPayments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account Status</span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Stats / Gamification */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                   <Award className="w-5 h-5" /> 
                   Your Progress
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Loyalty Tier</span>
                    <span className="font-bold">
                       {stats.totalBookings > 10 ? 'Gold' : stats.totalBookings > 5 ? 'Silver' : 'Bronze'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Points Earned</span>
                    <span className="font-bold">{stats.loyaltyPoints}</span>
                  </div>
                  <div className="w-full bg-blue-700/50 rounded-full h-2 mt-2">
                    <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((stats.loyaltyPoints % 1000) / 10, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                     Next reward at {Math.ceil((stats.loyaltyPoints + 1) / 1000) * 1000} points
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}

export default UserDashboard