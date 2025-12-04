// adminApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { 
  DashboardStats, 
  AnalyticsData, 
  User, 
  Vehicle, 
  Booking, 
  SupportTicket 
} from '../../types/Types'
import { apiDomain } from '../../ApiDomain/apiDomain'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: apiDomain,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  tagTypes: ['Dashboard', 'Users', 'Vehicles', 'Bookings', 'SupportTickets'],
  endpoints: (builder) => ({

    // ==================== DASHBOARD ENDPOINTS ====================
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => 'admin/dashboard/stats',
      providesTags: ['Dashboard'],
    }),

    getAnalytics: builder.query<AnalyticsData, void>({
      query: () => 'admin/dashboard/analytics',
      providesTags: ['Dashboard'],
    }),

    // ==================== USER MANAGEMENT ENDPOINTS ====================
    getAllUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['Users'],
    }),

    updateUserRole: builder.mutation<{ message: string }, { 
      user_id: number; 
      role: 'user' | 'admin';
    }>({
      query: ({ user_id, ...roleData }) => ({
        url: `admin/users/${user_id}`,
        method: 'PUT',
        body: roleData,
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation<{ message: string }, number>({
      query: (user_id) => ({
        url: `admin/users/${user_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // ==================== VEHICLE MANAGEMENT ENDPOINTS ====================
    getAllVehicles: builder.query<Vehicle[], void>({
      query: () => 'vehicles',
      providesTags: ['Vehicles'],
    }),

    deleteVehicle: builder.mutation<{ message: string }, number>({
      query: (vehicle_id) => ({
        url: `admin/vehicles/${vehicle_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicles'],
    }),

    // ==================== BOOKING MANAGEMENT ENDPOINTS ====================
    getAllBookings: builder.query<Booking[], void>({
      query: () => 'admin/bookings',
      providesTags: ['Bookings'],
    }),

    updateBookingStatus: builder.mutation<{ message: string }, { 
      booking_id: number; 
      booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
    }>({
      query: ({ booking_id, ...statusData }) => ({
        url: `admin/bookings/${booking_id}/status`,
        method: 'PUT',
        body: statusData,
      }),
      invalidatesTags: ['Bookings'],
    }),

    // ==================== SUPPORT MANAGEMENT ENDPOINTS ====================
    getAllSupportTickets: builder.query<SupportTicket[], void>({
      query: () => 'admin/support/tickets',
      providesTags: ['SupportTickets'],
    }),

    updateSupportTicketStatus: builder.mutation<{ message: string }, { 
      ticket_id: number; 
      status: 'open' | 'in_progress' | 'resolved' | 'closed';
    }>({
      query: ({ ticket_id, ...statusData }) => ({
        url: `admin/support/tickets/${ticket_id}/status`,
        method: 'PUT',
        body: statusData,
      }),
      invalidatesTags: ['SupportTickets'],
    }),

  }),
})

// Export all hooks in one object
export const {
  // Dashboard hooks
  useGetDashboardStatsQuery,
  useGetAnalyticsQuery,
  
  // User management hooks
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  
  // Vehicle management hooks
  useGetAllVehiclesQuery,
  useDeleteVehicleMutation,
  
  // Booking management hooks
  useGetAllBookingsQuery,
  useUpdateBookingStatusMutation,
  
  // Support management hooks
  useGetAllSupportTicketsQuery,
  useUpdateSupportTicketStatusMutation,
} = adminApi