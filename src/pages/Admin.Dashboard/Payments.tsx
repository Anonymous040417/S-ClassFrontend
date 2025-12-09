import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  BarChart3, 
  Smartphone, 
  CreditCard as CardIcon,
  Banknote,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { PaymentsApi } from '../../features/api/PaymentApi';
import { usersApi } from '../../features/api/UserAPi';
import type { Payment, User } from '../../types/Types';
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout';

const AdminPaymentsPage: React.FC = () => {
  // 1. Fetch Data
  const { 
    data: apiResponse, 
    isLoading, 
    error, 
    refetch 
  } = PaymentsApi.useGetAllPaymentsQuery(undefined, {
    pollingInterval: 15000, 
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [updatePaymentStatus, { isLoading: isUpdatingStatus }] = PaymentsApi.useUpdatePaymentStatusMutation();
  
  // Fetch all users for user information
  const { data: usersData } = usersApi.useGetAllUsersQuery();

  // 2. UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | string>('all');
  
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Local state for payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [optimisticallyUpdatedIds, setOptimisticallyUpdatedIds] = useState<Set<number>>(new Set());

  // Status form
  const [statusForm, setStatusForm] = useState({
    payment_status: 'pending' as Payment['payment_status']
  });

  // Map to store user data by user_id
  const [usersMap, setUsersMap] = useState<Map<number, User>>(new Map());

  // 3. Process users data
  useEffect(() => {
    if (usersData) {
      const newUsersMap = new Map<number, User>();
      usersData.forEach(user => {
        if (user.user_id) {
          newUsersMap.set(user.user_id, user);
        }
      });
      setUsersMap(newUsersMap);
    }
  }, [usersData]);

  // 4. Extract and Normalize Payments Data - FIXED VERSION
  useEffect(() => {
    if (apiResponse) {
      let paymentsArray: any[] = [];
      
      console.log('API Response:', apiResponse); // Debug log
      
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

      console.log('Payments array extracted:', paymentsArray); // Debug log

      // Process each payment to enrich user information
      const normalizedPayments: Payment[] = paymentsArray.map((payment: any) => {
        console.log('Processing payment:', payment); // Debug log
        
        // First, try to extract user from various possible structures
        let userFromPayment: User | null = null;
        
        // Case 1: Check if payment has a nested user object
        if (payment.user && typeof payment.user === 'object') {
          userFromPayment = {
            user_id: payment.user.user_id || 0,
            first_name: payment.user.first_name || 'Unknown',
            last_name: payment.user.last_name || 'User',
            email: payment.user.email || 'No email',
            contact_phone: payment.user.contact_phone || payment.user.phone || 'no contact',
            role: payment.user.role || 'user',
            created_at: payment.user.created_at || new Date().toISOString(),
            updated_at: payment.user.updated_at || new Date().toISOString()
          };
        }
        // Case 2: Check if payment has user_id and we have it in usersMap
        else if (payment.user_id && usersMap.has(payment.user_id)) {
          userFromPayment = usersMap.get(payment.user_id)!;
        }
        // Case 3: Check if payment has user fields directly at the root level
        else if (payment.first_name || payment.email) {
          userFromPayment = {
            user_id: payment.user_id || 0,
            first_name: payment.first_name || 'Unknown',
            last_name: payment.last_name || 'User',
            email: payment.email || 'No email',
            contact_phone: payment.contact_phone || payment.phone || 'no contact',
            role: 'user',
            created_at: payment.created_at || new Date().toISOString(),
            updated_at: payment.updated_at || new Date().toISOString()
          };
        }
        // Case 4: Check booking for user info (if booking exists)
        else if (payment.booking && payment.booking.user) {
          const bookingUser = payment.booking.user;
          userFromPayment = {
            user_id: bookingUser.user_id || 0,
            first_name: bookingUser.first_name || 'Unknown',
            last_name: bookingUser.last_name || 'User',
            email: bookingUser.email || 'No email',
            contact_phone: bookingUser.contact_phone || bookingUser.phone || 'no contact',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        // Create payment data
        const paymentData: Payment = {
          ...payment,
          payment_status: payment.payment_status || 'pending',
          amount: Number(payment.amount) || 0,
          currency: payment.currency || 'KES',
          payment_method: payment.payment_method || 'mpesa',
          created_at: payment.created_at || new Date().toISOString(),
        };

        // Assign user if found
        if (userFromPayment) {
          paymentData.user = userFromPayment;
        }

        // Ensure booking object is properly structured if it exists
        if (payment.booking) {
          paymentData.booking = {
            booking_id: payment.booking.booking_id || 0,
            user_name: payment.booking.user_name || payment.booking.user?.first_name || '',
            user_email: payment.booking.user_email || payment.booking.user?.email || '',
            vehicle_model: payment.booking.vehicle_model || payment.booking.vehicle?.model || '',
            vehicle_manufacturer: payment.booking.vehicle_manufacturer || payment.booking.vehicle?.manufacturer || '',
            booking_date: payment.booking.booking_date || new Date().toISOString()
          };
        }

        console.log('Processed payment data:', paymentData); // Debug log
        return paymentData;
      });

      // Sort by newest first
      const sortedPayments = normalizedPayments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPayments(sortedPayments);
    } else {
      setPayments([]);
    }
  }, [apiResponse, usersMap]);

  // Initialize status form when payment is selected
  useEffect(() => {
    if (selectedPayment) {
      setStatusForm({
        payment_status: selectedPayment.payment_status || 'pending'
      });
      setUpdateError(null);
      setUpdateSuccess(null);
    }
  }, [selectedPayment]);

  // 5. Filter Logic - Use payments state
  const filteredPayments = payments.filter(payment => {
    const user = payment.user;
    const userName = user ? `${user.first_name} ${user.last_name}` : 'Unknown';
    const userEmail = user?.email || '';
    const userPhone = user?.contact_phone || '';
    const txId = payment.transaction_id || payment.mpesa_receipt_number || payment.transaction_reference || '';
    const payId = payment.payment_id?.toString() || '';
    
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      userName.toLowerCase().includes(term) ||
      userEmail.toLowerCase().includes(term) ||
      userPhone.toLowerCase().includes(term) ||
      txId.toLowerCase().includes(term) ||
      payId.includes(term);
    
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // 6. Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 7. Update Status Handler
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment?.payment_id) return;

    try {
      console.log('🔄 Updating status for payment:', selectedPayment.payment_id, 'to:', statusForm.payment_status);
      
      // 1. Store the optimistic update ID
      const paymentId = selectedPayment.payment_id;
      setOptimisticallyUpdatedIds(prev => new Set(prev).add(paymentId));
      
      // 2. Optimistic update - update local state immediately
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.payment_id === paymentId
            ? { 
                ...payment, 
                payment_status: statusForm.payment_status
              }
            : payment
        )   
      );

      // 3. Show success message
      setUpdateSuccess(`Status updated to "${statusForm.payment_status}"`);
      
      // 4. Call API - using the correct parameter name
      const result = await updatePaymentStatus({
        payment_id: paymentId,
        payment_status: statusForm.payment_status
      }).unwrap();
      
      console.log('✅ Status updated successfully:', result);
      
      // 5. Remove from optimistic updates set after successful API call
      setOptimisticallyUpdatedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });

      // 6. Close modal after delay
      setTimeout(() => {
        setIsStatusModalOpen(false);
        setSelectedPayment(null);
        setUpdateSuccess(null);
      }, 1500);

      // 7. Refetch data to ensure sync with server (after delay)
      setTimeout(() => {
        handleRefresh();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Failed to update payment status:', error);
      console.error('Error details:', error);
      
      // Remove from optimistic updates on error
      if (selectedPayment?.payment_id) {
        setOptimisticallyUpdatedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedPayment.payment_id);
          return newSet;
        });
      }
      
      // Show error and revert optimistic update
      const errorMessage = error?.data?.message || 
                          error?.error || 
                          error?.message || 
                          'Failed to update status. Please try again.';
      setUpdateError(errorMessage);
      
      // Refetch to get correct server state
      handleRefresh();
    }
  };

  // --- Helper Functions ---
  const getStatusColor = (status: Payment['payment_status']) => {
    const statusValue = status?.toLowerCase();
    switch (statusValue) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Payment['payment_status']) => {
    const statusValue = status?.toLowerCase();
    switch (statusValue) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" />;
      case 'refunded': return <RefreshCw className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  const getMethodIcon = (method: Payment['payment_method']) => {
    switch (method?.toLowerCase()) {
      case 'mpesa': return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'card': return <CardIcon className="w-4 h-4 text-blue-600" />;
      case 'cash': return <Banknote className="w-4 h-4 text-gray-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Stats Calculations - Use payments state
  const totalRevenue = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
    
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
  const failedCount = payments.filter(p => p.payment_status === 'failed').length;
  const refundedCount = payments.filter(p => p.payment_status === 'refunded').length;

  // Status options for dropdown - using the correct type
  const statusOptions: Payment['payment_status'][] = ['pending', 'completed', 'failed', 'refunded'];

  // --- Render ---

  if (isLoading && !payments.length) {
    return (
      <AdminDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading transactions...</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="p-8 flex justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Payments</h3>
            <p className="text-red-600 mb-6">{(error as any)?.data?.message || 'Unable to connect to the server.'}</p>
            <button 
              onClick={() => handleRefresh()} 
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Payments & Revenue</h1>
            </div>
            <p className="text-gray-500 text-sm">Monitor incoming transactions and manage payment statuses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRefresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-blue-50 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-600"/></div>
               <span className="text-xs font-semibold text-gray-400 uppercase">Total Transactions</span>
             </div>
             <h3 className="text-2xl font-bold text-gray-900">{payments.length}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-green-50 rounded-lg"><DollarSign className="w-5 h-5 text-green-600"/></div>
               <span className="text-xs font-semibold text-gray-400 uppercase">Total Revenue</span>
             </div>
             <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600"/></div>
               <span className="text-xs font-semibold text-gray-400 uppercase">Pending Review</span>
             </div>
             <h3 className="text-2xl font-bold text-yellow-700">{pendingCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-red-50 rounded-lg"><XCircle className="w-5 h-5 text-red-600"/></div>
               <span className="text-xs font-semibold text-gray-400 uppercase">Failed Payments</span>
             </div>
             <h3 className="text-2xl font-bold text-red-600">{failedCount}</h3>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by User Name, Email, Phone, Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <select 
               value={methodFilter} 
               onChange={(e) => setMethodFilter(e.target.value)}
               className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">User Information</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-gray-300 mb-2" />
                        <p>No payments found matching your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const isOptimisticallyUpdated = optimisticallyUpdatedIds.has(payment.payment_id);
                    const user = payment.user;
                    
                    return (
                      <tr 
                        key={payment.payment_id} 
                        className={`hover:bg-gray-50 transition-colors ${isOptimisticallyUpdated ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                              {getMethodIcon(payment.payment_method)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 font-mono text-xs">
                                {payment.transaction_id || payment.mpesa_receipt_number || payment.transaction_reference || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">ID: {payment.payment_id}</p>
                              {payment.booking && (
                                <p className="text-xs text-gray-400">Booking: {payment.booking.booking_id}</p>
                              )}
                              {isOptimisticallyUpdated && (
                                <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Updating...
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-3 h-3 text-gray-400" />
                                <p className="font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              {user.contact_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">{user.contact_phone}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">User information not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.payment_status)}`}>
                            {getStatusIcon(payment.payment_status)}
                            <span className="capitalize">{payment.payment_status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{formatDate(payment.created_at)}</span>
                            <span className="text-xs">{formatDateTime(payment.created_at).split(', ')[1]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsStatusModalOpen(true);
                            }}
                            disabled={isOptimisticallyUpdated || isUpdatingStatus}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto ml-auto"
                          >
                            {isOptimisticallyUpdated ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Update Status
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Status Modal - Enhanced like user bookings */}
        {isStatusModalOpen && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Update Payment Status</h3>
                  <p className="text-sm text-gray-500 mt-1">Change the status of this transaction</p>
                </div>
                <button
                  onClick={() => {
                    if (!isUpdatingStatus) {
                      setIsStatusModalOpen(false);
                      setSelectedPayment(null);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isUpdatingStatus}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Payment Summary Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(selectedPayment.payment_method)}
                    <div>
                      <p className="text-sm opacity-90">Transaction</p>
                      <p className="font-bold text-lg">
                        {selectedPayment.transaction_id || selectedPayment.mpesa_receipt_number || selectedPayment.transaction_reference || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedPayment.payment_status === 'completed' 
                      ? 'bg-green-500' 
                      : selectedPayment.payment_status === 'failed'
                      ? 'bg-red-500'
                      : selectedPayment.payment_status === 'refunded'
                      ? 'bg-purple-500'
                      : 'bg-yellow-500'
                  }`}>
                    {selectedPayment.payment_status.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Amount</p>
                    <p className="font-bold text-2xl">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Date</p>
                    <p className="font-medium">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateStatus}>
                <div className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select New Status
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {statusOptions.map(status => {
                        const isActive = statusForm.payment_status === status;
                        const getStatusButtonColor = (status: string) => {
                          switch (status) {
                            case 'completed': return isActive ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-200 hover:border-green-300 hover:bg-green-50';
                            case 'failed': return isActive ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-200 hover:border-red-300 hover:bg-red-50';
                            case 'refunded': return isActive ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';
                            case 'pending': return isActive ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50';
                            default: return isActive ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
                          }
                        };

                        return (
                          <button
                            type="button"
                            key={status}
                            onClick={() => setStatusForm({ payment_status: status })}
                            className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 ${getStatusButtonColor(status)}`}
                          >
                            {getStatusIcon(status)}
                            <span className="font-medium capitalize">{status}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Detailed Status Selector */}
                    <div className="relative">
                      <select
                        value={statusForm.payment_status}
                        onChange={(e) => {
                          const value = e.target.value as Payment['payment_status'];
                          setStatusForm({ payment_status: value });
                          setUpdateError(null);
                          setUpdateSuccess(null);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                        disabled={isUpdatingStatus}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Current status: <span className="font-medium capitalize">{selectedPayment.payment_status || 'pending'}</span>
                    </p>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                      Payment Details
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment ID:</span>
                        <span className="font-medium">#{selectedPayment.payment_id}</span>
                      </div>
                      {selectedPayment.user && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Customer:</span>
                            <span className="font-medium">{selectedPayment.user.first_name} {selectedPayment.user.last_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="font-medium text-blue-600">{selectedPayment.user.email}</span>
                          </div>
                        </>
                      )}
                      {selectedPayment.booking && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Booking ID:</span>
                            <span className="font-medium">#{selectedPayment.booking.booking_id}</span>
                          </div>
                          {selectedPayment.booking.booking_date && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Booking Date:</span>
                              <span className="font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(selectedPayment.booking.booking_date)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Method:</span>
                        <span className="font-medium capitalize flex items-center gap-1">
                          {getMethodIcon(selectedPayment.payment_method)}
                          {selectedPayment.payment_method}
                        </span>
                      </div>
                      {selectedPayment.phone_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedPayment.phone_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error and Success Messages */}
                {updateError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2 items-start border border-red-100 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{updateError}</span>
                  </div>
                )}

                {updateSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex gap-2 items-start border border-green-100 animate-in fade-in duration-200">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{updateSuccess}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isUpdatingStatus) {
                        setIsStatusModalOpen(false);
                        setSelectedPayment(null);
                      }
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isUpdatingStatus}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminPaymentsPage;