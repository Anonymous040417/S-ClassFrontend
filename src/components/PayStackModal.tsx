import React, { useState } from 'react';
import { toast } from 'sonner';
import { useCreateNewPaymentMutation } from '../features/api/PaymentApi';
import { BookingApi } from '../features/api/BookingsApi';

interface PaystackPaymentModalProps {
  booking: any;
  user: any;
  phone: string;
  setPhone: (phone: string) => void;
  paymentMethod: 'mpesa' | 'card';
  setPaymentMethod: (method: 'mpesa' | 'card') => void;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({
  booking,
  user,
  phone,
  setPhone,
  paymentMethod,
  setPaymentMethod,
  onSuccess,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use your existing mutations
  const [createNewPayment, { isLoading: isCreatingPayment }] = useCreateNewPaymentMutation();
  const [updateBookingStatus] = BookingApi.useUpdateBookingStatusMutation();

  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_8d95593b2f58fc7f215ff7e7a518fdea0668d621';

  // Format phone number for M-Pesa
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, convert to 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If starts with +254, remove the +
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.replace('+', '');
    }
    
    // Ensure it's 12 digits (254XXXXXXXXX)
    if (cleaned.length === 12 && cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If it's 9 digits (without 254), add it
    if (cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    return cleaned;
  };

  // Generate transaction reference
  const generateTransactionRef = (): string => {
    return `BOOK-${booking.booking_id}-${Date.now()}`;
  };

  // Validate input
  const validateInput = (): boolean => {
    if (paymentMethod === 'mpesa') {
      if (!phone.trim()) {
        setError('Please enter your M-Pesa phone number');
        return false;
      }
      
      const cleanedPhone = phone.replace(/\D/g, '');
      if (!/^(\+254|0|254)[17]\d{8}$/.test(cleanedPhone)) {
        setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
        return false;
      }
    }
    
    return true;
  };

  // Create payment record in your database
  const createPaymentRecord = async (transactionRef: string, status: 'pending' | 'completed' | 'failed') => {
    try {
      const paymentData = {
        booking_id: booking.booking_id,
        amount: booking.total_amount || calculateTotalAmount(booking),
        currency: 'KES',
        payment_method: paymentMethod === 'mpesa' ? 'mpesa' : 'card',
        payment_status: status,
        transaction_reference: transactionRef,
        phone_number: paymentMethod === 'mpesa' ? phone : undefined,
        user_id: user?.user_id,
        created_at: new Date().toISOString()
      };

      const result = await createNewPayment(paymentData).unwrap();
      return result;
    } catch (error: any) {
      console.error('Failed to create payment record:', error);
      throw new Error(error?.data?.message || 'Failed to create payment record');
    }
  };

  // Update booking status
  const updateBookingStatusToPaid = async (bookingId: number) => {
    try {
      const result = await updateBookingStatus({
        booking_id: bookingId,
        booking_status: 'paid' // or 'confirmed' based on your API
      }).unwrap();
      return result;
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      // Don't throw - we'll still consider payment successful
      return null;
    }
  };

  // Calculate total amount from booking
  const calculateTotalAmount = (booking: any): number => {
    if (booking.total_amount) return booking.total_amount;
    
    // Fallback calculation if total_amount is not available
    const startDate = new Date(booking.booking_date);
    const endDate = new Date(booking.return_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const dailyRate = booking.rental_rate || 0;
    return days * dailyRate;
  };

  // Main payment handler
  const handlePayNow = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Generate transaction reference
      const transactionRef = generateTransactionRef();
      
      // 2. Create pending payment record
      const processingToast = toast.loading('Initializing payment...', {
        description: 'Please wait while we set up your payment.'
      });

      await createPaymentRecord(transactionRef, 'pending');
      
      // 3. Prepare Paystack configuration
      const config: any = {
        key: paystackPublicKey,
        email: user?.email || 'customer@example.com',
        amount: Math.round(calculateTotalAmount(booking) * 100), // Convert to kobo
        currency: 'KES',
        ref: transactionRef,
        metadata: {
          booking_id: booking.booking_id,
          customer_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
          customer_id: user?.user_id || '',
          vehicle: `${booking.manufacturer || ''} ${booking.model || ''}`.trim(),
          total_amount: calculateTotalAmount(booking),
          payment_method: paymentMethod
        },
        callback: async (response: any) => {
          // Payment successful
          toast.dismiss(processingToast);
          
          try {
            // Update payment record to completed
            await createPaymentRecord(transactionRef, 'completed');
            
            // Update booking status
            const bookingUpdateResult = await updateBookingStatusToPaid(booking.booking_id);
            
            if (bookingUpdateResult) {
              toast.success('Payment Successful!', {
                description: `Booking #${booking.booking_id} has been confirmed and paid.`,
                duration: 5000,
              });
            } else {
              toast.success('Payment Successful!', {
                description: 'Payment completed. Your booking will be updated shortly.',
                duration: 5000,
              });
            }
            
            // Call parent success callback
            onSuccess(response.reference);
            
            // Close modal after delay
            setTimeout(() => {
              onClose();
            }, 2000);
            
          } catch (updateError) {
            console.error('Payment update failed:', updateError);
            toast.success('Payment Completed!', {
              description: 'Payment was successful but there was an issue updating records. Please contact support.',
              duration: 5000,
            });
            
            // Still call success callback
            onSuccess(response.reference);
            
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        },
        onClose: () => {
          // User closed the payment modal
          toast.dismiss(processingToast);
          
          if (!isLoading) {
            toast.info('Payment Cancelled', {
              description: 'You closed the payment window.',
              duration: 3000,
            });
          }
          
          setIsLoading(false);
        }
      };

      // Add mobile money config for M-Pesa
      if (paymentMethod === 'mpesa' && phone) {
        config.channels = ['mobile_money'];
        config.mobile_money = {
          phone: formatPhoneNumber(phone),
          provider: 'mpesa'
        };
      }

      // 4. Initialize Paystack payment
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup(config);
        handler.openIframe();
      } else {
        // Load Paystack script if not available
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        
        script.onload = () => {
          if (window.PaystackPop) {
            const handler = window.PaystackPop.setup(config);
            handler.openIframe();
          } else {
            toast.error('Payment Service Unavailable', {
              description: 'Failed to load payment service. Please refresh and try again.',
              duration: 4000,
            });
            setIsLoading(false);
          }
        };
        
        script.onerror = () => {
          toast.error('Connection Error', {
            description: 'Failed to load payment service. Please check your internet connection.',
            duration: 4000,
          });
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      }

    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      setError(error.message || 'Failed to initialize payment. Please try again.');
      toast.error('Payment Failed', {
        description: error.message || 'Failed to initialize payment.',
        duration: 4000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
              <p className="text-sm text-gray-600 mt-1">Secure payment via Paystack</p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Booking Summary */}
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Booking Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Booking ID:</span>
                <span className="font-semibold text-blue-900">#{booking.booking_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Vehicle:</span>
                <span className="font-medium text-blue-900">{booking.manufacturer} {booking.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Amount:</span>
                <span className="text-lg font-bold text-blue-900">
                  KES {calculateTotalAmount(booking).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="px-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              disabled={isLoading}
              className={`p-4 border-2 rounded-xl transition-all duration-200 flex flex-col items-center ${
                paymentMethod === 'mpesa'
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                paymentMethod === 'mpesa' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className="text-xl">📱</span>
              </div>
              <span className="font-medium text-sm">M-Pesa</span>
              <span className="text-xs text-gray-500 mt-1">Mobile Money</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('card')}
              disabled={isLoading}
              className={`p-4 border-2 rounded-xl transition-all duration-200 flex flex-col items-center ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                paymentMethod === 'card' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <span className="text-xl">💳</span>
              </div>
              <span className="font-medium text-sm">Card</span>
              <span className="text-xs text-gray-500 mt-1">Credit/Debit</span>
            </button>
          </div>
        </div>

        {/* Phone Input for M-Pesa */}
        {paymentMethod === 'mpesa' && (
          <div className="px-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                disabled={isLoading}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500">+254</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your M-Pesa registered phone number
            </p>
          </div>
        )}

        {/* Payment Info */}
        <div className="px-6 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Payment Process
            </h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal pl-5">
              <li>Click "Pay Now" button</li>
              <li>Payment window will open (Paystack)</li>
              <li>Complete the payment process</li>
              <li>Payment record will be created in system</li>
              <li>Booking status will update to "Paid"</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6">
          <button
            onClick={handlePayNow}
            disabled={isLoading || (paymentMethod === 'mpesa' && !phone.trim())}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              isLoading || (paymentMethod === 'mpesa' && !phone.trim())
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            } text-white`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pay Now
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full mt-3 py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaystackPaymentModal;