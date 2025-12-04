import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Search, 
  MoreVertical, 
  Edit, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  Loader2
} from 'lucide-react'
import { BookingApi } from '../../features/api/BookingsApi'
import type { Booking } from '../../types/Types'
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout'
import { format, parseISO } from 'date-fns'

const AdminBookingsPage: React.FC = () => {
  const { data: apiResponse, isLoading, error, refetch } = BookingApi.useGetAllBookingsQuery()
  const [updateBookingStatus, { isLoading: isUpdatingStatus }] = BookingApi.useUpdateBookingStatusMutation()
  const [cancelBooking, { isLoading: isCancelling }] = BookingApi.useCancelBookingMutation()
 

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['booking_status']>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  // Status update form
  const [statusForm, setStatusForm] = useState({
    booking_status: 'pending' as Booking['booking_status']
  })

  // Extract bookings from API response
  useEffect(() => {
    if (apiResponse) {
      let bookingsArray: Booking[] = [];
      
      if (Array.isArray(apiResponse)) {
        bookingsArray = apiResponse;
      } else if (apiResponse && typeof apiResponse === 'object') {
        if (Array.isArray((apiResponse as any).data)) {
          bookingsArray = (apiResponse as any).data;
        } else if (Array.isArray((apiResponse as any).bookings)) {
          bookingsArray = (apiResponse as any).bookings;
        } else {
          console.warn('Unexpected API response structure:', apiResponse);
          bookingsArray = [];
        }
      } else {
        bookingsArray = [];
      }

      // Ensure all bookings have required fields with defaults
      bookingsArray = bookingsArray.map(booking => ({
        ...booking,
        booking_status: booking.booking_status || 'pending',
        first_name: booking.first_name || 'Unknown',
        last_name: booking.last_name || 'User',
        email: booking.email || 'No email',
        manufacturer: booking.manufacturer || 'Unknown',
        model: booking.model || 'Vehicle',
        model_year: booking.model_year || 0,
        category: booking.category || 'Unknown',
        transmission: booking.transmission || 'Unknown',
        fuel_type: booking.fuel_type || 'Unknown',
        seating_capacity: booking.seating_capacity || 0,
        rental_rate: booking.rental_rate || 0,
        total_amount: booking.total_amount || 0,
        payments: booking.payments || []
      }));

      setBookings(bookingsArray);
    } else {
      setBookings([]);
    }
  }, [apiResponse])

  // Initialize status form when booking is selected
  useEffect(() => {
    if (selectedBooking) {
      setStatusForm({
        booking_status: selectedBooking.booking_status || 'pending'
      })
    }
  }, [selectedBooking])

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const userName = `${booking.first_name} ${booking.last_name}`
    const userEmail = booking.email || 'No email'
    const vehicleModel = booking.model
    const vehicleManufacturer = booking.manufacturer
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicleManufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.booking_id?.toString().includes(searchTerm) || false)
    
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking || !selectedBooking.booking_id) return

    try {
      console.log('Updating status for booking:', selectedBooking.booking_id, 'to:', statusForm.booking_status)
      
      // Update booking status with correct API parameters
      await updateBookingStatus({
        booking_id: selectedBooking.booking_id,
        booking_status: statusForm.booking_status
      }).unwrap()
      
      console.log('Status updated successfully')
      
      // Update local state immediately for better UX
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.booking_id === selectedBooking.booking_id
            ? { ...booking, booking_status: statusForm.booking_status }
            : booking
        )
      )
      
      setIsStatusModalOpen(false)
      setSelectedBooking(null)
      
     
      // Refetch to ensure data is in sync
      // refetch()
      
    } catch (error: any) {
      console.error('Failed to update booking status:', error)
      
      // Try alternative approach if first fails
      // Retry with same format if first fails
    }}

  const handleCancelBooking = async () => {
    if (!bookingToCancel || !bookingToCancel.booking_id) return
    
    try {
      console.log('Cancelling booking:', bookingToCancel.booking_id)
      
      await cancelBooking({ 
        booking_id: bookingToCancel.booking_id 
      }).unwrap()
      
      console.log('Booking cancelled successfully')
      
      // Update local state immediately
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.booking_id === bookingToCancel.booking_id
            ? { ...booking, booking_status: 'cancelled' }
            : booking
        )
      )
      
      setIsCancelModalOpen(false)
      setBookingToCancel(null)
      
     
      
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      alert(`Failed to cancel booking: ${error.data?.message || error.message || 'Unknown error'}`)
    }
  }

  const openCancelModal = (booking: Booking) => {
    setBookingToCancel(booking)
    setIsCancelModalOpen(true)
  }

  const openStatusModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsStatusModalOpen(true)
  }

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailsModalOpen(true)
  }

  // Calculate stats
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.booking_status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed').length
  const activeBookings = bookings.filter(b => b.booking_status === 'active').length
  const completedBookings = bookings.filter(b => b.booking_status === 'completed').length
  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled').length

  // Calculate total revenue from completed, active, and confirmed bookings
  const totalRevenue = bookings
    .filter(b => b.booking_status === 'completed' || b.booking_status === 'active' || b.booking_status === 'confirmed')
    .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)

  const statusOptions: Booking['booking_status'][] = ['pending', 'confirmed', 'active', 'completed', 'cancelled']

  const getStatusColor = (booking_status: Booking['booking_status']) => {
    const actualStatus = booking_status|| 'pending'
    switch (actualStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (booking_status: Booking['booking_status'] ) => {
    const actualStatus = booking_status || 'pending'
    switch (actualStatus) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-purple-600" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatStatusText = (booking_status: Booking['booking_status'] ) => {
    const actualStatus = booking_status || 'pending'
    return actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const calculateTotalDays = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1
    } catch (error) {
      return 1
    }
  }

  // Function to check if status transition is valid
  const isValidStatusTransition = (currentStatus: Booking['booking_status'], newStatus: Booking['booking_status']) => {
    const validTransitions: Record<Booking['booking_status'], Booking['booking_status'][]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['active', 'cancelled'],
      'active': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': []  // No transitions from cancelled
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-red-600 text-lg font-semibold mb-2">
            Failed to load bookings
          </div>
          <button 
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600 mt-1">
              Manage all vehicle bookings and reservations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalBookings}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {pendingBookings}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {confirmedBookings}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {activeBookings}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {completedBookings}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bookings by customer name, email, vehicle, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <div className="text-xl font-semibold text-gray-500 mb-2">No bookings found</div>
                    <p className="text-gray-400">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'No bookings have been made yet'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const totalDays = calculateTotalDays(booking.booking_date, booking.return_date)
                  const userName = `${booking.first_name} ${booking.last_name}`
                  const userEmail = booking.email
                  const vehicleModel = booking.model
                  const vehicleManufacturer = booking.manufacturer

                  return (
                    <tr key={booking.booking_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {vehicleManufacturer} {vehicleModel}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {booking.booking_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{userName}</div>
                          <div className="text-sm text-gray-500">{userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {formatDate(booking.booking_date)} - {formatDate(booking.return_date)}
                          </div>
                          <div className="text-gray-500">{totalDays} days</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            ${booking.total_amount?.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                          {getStatusIcon(booking.booking_status)}
                          {formatStatusText(booking.booking_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openDetailsModal(booking)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openStatusModal(booking)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Update Status"
                            disabled={booking.booking_status === 'completed' || booking.booking_status === 'cancelled'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
                            <button 
                              onClick={() => openCancelModal(booking)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {`${selectedBooking.first_name} ${selectedBooking.last_name}`}
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
                      {selectedBooking.phone || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedBooking.user_id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Vehicle Information</h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {selectedBooking.manufacturer} {selectedBooking.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vehicle ID: {selectedBooking.vehicle_id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Booking Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedBooking.booking_id || 'N/A'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formatDate(selectedBooking.booking_date)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formatDate(selectedBooking.return_date)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {calculateTotalDays(selectedBooking.booking_date, selectedBooking.return_date)} days
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedBooking.created_at ? formatDate(selectedBooking.created_at) : 'N/A'}
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
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-green-800 font-semibold">
                      ${selectedBooking.total_amount?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedBooking.updated_at ? formatDate(selectedBooking.updated_at) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Update Booking Status</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdatingStatus}
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Status</label>
                  <select
                    value={statusForm.booking_status}
                    onChange={(e) => setStatusForm({ booking_status: e.target.value as Booking['booking_status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    // disabled={isUpdatingStatus}
                  >
                    {statusOptions.map(status => (
                      <option 
                        key={status} 
                        value={status}
                        disabled={!isValidStatusTransition(selectedBooking.booking_status, status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {!isValidStatusTransition(selectedBooking.booking_status, status) && 
                          status !== selectedBooking.booking_status && 
                          ' (Invalid transition)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Current status: <span className="font-medium">{selectedBooking.booking_status || 'pending'}</span>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Updating status for booking <strong>#{selectedBooking.booking_id}</strong>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Customer: <span className="font-medium">{selectedBooking.first_name} {selectedBooking.last_name}</span>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Vehicle: <span className="font-medium">{selectedBooking.manufacturer} {selectedBooking.model}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isUpdatingStatus || !isValidStatusTransition(selectedBooking.booking_status, statusForm.booking_status)}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {isCancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                Are you sure you want to cancel booking #{bookingToCancel.booking_id}?
              </p>
              <p className="text-red-600 text-sm mt-1">
                This will cancel the booking and free up the vehicle for the selected dates.
              </p>
              <p className="text-red-600 text-sm mt-1">
                Customer: <span className="font-medium">{bookingToCancel.first_name} {bookingToCancel.last_name}</span>
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false)
                  setBookingToCancel(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  )
}

export default AdminBookingsPage