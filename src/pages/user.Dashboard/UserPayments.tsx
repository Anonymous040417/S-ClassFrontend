import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useGetPaymentsByUserIdQuery } from '../../features/api/PaymentApi'
import { 
  CreditCard, 
  Download, 
  Eye, 
  Filter, 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  Receipt,
  AlertCircle,
  User,
  Shield,
  FileText,
  TrendingUp,
  CreditCard as CardIcon,
  Smartphone
} from 'lucide-react'
import { format } from 'date-fns'
import type { Payment } from '../../types/Types'
import type { RootState } from '../../store/store'
import { skipToken } from '@reduxjs/toolkit/query'
import DashboardLayout from '../../Dashboard.designs/DashboardLayout'

const UserPaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  
  // Get current user from Redux auth state
  const { isAuthenticated, user } = useSelector((state: RootState) => state.authSlice) as { 
    isAuthenticated: boolean; 
    user: any 
  }
  
  // Helper function to safely extract array from API response
  const extractPaymentsArray = (data: any): Payment[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.payments && Array.isArray(data.payments)) return data.payments
    return []
  }
  
  // Fetch payments by user ID - only if user is authenticated
  const { 
    data: apiResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetPaymentsByUserIdQuery(
    isAuthenticated && user ? { user_id: user.user_id } : skipToken,
    {
      pollingInterval: 30000,
      refetchOnFocus: true,
    }
  )
  
  // Safely extract payments from response
  const userPayments = extractPaymentsArray(apiResponse)
  
  // Debug logging
  useEffect(() => {
    console.log('API Response:', apiResponse)
    console.log('Extracted Payments:', userPayments)
    console.log('Is Array?', Array.isArray(userPayments))
  }, [apiResponse, userPayments])
  
  // Apply filters - only if userPayments is an array
  const filteredPayments = Array.isArray(userPayments) 
    ? userPayments.filter((payment: Payment) => {
        const matchesSearch = 
          searchTerm === '' ||
          payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.mpesa_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.booking?.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.booking?.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = 
          statusFilter === 'all' || 
          payment.payment_status === statusFilter

        const matchesPaymentMethod = 
          paymentMethodFilter === 'all' || 
          payment.payment_method === paymentMethodFilter

        return matchesSearch && matchesStatus && matchesPaymentMethod
      })
    : []
  
  // Calculate totals - handle empty case
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedPayments = filteredPayments.filter(p => p.payment_status=== 'completed').length
  const pendingPayments = filteredPayments.filter(p => p.payment_status=== 'pending').length
  const failedPayments = filteredPayments.filter(p => p.payment_status=== 'failed').length
  const refundedPayments = filteredPayments.filter(p => p.payment_status=== 'refunded').length

  // Calculate method totals
  const mpesaPayments = filteredPayments.filter(p => p.payment_method === 'mpesa').length
  const cardPayments = filteredPayments.filter(p => p.payment_method === 'card').length
  const cashPayments = filteredPayments.filter(p => p.payment_method === 'cash').length

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  // Format date for table (short version)
  const formatTableDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm')
    } catch {
      return dateString
    }
  }

  // Get status badge
  const getStatusBadge = (status: Payment['payment_status']) => {
    const config = {
      'pending': { 
        icon: <Clock className="w-4 h-4" />, 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: 'Pending' 
      },
      'completed': { 
        icon: <CheckCircle className="w-4 h-4" />, 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: 'Completed' 
      },
      'failed': { 
        icon: <XCircle className="w-4 h-4" />, 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: 'Failed' 
      },
      'refunded': { 
        icon: <RefreshCw className="w-4 h-4" />, 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        label: 'Refunded' 
      }
    }
    
    const statusConfig = config[status] || config.pending
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        {statusConfig.icon}
        {statusConfig.label}
      </span>
    )
  }

  // Get payment method badge
  const getPaymentMethodBadge = (method: Payment['payment_method']) => {
    const config = {
      'mpesa': { 
        icon: <Smartphone className="w-3 h-3" />,
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        label: 'M-Pesa' 
      },
      'card': { 
        icon: <CardIcon className="w-3 h-3" />,
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        label: 'Card' 
      },
      'cash': { 
        icon: <DollarSign className="w-3 h-3" />,
        bg: 'bg-gray-50', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        label: 'Cash' 
      }
    }
    
    const methodConfig = config[method] || config.mpesa
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${methodConfig.bg} ${methodConfig.text} ${methodConfig.border}`}>
        {methodConfig.icon}
        {methodConfig.label}
      </span>
    )
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: Payment['payment_method']) => {
    const icons = {
      'mpesa': <Smartphone className="w-5 h-5 text-green-600" />,
      'card': <CardIcon className="w-5 h-5 text-blue-600" />,
      'cash': <DollarSign className="w-5 h-5 text-gray-600" />
    }
    return icons[method] || <CreditCard className="w-5 h-5 text-gray-600" />
  }

  // Handle receipt download
  const handleDownloadReceipt = (payment: Payment) => {
    // Generate receipt content
    const receiptContent = `
      Payment Receipt
      =====================
      Receipt ID: ${payment.transaction_reference || `PAY-${payment.payment_id}`}
      Date: ${formatDate(payment.created_at)}
      
      Customer: ${user?.first_name || payment.user?.first_name || ''} ${user?.last_name || payment.user?.last_name || ''}
      Email: ${user?.email || payment.user?.email || ''}
      
      Booking ID: ${payment.booking_id}
      Vehicle: ${payment.booking?.vehicle_manufacturer || ''} ${payment.booking?.vehicle_model || ''}
      
      Amount: ${formatCurrency(payment.amount, payment.currency)}
      Payment Method: ${payment.payment_method}
      Status: ${payment.payment_status}
      
      ${payment.mpesa_receipt_number ? `M-Pesa Receipt: ${payment.mpesa_receipt_number}` : ''}
      ${payment.transaction_id ? `Transaction ID: ${payment.transaction_id}` : ''}
      ${payment.transaction_reference ? `Reference: ${payment.transaction_reference}` : ''}
      
      Thank you for your payment!
      
      Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    `
    
    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-receipt-${payment.payment_id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Handle view payment details
  const handleViewDetails = (payment: Payment) => {
    alert(`
Payment Details:
--------------
ID: ${payment.payment_id}
Amount: ${formatCurrency(payment.amount, payment.currency)}
Status: ${payment.payment_status}
Method: ${payment.payment_method}
Date: ${formatDate(payment.created_at)}
${payment.mpesa_receipt_number ? `M-Pesa Receipt: ${payment.mpesa_receipt_number}` : ''}
${payment.transaction_id ? `Transaction ID: ${payment.transaction_id}` : ''}
${payment.transaction_reference ? `Reference: ${payment.transaction_reference}` : ''}
${payment.description ? `Description: ${payment.description}` : ''}
    `)
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h3>
        <p className="text-yellow-600 mb-4">Please log in to view your payment history.</p>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
          Go to Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your payments...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Payments</h3>
        <p className="text-red-600 mb-4">
          {error ? `Error: ${(error as any).data?.message || (error as any).error}` : 'Failed to load your payment data.'}
        </p>
        <button 
          onClick={() => refetch()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // Handle case where response is not an array
  if (!Array.isArray(userPayments)) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Data Format Error</h3>
        <p className="text-orange-600 mb-4">
          Payment data is not in the expected format. Please contact support.
        </p>
        <button 
          onClick={() => refetch()}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-blue-600" />
              My Payment History
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              {user.first_name} {user.last_name} • {user.email}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredPayments.length}</p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalAmount, userPayments[0]?.currency || 'KES')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Spent in total</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completedPayments}</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Successful
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingPayments}</p>
                <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                  <Clock className="w-3 h-3" />
                  Awaiting confirmation
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Method Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">M-Pesa Payments</p>
                <p className="text-xl font-bold text-green-900 mt-1">{mpesaPayments}</p>
              </div>
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Card Payments</p>
                <p className="text-xl font-bold text-blue-900 mt-1">{cardPayments}</p>
              </div>
              <CardIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Cash Payments</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{cashPayments}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by receipt, transaction ID, vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none min-w-[140px]"
              >
                <option value="all">All Methods</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
          
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-full ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1 ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <CheckCircle className="w-3 h-3" />
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1 ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Clock className="w-3 h-3" />
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1 ${statusFilter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <XCircle className="w-3 h-3" />
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* Payments List/Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payment Transactions</h2>
            <span className="text-sm text-gray-500">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'} found
            </span>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payments Found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'Try changing your search terms or filters to find payments.'
                  : 'You haven\'t made any payments yet. Start by booking a vehicle!'}
              </p>
              {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPaymentMethodFilter('all')
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Vehicles
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Method & Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getPaymentMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.transaction_reference || `PAY-${payment.payment_id}`}
                          </p>
                          {payment.mpesa_receipt_number && (
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">M-Pesa:</span> {payment.mpesa_receipt_number}
                            </p>
                          )}
                          {payment.transaction_id && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">TXN:</span> {payment.transaction_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          Booking #{payment.booking_id}
                        </p>
                        {payment.booking?.vehicle_model && (
                          <p className="text-sm text-gray-500">
                            {payment.booking.vehicle_manufacturer} {payment.booking.vehicle_model}
                          </p>
                        )}
                        {payment.booking?.booking_date && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(payment.booking.booking_date)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-lg text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.currency}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        {getPaymentMethodBadge(payment.payment_method)}
                        {getStatusBadge(payment.payment_status)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            {formatTableDate(payment.created_at)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(payment.created_at).split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Download Receipt"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary and Export Section */}
      {filteredPayments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Payment Summary</h3>
              <p className="text-gray-600 text-sm mb-3">
                Showing {filteredPayments.length} of {userPayments.length} total payments
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  <CheckCircle className="w-3 h-3" /> {completedPayments} completed
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <Clock className="w-3 h-3" /> {pendingPayments} pending
                </span>
                {failedPayments > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    <XCircle className="w-3 h-3" /> {failedPayments} failed
                  </span>
                )}
                {refundedPayments > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <RefreshCw className="w-3 h-3" /> {refundedPayments} refunded
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-500">Total Filtered Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalAmount, userPayments[0]?.currency || 'KES')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Generate CSV report
                      const csvContent = [
                        ['Payment ID', 'Booking ID', 'Amount', 'Currency', 'Method', 'Status', 'Date', 'Transaction ID', 'Reference'],
                        ...filteredPayments.map(payment => [
                          payment.payment_id,
                          payment.booking_id,
                          payment.amount,
                          payment.currency,
                          payment.payment_method,
                          payment.payment_status,
                          formatDate(payment.created_at),
                          payment.transaction_id || '',
                          payment.transaction_reference || ''
                        ])
                      ].map(row => row.join(',')).join('\n')
                      
                      const blob = new Blob([csvContent], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `payment-report-${user.user_id}-${new Date().toISOString().split('T')[0]}.csv`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Receipt className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      {filteredPayments.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Need Help with Payments?</h4>
              <p className="text-sm text-gray-600 mb-3">
                If you have questions about any payment, notice an error, or need a refund, please contact our support team.
              </p>
              <div className="flex gap-3">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                  Payment FAQs
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                  Refund Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>
    </div>
  )
}

export default UserPaymentsPage