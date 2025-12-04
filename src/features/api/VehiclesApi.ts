import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Vehicle } from '../../types/Types';
import { apiDomain } from '../../ApiDomain/apiDomain';

export const VehicleApi = createApi({
    reducerPath: 'VehicleApi',
    baseQuery: fetchBaseQuery({
        baseUrl: apiDomain,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as any).authSlice?.token;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['Vehicle', 'VehicleSpec'],
    endpoints: (builder) => ({
        // Fetch all vehicles
        getAllVehicles: builder.query<Vehicle[], void>({
            query: () => 'vehicles',
            providesTags: ['Vehicle']
        }),

        // Get vehicle by id
        getVehicleById: builder.query<Vehicle, {vehicle_id: number}>({
            query: (vehicle_id) => `/vehicles/${vehicle_id}`,
            providesTags: ['Vehicle']
        }),

        // POST: Create Vehicle Specification (Step 1)
        createVehicleSpec: builder.mutation<{ 
          message: string;
          data: { 
            vehicle_spec_id: number;
            manufacturer: string;
            model: string;
            model_year: number;
            category?: string;
          } 
        }, {
          manufacturer: string;
          model: string;
          model_year: number;
          fuel_type: string;
          seating_capacity: number;
          engine_capacity?: number;
          transmission?: 'manual' | 'automatic' | 'PDK';
          color?: string;
          category?: 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric' | 'Coupe';
          features?: string;
          horse_power?: number;
          drive_type?: string;
        }>({
          query: (body) => ({
            url: '/vehicle-specs',
            method: 'POST',
            body,
          }),
          invalidatesTags: ['VehicleSpec'],
        }),

        // POST: Create Vehicle Inventory (Step 2)
        addVehicle: builder.mutation<Vehicle, {
          vehicle_spec_id: number;
          rental_rate: number;
          price?: number;
          location: string;
          availability?: boolean;
          license_plate: string;
          mileage?: number;
          insurance_provider?: string;
          insurance_expiry?: string;
          rating?: number;
          review_count?: number;
          vehicle_image?: string;
        }>({
          query: (body) => ({
            url: '/vehicles',
            method: 'POST',
            body,
          }),
          invalidatesTags: ['Vehicle'],
        }),

        // Update vehicle
        updateVehicle: builder.mutation<{ message: string }, {
          vehicle_id: number;
          rental_rate?: number;
          price?: number;
          location?: string;
          availability?: boolean;
          vehicle_image?: string;
          license_plate?: string;
          mileage?: number;
        }>({
            query: ({ vehicle_id, ...updatedItem }) => ({
                url: `/vehicles/${vehicle_id}`,
                method: 'PUT',
                body: updatedItem
            }),
            invalidatesTags: ['Vehicle'],
        }),

        // Delete vehicle
        deleteVehicle: builder.mutation<{ message: string }, {vehicle_id: number}>({
            query: ({vehicle_id}) => ({
                url: `/vehicles/${vehicle_id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Vehicle']
        })
    })
})

// Export hooks for usage in components
export const {
  useGetAllVehiclesQuery,
  useGetVehicleByIdQuery,   
  useAddVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useCreateVehicleSpecMutation,
} = VehicleApi;