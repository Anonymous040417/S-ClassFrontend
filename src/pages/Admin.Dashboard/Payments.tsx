import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Search, 
  MoreVertical, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  X as CloseIcon,
  Loader2
} from 'lucide-react'
import { PaymentsApi } from '../../features/api/PaymentApi'
import type { Payment } from '../../types/Types'
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout'

const AdminPaymentsPage: React.FC = () => {
  const { data: apiResponse, isLoading, error, refetch } = PaymentsApi.useGetAllPaymentsQuery()
  const [updatePaymentStatus, { isLoading: isUpdatingStatus }] = PaymentsApi.useUpdatePaymentStatusMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | Payment['payment_method']>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])

  // Status update form
  const [statusForm, setStatusForm] = useState({
    status: 'pending' as Payment['status']
  })

  // Extract payments from API response
  useEffect(() => {
    if (apiResponse) {
      let paymentsArray: Payment[] = [];
      
      if (Array.isArray(apiResponse)) {
        paymentsArray = apiResponse;
      } else if (apiResponse && typeof apiResponse === 'object') {
        if (Array.isArray((apiResponse as any).data)) {
          paymentsArray = (apiResponse as any).data;
        } else if (Array.isArray((apiResponse as any).payments)) {
          paymentsArray = (apiResponse as any).payments;
        } else {
          console.warn('Unexpected API response structure:', apiResponse);
          paymentsArray = [];
        }
      } else {
        paymentsArray = [];
      }

      // Ensure all payments have required fields with defaults
      paymentsArray = paymentsArray.map(payment => ({
        ...payment,
        status: payment.status || 'pending',
        payment_method: payment.payment_method || 'unknown',
        amount: payment.amount || 0,
        currency: payment.currency || 'KES',
        booking_id: payment.booking_id || 0,
        created_at: payment.created_at || '',
        updated_at: payment.updated_at || '',
        user: payment.user || {
          user_id:0,
          first_name: 'Unknown',
          last_name: 'User',
          email: 'No email'
        }
      }));

      setPayments(paymentsArray);
    } else {
      setPayments([]);
    }
  }, [apiResponse])

  // Initialize status form when payment is selected
  useEffect(() => {
    if (selectedPayment) {
      setStatusForm({
        status: selectedPayment.status || 'pending'
      })
    }
  }, [selectedPayment])

  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
    const userName = payment.user 
      ? `${payment.user.first_name || ''} ${payment.user.last_name || ''}`.trim() 
      : 'Unknown User';
    const userEmail = payment.user?.email || 'No email';
    const transactionId = payment.transaction_id || payment.mpesa_receipt_number || 'No ID';
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.payment_id?.toString().includes(searchTerm) || false) ||
      (payment.booking_id?.toString().includes(searchTerm) || false)
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment || !selectedPayment.payment_id) return

    try {
      console.log('Updating status for payment:', selectedPayment.payment_id, 'to:', statusForm.status)
      
      // Update payment status with correct API parameters
      await updatePaymentStatus({
        payment_id: selectedPayment.payment_id,
        status: statusForm.status
      }).unwrap()
      
      console.log('Payment status updated successfully')
      
      // Update local state immediately for better UX
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.payment_id === selectedPayment.payment_id
            ? { 
                ...payment, 
                status: statusForm.status,
                updated_at: new Date().toISOString() // Update timestamp locally
              }
            : payment
        )
      )
      
      setIsStatusModalOpen(false)
      setSelectedPayment(null)
      
      // Refetch to ensure data is in sync

      
    } catch (error: any) {
      console.error('Failed to update payment status:', error)
      alert(`Failed to update payment status: ${error.data?.message || error.message || 'Unknown error'}`)
    }
  }

  const openStatusModal = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsStatusModalOpen(true)
  }

  const openDetailsModal = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailsModalOpen(true)
  }

  // Calculate stats
  const totalPayments = payments.length
  const completedPayments = payments.filter(p => p.status === 'completed').length
  const pendingPayments = payments.filter(p => p.status === 'pending').length
  const failedPayments = payments.filter(p => p.status === 'failed').length
  const refundedPayments = payments.filter(p => p.status === 'refunded').length

  // Calculate total revenue from completed payments
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0)

  const statusOptions: Payment['status'][] = ['pending', 'completed', 'failed', 'refunded']
  const methodOptions: Payment['payment_method'][] = ['mpesa', 'card', 'cash']

  const getStatusColor = (status: Payment['status']) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Payment['status']) => {
    const safeStatus = status || 'pending';
    switch (safeStatus) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'refunded': return <RefreshCw className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getMethodColor = (method: Payment['payment_method']) => {
    const safeMethod = method || 'unknown';
    switch (safeMethod) {
      case 'mpesa': return 'bg-green-50 text-green-700 border-green-200'
      case 'card': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cash': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatStatusText = (status: Payment['status']) => {
    const safeStatus = status || 'pending';
    return safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  }

  const formatMethodText = (method: Payment['payment_method']) => {
    const safeMethod = method || 'unknown';
    return safeMethod.charAt(0).toUpperCase() + safeMethod.slice(1);
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
  }

  const formatCurrency = (amount: number | undefined, currency: string = 'KES') => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(safeAmount)
  }

  // Function to check if status transition is valid
  const isValidStatusTransition = (currentStatus: Payment['status'], newStatus: Payment['status']) => {
    const validTransitions: Record<Payment['status'], Payment['status'][]> = {
      'pending': ['completed', 'failed'],
      'completed': ['refunded'],
      'failed': ['pending'],
      'refunded': [] // No transitions from refunded
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
            Failed to load payments
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
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all payment transactions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {totalPayments}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {completedPayments}
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
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {pendingPayments}
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
              <p className="text-gray-500 text-sm font-medium">Failed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {failedPayments}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(totalRevenue)}
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
              placeholder="Search payments by customer name, email, transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {formatStatusText(status)}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              {methodOptions.map(method => (
                <option key={method} value={method}>
                  {formatMethodText(method)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <div className="text-xl font-semibold text-gray-500 mb-2">No payments found</div>
                    <p className="text-gray-400">
                      {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                        ? 'Try adjusting your search or filters' 
                        : 'No payments have been processed yet'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const userName = payment.user 
                    ? `${payment.user.first_name || ''} ${payment.user.last_name || ''}`.trim() 
                    : 'Unknown User';
                  const userEmail = payment.user?.email || 'No email';
                  const transactionId = payment.transaction_id || payment.mpesa_receipt_number || 'No ID';

                  return (
                    <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {transactionId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Booking: {payment.booking_id || 'N/A'}
                              {payment.payment_id && ` • Payment: ${payment.payment_id}`}
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
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getMethodColor(payment.payment_method)}`}>
                          {formatMethodText(payment.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {formatStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openDetailsModal(payment)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openStatusModal(payment)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Update Status"
                            disabled={isUpdatingStatus || payment.status === 'refunded'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
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

      {/* Payment Details Modal */}
      {isDetailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-400" />
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
                      {selectedPayment.user ? `${selectedPayment.user.first_name || ''} ${selectedPayment.user.last_name || ''}`.trim() || 'N/A' : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.user?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.phone_number || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.user?.user_id|| 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Payment Information</h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Transaction ID: {selectedPayment.transaction_id || selectedPayment.mpesa_receipt_number || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.payment_id || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.booking_id || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="p-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                        {getStatusIcon(selectedPayment.status)}
                        {formatStatusText(selectedPayment.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formatMethodText(selectedPayment.payment_method)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.currency || 'KES'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedPayment.status|| 'N/A'}
                    </div>
                  </div>
                  {selectedPayment.description && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedPayment.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Timestamps</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formatDate(selectedPayment.created_at)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formatDate(selectedPayment.updated_at)}
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
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openStatusModal(selectedPayment);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {isStatusModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Update Payment Status</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdatingStatus}
              >
                <CloseIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ status: e.target.value as Payment['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isUpdatingStatus}
                  >
                    {statusOptions.map(status => (
                      <option 
                        key={status} 
                        value={status}
                        disabled={!isValidStatusTransition(selectedPayment.status, status)}
                      >
                        {formatStatusText(status)}
                        {!isValidStatusTransition(selectedPayment.status, status) && 
                          status !== selectedPayment.status && 
                          ' (Invalid transition)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Current status: <span className="font-medium">{formatStatusText(selectedPayment.status)}</span>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Updating status for payment <strong>#{selectedPayment.payment_id || 'N/A'}</strong>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Customer: <span className="font-medium">
                      {selectedPayment.user ? `${selectedPayment.user.first_name || ''} ${selectedPayment.user.last_name || ''}`.trim() || 'N/A' : 'N/A'}
                    </span>
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Amount: <span className="font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span>
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
                  disabled={isUpdatingStatus || !isValidStatusTransition(selectedPayment.status, statusForm.status)}
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
    </AdminDashboardLayout>
  )
}

export default AdminPaymentsPage