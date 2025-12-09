import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Payment } from '../../types/Types'
import { apiDomain } from '../../ApiDomain/apiDomain'

export const PaymentsApi = createApi({
    reducerPath: 'PaymentsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: apiDomain,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as any).authSlice?.token
            if (token) {
                headers.set('Authorization', `Bearer ${token}`)
                headers.set('authorization', `Bearer ${token}`)
            }
            return headers
        }
    }),
    tagTypes: ['payment'],
    endpoints: (builder) => ({
        // Fetch all payments
        getAllPayments: builder.query<Payment[], void>({
            query: () => 'payments',
            providesTags: ['payment'],
        }),

        // Get payment by id
        getPaymentById: builder.query<Payment, { payment_id: string | number }>({
            query: ({ payment_id }) => `/payments/${payment_id}`,
            providesTags: ['payment'],
        }),

        // Get payments by booking id
        getPaymentsByBookingId: builder.query<Payment[], { booking_id: string | number }>({
            query: ({ booking_id }) => `/payments/booking/${booking_id}`,
            providesTags: ['payment'],
        }),

        getPaymentsByUserId: builder.query<Payment[], { user_id: string | number }>({
            query: ({ user_id }) => `/payments/user/${user_id}`,
            providesTags: ['payment'],
        }),

        // Create new payment
        createNewPayment: builder.mutation<{ message: string }, Partial<Omit<Payment, 'payment_id'>>>({
            query: (newPayment) => ({
                url: '/payments',
                method: 'POST',
                body: newPayment,
            }),
            invalidatesTags: ['payment'],
        }),

        // Process Mpesa payment
        processMpesaPayment: builder.mutation<{ message: string }, {
            phone_number: string
            amount: number
            booking_id: number
        }>({
            query: (paymentData) => ({
                url: '/payments/mpesa',
                method: 'POST',
                body: paymentData,
            }),
            invalidatesTags: ['payment'],
        }),

        // FIXED: Update payment status - check what your backend expects
        updatePaymentStatus: builder.mutation<{ message: string }, { 
            payment_id: string | number 
            payment_status: string 
        }>({
            query: ({ payment_id, payment_status }) => {
                // Try different payload formats based on what your backend expects
                const payload = { 
                   payment_status:payment_status
                    // OR try: payment_status: status
                    // OR try: data: { status: status }
                };
                
                console.log('📡 API Request:', {
                    url: `/payments/${payment_id}/status`,
                    method: 'PUT',
                    body: payload
                });

                return {
                    url: `/payments/${payment_id}/status`,
                    method: 'PUT',
                    body: payload,
                };
            },
            invalidatesTags: ['payment'],
        }),
    }),
})

// Export hooks for usage in components
export const {
    useGetAllPaymentsQuery,
    useGetPaymentByIdQuery,
    useGetPaymentsByUserIdQuery,
    useGetPaymentsByBookingIdQuery,
    useCreateNewPaymentMutation,
    useProcessMpesaPaymentMutation,
    useUpdatePaymentStatusMutation,
} = PaymentsApi