import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  Car,
  MapPin,
  User,
  CreditCard,
  Phone,
  Wallet,
  XCircle as CloseIcon,
  RefreshCw
} from 'lucide-react'
import { BookingApi } from '../../features/api/BookingsApi'
import { usersApi } from '../../features/api/UserAPi' // Add this import
import { 
  useGetAllPaymentsQuery,
  useProcessMpesaPaymentMutation,
  useCreateNewPaymentMutation,
  useGetPaymentsByBookingIdQuery
} from '../../features/api/PaymentApi'
import type { Booking, Payment, User as UserType } from '../../types/Types' // Update import
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'
import { skipToken } from '@reduxjs/toolkit/query'
import DashboardLayout from '../../Dashboard.designs/DashboardLayout'

const UserBookingsPage: React.FC = () => {
  const { isAuthenticated, user: currentUser } = useSelector((state: RootState) => state.authSlice) as { isAuthenticated: boolean; user: any };

  // Fetch user bookings
  const { data: apiResponse, isLoading, error, refetch: refetchBookings } = BookingApi.useGetUserBookingsQuery(
    isAuthenticated && currentUser ? { user_id: currentUser.user_id } : skipToken
  );
  
  // Fetch all users for enrichment
  const { data: usersData } = usersApi.useGetAllUsersQuery();
  
  // Fetch all payments for the user
  const { data: allPaymentsData, refetch: refetchPayments } = useGetAllPaymentsQuery(
    isAuthenticated ? undefined : skipToken,
    {
      pollingInterval: 30000, // Auto-refresh every 30 seconds for pending payments
    }
  );
  
  // Payment mutations
  const [processMpesaPayment, { isLoading: isProcessingMpesa }] = useProcessMpesaPaymentMutation()
  const [createNewPayment, { isLoading: isCreatingPayment }] = useCreateNewPaymentMutation()

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [usersMap, setUsersMap] = useState<Map<number, UserType>>(new Map()) // Add users map

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    phone_number: '',
    payment_method: 'mpesa' as 'mpesa' | 'card' | 'cash',
    amount: 0
  })

  // Combine loading states
  const isProcessingPayment = isProcessingMpesa || isCreatingPayment;

  // 1. Process users data into a map
  useEffect(() => {
    if (usersData) {
      const newUsersMap = new Map<number, UserType>();
      usersData.forEach(user => {
        if (user.user_id) {
          newUsersMap.set(user.user_id, user);
        }
      });
      setUsersMap(newUsersMap);
    }
  }, [usersData]);

  // Helper function to extract payments array from API response
  const extractPaymentsArray = (paymentsData: any): Payment[] => {
    if (!paymentsData) return [];
    
    // If it's already an array, return it
    if (Array.isArray(paymentsData)) {
      return paymentsData;
    }
    
    // If it's an object with a data property that's an array
    if (paymentsData && typeof paymentsData === 'object') {
      if (Array.isArray(paymentsData.data)) {
        return paymentsData.data;
      }
      if (Array.isArray(paymentsData.payments)) {
        return paymentsData.payments;
      }
      if (Array.isArray(paymentsData.results)) {
        return paymentsData.results;
      }
    }
    
    // If we can't find an array, log warning and return empty array
    console.warn('Unexpected payments data structure:', paymentsData);
    return [];
  };

  // Function to get payments for a specific booking
  const getPaymentsForBooking = (bookingId: number): Payment[] => {
    const paymentsArray = extractPaymentsArray(allPaymentsData);
    
    if (!paymentsArray || paymentsArray.length === 0) return [];
    
    // Filter payments by booking_id
    return paymentsArray.filter(payment => 
      payment.booking_id === bookingId
    );
  };

  // Extract bookings from API response and combine with payments and user data
  useEffect(() => {
    if (apiResponse) {
      let bookingsArray: any[] = [];
      
      // Extract bookings array from API response
      if (Array.isArray(apiResponse)) {
        bookingsArray = apiResponse;
      } else if (apiResponse && typeof apiResponse === 'object') {
        if (Array.isArray((apiResponse as any).data)) {
          bookingsArray = (apiResponse as any).data;
        } else if (Array.isArray((apiResponse as any).bookings)) {
          bookingsArray = (apiResponse as any).bookings;
        } else if (Array.isArray((apiResponse as any).results)) {
          bookingsArray = (apiResponse as any).results;
        } else {
          console.warn('Unexpected API response structure:', apiResponse);
          bookingsArray = [];
        }
      } else {
        bookingsArray = [];
      }

      // Enhance bookings with user information and payments data
      const enrichedBookings: Booking[] = bookingsArray.map((booking: any) => {
        // Try to get user information from various sources
        let userInfo: UserType;
        
        // Option 1: Check if booking has user object directly
        if (booking.user && typeof booking.user === 'object') {
          userInfo = {
            user_id: booking.user.user_id || booking.user_id || 0,
            first_name: booking.user.first_name || currentUser?.first_name || 'Unknown',
            last_name: booking.user.last_name || currentUser?.last_name || 'User',
            email: booking.user.email || currentUser?.email || 'No email',
            contact_phone: booking.user.contact_phone || booking.user.phone || currentUser?.phone || currentUser?.contact_phone || '',
            role: booking.user.role || currentUser?.role || 'user',
            created_at: booking.user.created_at || new Date().toISOString(),
            updated_at: booking.user.updated_at || new Date().toISOString()
          };
        }
        // Option 2: Check usersMap using user_id from booking
        else if (booking.user_id && usersMap.has(booking.user_id)) {
          userInfo = usersMap.get(booking.user_id)!;
        }
        // Option 3: Use current logged in user info (since this is user bookings page)
        else if (currentUser && booking.user_id === currentUser.user_id) {
          userInfo = {
            user_id: currentUser.user_id || 0,
            first_name: currentUser.first_name || 'Unknown',
            last_name: currentUser.last_name || 'User',
            email: currentUser.email || 'No email',
            contact_phone: currentUser.phone || currentUser.contact_phone || '',
            role: currentUser.role || 'user',
            created_at: currentUser.created_at || new Date().toISOString(),
            updated_at: currentUser.updated_at || new Date().toISOString()
          };
        }
        // Option 4: Create placeholder (last resort)
        else {
          userInfo = {
            user_id: booking.user_id || 0,
            first_name: 'Unknown',
            last_name: 'User',
            email: 'N/A',
            contact_phone: '',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Get payments for this booking
        const bookingPayments = getPaymentsForBooking(booking.booking_id);
        
        // Sort payments by date (newest first)
        const sortedPayments = [...bookingPayments].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        // Create enriched booking object
        const enrichedBooking: Booking = {
          ...booking,
          user_id: userInfo.user_id,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          email: userInfo.email,
          phone: userInfo.contact_phone,
          booking_status: booking.booking_status || 'pending',
          manufacturer: booking.manufacturer || 'Unknown',
          model: booking.model || 'Vehicle',
          model_year: booking.model_year || 0,
          category: booking.category || 'Unknown',
          transmission: booking.transmission || 'Unknown',
          fuel_type: booking.fuel_type || 'Unknown',
          seating_capacity: booking.seating_capacity || 0,
          rental_rate: booking.rental_rate || 0,
          total_amount: booking.total_amount || 0,
          payments: sortedPayments.length > 0 ? sortedPayments : (booking.payments || []),
          // Store the full user object if needed
          user: userInfo
        };

        return enrichedBooking;
      });

      setBookings(enrichedBookings);
    } else {
      setBookings([]);
    }
  }, [apiResponse, allPaymentsData, usersMap, currentUser])

  // Initialize payment form when booking is selected
  useEffect(() => {
    if (selectedBooking) {
      const totalAmount = calculateTotalAmount(selectedBooking);
      setPaymentForm({
        phone_number: selectedBooking.phone || currentUser?.phone || currentUser?.contact_phone || '',
        payment_method: 'mpesa',
        amount: totalAmount
      })
    }
  }, [selectedBooking, currentUser])

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailsModalOpen(true)
  }

  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsPaymentModalOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBookings(),
        refetchPayments()
      ]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !selectedBooking.booking_id) return

    try {
      const result = await processMpesaPayment({
        phone_number: paymentForm.phone_number.replace(/^0/, '254'), // Convert to international format
        amount: paymentForm.amount,
        booking_id: selectedBooking.booking_id
      }).unwrap()
      
      setIsPaymentModalOpen(false)
      setSelectedBooking(null)
      
      // Show success message
      alert(result.message || 'Payment initiated successfully! Please check your phone to complete the payment.')
      
      // Refresh data after a short delay
      setTimeout(() => {
        handleRefresh();
      }, 2000);
      
    } catch (error: any) {
      console.error('Failed to process payment:', error)
      
      // Show specific error message
      const errorMessage = error?.data?.message || 
                          error?.error || 
                          'Payment failed. Please try again.'
      alert(`Payment Error: ${errorMessage}`)
    }
  }

  const handleOtherPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !selectedBooking.booking_id) return

    try {
      const result = await createNewPayment({
        booking_id: selectedBooking.booking_id,
        amount: paymentForm.amount,
        currency: 'KES',
        payment_method: paymentForm.payment_method,
        payment_status: 'pending',
        transaction_reference: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        phone_number: paymentForm.payment_method === 'mpesa' ? paymentForm.phone_number : undefined
      }).unwrap()
      
      setIsPaymentModalOpen(false)
      setSelectedBooking(null)
      
      alert(result.message || 'Payment recorded successfully! Our team will contact you to complete the payment.')
      
      // Refresh data
      handleRefresh();
      
    } catch (error: any) {
      console.error('Failed to create payment:', error)
      
      const errorMessage = error?.data?.message || 
                          error?.error || 
                          'Payment recording failed. Please try again.'
      alert(`Payment Error: ${errorMessage}`)
    }
  }

  const handlePayment = (e: React.FormEvent) => {
    if (paymentForm.payment_method === 'mpesa') {
      return handleMpesaPayment(e)
    } else {
      return handleOtherPayment(e)
    }
  }

  const getStatusColor = (status: Booking['booking_status'] | null) => {
    const actualStatus = status || 'pending'
    switch (actualStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Booking['booking_status'] | null) => {
    const actualStatus = status || 'pending'
    switch (actualStatus) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatStatusText = (status: Booking['booking_status'] | null) => {
    const actualStatus = status || 'pending'
    return actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1
  }

  const calculateTotalAmount = (booking: Booking) => {
    if (booking.total_amount) return booking.total_amount
    
    const days = calculateTotalDays(booking.booking_date, booking.return_date)
    const dailyRate = booking.rental_rate || 0
    return days * dailyRate
  }

  const getPaymentDetails = (booking: Booking) => {
    const payments = booking.payments || []
    
    if (payments.length === 0) {
      return { 
        status: 'unpaid', 
        payment: null, 
        message: 'No payment made',
        icon: <AlertCircle className="w-3 h-3" />
      }
    }
    
    // Get the latest payment
    const latestPayment = payments[0];
    
    switch (latestPayment.payment_status) {
      case 'completed':
        return { 
          status: 'paid', 
          payment: latestPayment, 
          message: `Paid with ${latestPayment.payment_method}`,
          icon: <CheckCircle className="w-3 h-3" />
        }
      case 'pending':
        return { 
          status: 'processing', 
          payment: latestPayment, 
          message: `Payment processing via ${latestPayment.payment_method}`,
          icon: <Clock className="w-3 h-3" />
        }
      case 'failed':
        return { 
          status: 'failed', 
          payment: latestPayment, 
          message: `Payment failed via ${latestPayment.payment_method}`,
          icon: <XCircle className="w-3 h-3" />
        }
      default:
        return { 
          status: 'unknown', 
          payment: latestPayment, 
          message: 'Payment status unknown',
          icon: <AlertCircle className="w-3 h-3" />
        }
    }
  }

  // Check if booking has pending payments that need auto-refresh
  const hasPendingPayments = bookings.some(booking => {
    const paymentInfo = getPaymentDetails(booking);
    return paymentInfo.status === 'processing';
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Failed to load your bookings
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">
              View and manage your vehicle bookings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasPendingPayments && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <Clock className="w-4 h-4" />
                <span>Processing payments...</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-xl font-semibold text-gray-500 mb-2">No bookings found</div>
              <p className="text-gray-400">
                You haven't made any bookings yet.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const totalDays = calculateTotalDays(booking.booking_date, booking.return_date)
              const totalAmount = calculateTotalAmount(booking)
              const paymentInfo = getPaymentDetails(booking)

              return (
                <div key={booking.booking_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Vehicle Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    {booking.vehicle_image ? (
                      <img 
                        src={booking.vehicle_image} 
                        alt={booking.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                      booking.booking_status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : booking.booking_status === 'cancelled'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {formatStatusText(booking.booking_status)}
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-black bg-opacity-50 text-white">
                      {booking.category || 'Vehicle'}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{booking.manufacturer} {booking.model}</h3>
                        <p className="text-gray-500 text-sm">{booking.model_year} • {booking.transmission}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                        <div className="text-sm text-gray-500">{totalDays} days</div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {formatDate(booking.booking_date)} - {formatDate(booking.return_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{booking.location || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        paymentInfo.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : paymentInfo.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : paymentInfo.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {paymentInfo.icon}
                        {paymentInfo.status === 'paid' ? 'Paid' : 
                         paymentInfo.status === 'processing' ? 'Processing' : 
                         paymentInfo.status === 'failed' ? 'Failed' : 'Payment Required'}
                      </div>
                      {paymentInfo.payment && (
                        <div className="text-xs text-gray-500 mt-1">
                          {paymentInfo.payment.payment_method?.toUpperCase()} • 
                          {paymentInfo.payment.created_at ? formatDateTime(paymentInfo.payment.created_at) : ''}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openDetailsModal(booking)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                      {paymentInfo.status === 'unpaid' && booking.booking_status !== 'cancelled' && (
                        <button 
                          onClick={() => openPaymentModal(booking)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Pay
                        </button>
                      )}
                      {paymentInfo.status === 'failed' && booking.booking_status !== 'cancelled' && (
                        <button 
                          onClick={() => openPaymentModal(booking)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Retry Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Booking Details Modal */}
        {isDetailsModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Vehicle Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </h4>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {selectedBooking.vehicle_image ? (
                      <img 
                        src={selectedBooking.vehicle_image} 
                        alt={selectedBooking.model}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {selectedBooking.manufacturer} {selectedBooking.model}
                      </div>
                      <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 gap-2">
                        <div>Year: {selectedBooking.model_year || 'N/A'}</div>
                        <div>Category: {selectedBooking.category || 'N/A'}</div>
                        <div>Transmission: {selectedBooking.transmission || 'N/A'}</div>
                        <div>Fuel: {selectedBooking.fuel_type || 'N/A'}</div>
                        <div>Seats: {selectedBooking.seating_capacity || 'N/A'}</div>
                        <div>Color: {selectedBooking.color || 'N/A'}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <MapPin className="w-4 h-4" />
                        {selectedBooking.location || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information (User's own info) */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Your Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedBooking.first_name} {selectedBooking.last_name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedBooking.email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedBooking.phone || currentUser?.phone || currentUser?.contact_phone || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedBooking.booking_id || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Booking Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {formatDateTime(selectedBooking.booking_date)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {formatDateTime(selectedBooking.return_date)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {calculateTotalDays(selectedBooking.booking_date, selectedBooking.return_date)} days
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {formatCurrency(selectedBooking.rental_rate || 0)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="p-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.booking_status)}`}>
                          {getStatusIcon(selectedBooking.booking_status)}
                          {formatStatusText(selectedBooking.booking_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-green-800 font-semibold text-lg">
                        {formatCurrency(calculateTotalAmount(selectedBooking))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <div className="p-3">
                        {(() => {
                          const paymentInfo = getPaymentDetails(selectedBooking)
                          return (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              paymentInfo.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : paymentInfo.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : paymentInfo.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {paymentInfo.icon}
                              {paymentInfo.status === 'paid' ? 'Paid' : 
                               paymentInfo.status === 'processing' ? 'Processing' : 
                               paymentInfo.status === 'failed' ? 'Failed' : 'Payment Required'}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment History */}
                  {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment History</label>
                      <div className="space-y-2">
                        {selectedBooking.payments.map((payment) => (
                          <div key={payment.payment_id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {payment.payment_method?.toUpperCase()} - {formatCurrency(payment.amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDateTime(payment.created_at || '')}
                              </div>
                              {payment.transaction_reference && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Ref: {payment.transaction_reference}
                                </div>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              payment.payment_status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : payment.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.payment_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                {getPaymentDetails(selectedBooking).status === 'unpaid' && selectedBooking.booking_status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      openPaymentModal(selectedBooking)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Make Payment
                  </button>
                )}
                {getPaymentDetails(selectedBooking).status === 'failed' && selectedBooking.booking_status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      openPaymentModal(selectedBooking)
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {isPaymentModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Make Payment</h3>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handlePayment}>
                <div className="space-y-4">
                  {/* Booking Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Booking Summary</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>{selectedBooking.manufacturer} {selectedBooking.model}</div>
                      <div>{formatDate(selectedBooking.booking_date)} - {formatDate(selectedBooking.return_date)}</div>
                      <div className="font-semibold">Total: {formatCurrency(calculateTotalAmount(selectedBooking))}</div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentForm({...paymentForm, payment_method: 'mpesa'})}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          paymentForm.payment_method === 'mpesa' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Phone className="w-6 h-6 text-green-600" />
                        <span className="text-xs font-medium">M-Pesa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentForm({...paymentForm, payment_method: 'card'})}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          paymentForm.payment_method === 'card' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        <span className="text-xs font-medium">Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentForm({...paymentForm, payment_method: 'cash'})}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          paymentForm.payment_method === 'cash' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Wallet className="w-6 h-6 text-gray-600" />
                        <span className="text-xs font-medium">Cash</span>
                      </button>
                    </div>
                  </div>

                  {/* Phone Number for M-Pesa */}
                  {paymentForm.payment_method === 'mpesa' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="07XXXXXXXX"
                        value={paymentForm.phone_number}
                        onChange={(e) => setPaymentForm({...paymentForm, phone_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your M-Pesa registered phone number (e.g., 0712345678)
                      </p>
                    </div>
                  )}

                  {/* Amount Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-lg font-semibold text-gray-900">
                      {formatCurrency(paymentForm.amount)}
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {paymentForm.payment_method === 'mpesa' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 text-sm mb-2">M-Pesa Payment Instructions</h4>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        <li>1. Ensure you have sufficient funds in your M-Pesa account</li>
                        <li>2. You will receive a prompt on your phone</li>
                        <li>3. Enter your M-Pesa PIN to complete the payment</li>
                        <li>4. Wait for confirmation message</li>
                      </ul>
                    </div>
                  )}

                  {paymentForm.payment_method === 'card' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 text-sm mb-2">Card Payment</h4>
                      <p className="text-xs text-blue-800">
                        Our team will contact you to process the card payment. Please ensure you have your card details ready.
                      </p>
                    </div>
                  )}

                  {paymentForm.payment_method === 'cash' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 text-sm mb-2">Cash Payment</h4>
                      <p className="text-xs text-green-800">
                        Please visit our office to complete the cash payment. Bring this booking reference: #{selectedBooking.booking_id}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    disabled={isProcessingPayment}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className={`flex-1 ${
                      paymentForm.payment_method === 'mpesa' 
                        ? 'bg-green-600 hover:bg-green-700'
                        : paymentForm.payment_method === 'cash'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : paymentForm.payment_method === 'mpesa' ? (
                      'Pay with M-Pesa'
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default UserBookingsPage