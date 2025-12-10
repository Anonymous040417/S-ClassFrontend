import React, { useState } from 'react';
import { toast } from 'sonner';

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

  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_8d95593b2f58fc7f215ff7e7a518fdea0668d621';

  // Helper function to get auth token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Helper function to format phone number
  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // Helper function to generate transaction ID
  const generateTransactionId = (): string => {
    return `BOOK_${booking.booking_id}_${Date.now()}`;
  };

  // Function to validate payment input
  const validatePaymentInput = (): boolean => {
    if (paymentMethod === 'mpesa' && !phone) {
      setError('Please enter your M-Pesa phone number');
      return false;
    }

    if (paymentMethod === 'mpesa' && !/^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return false;
    }

    return true;
  };

  // Function to find existing pending payment
  const findExistingPendingPayment = async (bookingId: number, token: string): Promise<any | null> => {
    try {
      const userPaymentsResponse = await fetch('http://localhost:3000/api/payments/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (userPaymentsResponse.ok) {
        const userPayments = await userPaymentsResponse.json();
        return userPayments.find((payment: any) => 
          payment.booking_id == bookingId && 
          payment.payment_status === 'Pending'
        );
      }
    } catch (error) {
      console.log('⚠️ Could not fetch user payments:', error);
    }
    return null;
  };

  // Function to update existing payment
  const updateExistingPayment = async (paymentId: string, paymentData: any, token: string): Promise<any> => {
    const response = await fetch(`http://localhost:3000/api/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update payment: ${response.status}`);
    }

    return await response.json();
  };

  // Function to create new payment
  const createNewPayment = async (paymentData: any, token: string): Promise<any> => {
    const response = await fetch('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 409 || errorText.includes('duplicate')) {
        return { 
          success: true, 
          message: 'Payment already exists', 
          booking_id: paymentData.booking_id 
        };
      }
      throw new Error(`Failed to create payment: ${response.status}`);
    }

    return await response.json();
  };

  // Function to find and update or create payment
  const findAndUpdatePayment = async (paymentData: any): Promise<any> => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      console.log('📋 Looking for existing payment for booking:', paymentData.booking_id);

      // Try to find existing pending payment
      const existingPayment = await findExistingPendingPayment(paymentData.booking_id, token);
      
      if (existingPayment) {
        console.log('✅ Found existing pending payment to update:', existingPayment);
        return await updateExistingPayment(existingPayment.payment_id, {
          payment_status: 'Paid',
          transaction_id: paymentData.transaction_id,
          payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card',
          paystack_response: JSON.stringify(paymentData.paystack_response),
          updated_at: new Date().toISOString()
        }, token);
      }

      // If no existing payment, create new one
      console.log('➕ Creating new payment record for booking:', paymentData.booking_id);
      return await createNewPayment(paymentData, token);
      
    } catch (error) {
      console.error('❌ Error in findAndUpdatePayment:', error);
      throw error;
    }
  };

  // Function to update booking status
  const updateBookingToPaid = async (bookingId: string): Promise<any> => {
    try {
      const token = getAuthToken();
      if (!token) return { success: false, message: 'No auth token' };

      // Try the specific status endpoint first
      const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_status: 'Paid'
        })
      });

      if (!response.ok) {
        // Fallback to general update endpoint
        const generalResponse = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_status: 'Paid',
            updated_at: new Date().toISOString()
          })
        });

        if (!generalResponse.ok) {
          console.log('⚠️ Booking status update failed, but payment was successful');
          return { success: false, message: 'Booking update failed but payment succeeded' };
        }

        return await generalResponse.json();
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error updating booking:', error);
      return { success: false, message: 'Booking update failed but payment succeeded' };
    }
  };

  // Function to prepare payment data
  const preparePaymentData = (response: any) => {
    return {
      booking_id: parseInt(booking.booking_id),
      amount: booking.total_amount,
      payment_status: 'Paid',
      payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card',
      transaction_id: response.reference,
      paystack_response: response,
      user_id: user?.user_id,
      vehicle_id: booking.vehicle_id
    };
  };

  // Function to process payment after successful transaction
  const processPaymentTransaction = async (response: any, transactionId: string) => {
    try {
      // Step 1: Prepare payment data
      const paymentData = preparePaymentData(response);
      console.log('📤 Processing payment data for booking:', paymentData.booking_id);

      // Show processing toast
      const processingToast = toast.loading('Updating payment record...', {
        description: 'Processing your payment...'
      });

      // Step 2: Update or create payment record
      const paymentResult = await findAndUpdatePayment(paymentData);
      console.log('✅ Payment result:', paymentResult);
      
      // Update toast
      toast.dismiss(processingToast);
      toast.loading('Updating booking status...', {
        description: 'Confirming your booking...'
      });

      // Step 3: Update booking status
      const updateResult = await updateBookingToPaid(booking.booking_id);
      console.log('✅ Booking update result:', updateResult);

      // Step 4: Call parent success callback
      onSuccess(response.reference);
      
      // Step 5: Show final success toast
      toast.success('Payment Processed Successfully!', {
        description: `Booking #${booking.booking_id} is now confirmed and paid`,
        duration: 4000,
      });
      
      // Step 6: Close modal
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Payment processing failed:', error);
      
      // Even if payment record update failed, payment was successful
      toast.success('Payment Successful!', {
        description: 'Payment completed. Some updates may be pending.',
        duration: 5000,
      });
      
      // Still call success callback
      onSuccess(transactionId);
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  // Function to create Paystack configuration
  const createPaystackConfig = (transactionId: string, callback: Function, onCloseCallback: Function) => {
    const config: any = {
      key: paystackPublicKey,
      email: user?.email || 'customer@example.com',
      amount: Math.round(booking.total_amount * 100), // Convert to kobo
      currency: 'KES',
      ref: transactionId,
      metadata: {
        booking_id: booking.booking_id,
        customer_name: user?.first_name || user?.name || '',
        customer_id: user?.user_id || '',
        vehicle: `${booking.manufacturer} ${booking.model}`,
        total_amount: booking.total_amount,
        booking_status: 'Pending'
      },
      callback,
      onClose: onCloseCallback,
    };

    // Add mobile money config for M-Pesa
    if (paymentMethod === 'mpesa' && phone) {
      config.channels = ['mobile_money'];
      config.mobile_money = {
        phone: formatPhoneNumber(phone),
        provider: 'mpesa'
      };
    }

    return config;
  };

  // Function to initialize Paystack payment
  const initializePaystackPayment = (config: any, loadingToastId: string) => {
    if (window.PaystackPop) {
      try {
        const handler = window.PaystackPop.setup(config);
        handler.openIframe();
      } catch (err) {
        handlePaystackError(err, loadingToastId);
      }
    } else {
      loadPaystackScript(config, loadingToastId);
    }
  };

  // Function to handle Paystack errors
  const handlePaystackError = (err: any, loadingToastId: string) => {
    console.error('Paystack error:', err);
    toast.dismiss(loadingToastId);
    toast.error('Payment Failed', {
      description: 'Failed to initialize payment. Please try again.',
      duration: 4000,
    });
    setError('Failed to initialize payment. Please try again.');
    setIsLoading(false);
  };

  // Function to load Paystack script
  const loadPaystackScript = (config: any, loadingToastId: string) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      if (window.PaystackPop) {
        try {
          const handler = window.PaystackPop.setup(config);
          handler.openIframe();
        } catch (err) {
          handlePaystackError(err, loadingToastId);
        }
      } else {
        handleScriptLoadError(loadingToastId);
      }
    };
    
    script.onerror = () => {
      handleScriptLoadError(loadingToastId);
    };
    
    document.head.appendChild(script);
  };

  // Function to handle script load errors
  const handleScriptLoadError = (loadingToastId: string) => {
    toast.dismiss(loadingToastId);
    toast.error('Connection Error', {
      description: 'Failed to load payment service. Please check your internet.',
      duration: 4000,
    });
    setError('Failed to load payment service. Please check your internet.');
    setIsLoading(false);
  };

  // Main payment handler function
  const handlePayNow = () => {
    if (!validatePaymentInput()) return;

    setError(null);
    setIsLoading(true);

    // Show loading toast
    const loadingToast = toast.loading('Initializing payment...');

    // Create transaction ID
    const transactionId = generateTransactionId();
    
    // Define payment callback function
    const paymentCallback = (response: any) => {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.log('Payment successful! Response:', response);
      
      // Show immediate success toast
      toast.success('Payment completed! Processing...', {
        description: 'Your payment was successful. Updating records...',
        duration: 3000,
      });
      
      // Process payment in background
      processPaymentTransaction(response, transactionId);
    };

    // Define payment onClose function
    const paymentOnClose = () => {
      console.log('Payment modal closed by user');
      toast.dismiss(loadingToast);
      
      // Only show cancellation toast if not loading (user actively closed)
      if (!isLoading) {
        toast.info('Payment cancelled', {
          description: 'You closed the payment window',
          duration: 3000,
        });
      }
      
      setIsLoading(false);
    };

    // Create Paystack configuration
    const paystackConfig = createPaystackConfig(transactionId, paymentCallback, paymentOnClose);

    // Initialize Paystack payment
    initializePaystackPayment(paystackConfig, loadingToast as any);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
            >
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-700">Booking Summary</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{booking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className="font-medium text-yellow-600">Pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <span className="font-medium">{booking.manufacturer} {booking.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    KES {booking.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('mpesa')}
                disabled={isLoading}
                className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center ${
                  paymentMethod === 'mpesa'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-2xl mb-2">📱</span>
                <span className="font-medium">M-Pesa</span>
                <span className="text-xs text-gray-500 mt-1">Mobile Money</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('card')}
                disabled={isLoading}
                className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-2xl mb-2">💳</span>
                <span className="font-medium">Card</span>
                <span className="text-xs text-gray-500 mt-1">Credit/Debit</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'mpesa' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter test number: 0718964629 for testing
              </p>
            </div>
          )}

          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-1">Payment Process:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal pl-4">
              <li>Click "Pay Now" button</li>
              <li>Paystack payment window will open</li>
              <li>Complete the payment process</li>
              <li><strong>Payment will be recorded in database</strong></li>
              <li><strong>Booking status will update from "Pending" to "Paid"</strong></li>
              <li>Modal will close automatically</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePayNow}
              disabled={isLoading || (paymentMethod === 'mpesa' && !phone)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                isLoading || (paymentMethod === 'mpesa' && !phone)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackPaymentModal;