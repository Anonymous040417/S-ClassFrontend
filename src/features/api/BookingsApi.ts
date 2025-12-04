import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Booking } from '../../types/Types'
import { apiDomain } from '../../ApiDomain/apiDomain'

export const BookingApi = createApi({
    reducerPath: 'BookingApi',
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
    tagTypes: ['booking'],
    endpoints: (builder) => ({
        // Fetch all bookings
        getAllBookings: builder.query<Booking[], void>({
            query: () => '/bookings',
            providesTags: ['booking'],
        }),

        // Get booking by id
        getBookingById: builder.query<Booking, { booking_id: string | number }>({
            query: ({ booking_id }) => `/bookings/${booking_id}`,
            providesTags: ['booking'],
        }),

        // Get bookings by user id
        getUserBookings: builder.query<Booking[], { user_id:  number }>({
            query: ({ user_id }) => `/bookings/user/${user_id}`,
            providesTags: ['booking'],
        }),

        // Create new booking
        createNewBooking: builder.mutation<{ message: string }, Partial<Omit<Booking, 'booking_id'>>>({
            query: (newBooking) => ({
                url: '/bookings',
                method: 'POST',
                body: newBooking,
            }),
            invalidatesTags: ['booking'],
        }),

        // Update booking status
       updateBookingStatus: builder.mutation({
  query: ({ booking_id, booking_status }) => ({
    url: `/bookings/${booking_id}/status`,
    method: "PUT",
    body: { booking_status },   // MUST MATCH
  }),
}),


        // Cancel booking
        cancelBooking: builder.mutation<{ message: string }, { 
            booking_id: string | number 
        }>({
            query: ({ booking_id }) => ({
                url: `/bookings/${booking_id}/cancel`,
                method: 'PUT',
            }),
            invalidatesTags: ['booking'],
        }),
    }),
})

// Export hooks for usage in components
export const {
    useGetAllBookingsQuery,
    useGetBookingByIdQuery,
    useGetUserBookingsQuery,
    useCreateNewBookingMutation,
    useUpdateBookingStatusMutation,
    useCancelBookingMutation,
} = BookingApi