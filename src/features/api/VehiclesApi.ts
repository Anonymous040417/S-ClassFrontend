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
    tagTypes: ['vehicle'],
    endpoints: (builder) => ({
        // Fetch all vehicle Items
        getAllvehicle: builder.query<Vehicle[], void>({
            query: () => 'vehicles',
            providesTags: ['vehicle'], 
        }),

        // Get vehicle item by id
        getvehicleById: builder.query<Vehicle, {vehicle_item_id: number}>({
            query: (vehicle_item_id) => `/vehicles/${vehicle_item_id}`,
            providesTags: ['vehicle'],
        }),

        // Add new vehicle item
        addvehicle: builder.mutation<{ message: string }, Partial<Omit<Vehicle, 'vehicle_item_id'>>>({
            query: (newItem) => ({
                url: '/vehicles',
                method: 'POST',
                body: newItem,
            }),
            invalidatesTags: ['vehicle'],
        }),

        // Update vehicle item
        updatevehicle: builder.mutation<{ message: string }, { vehicle_item_id: number } & Partial<Omit<Vehicle, 'vehicle_item_id'>>>({
            query: ({ vehicle_item_id, ...updatedItem }) => ({
                url: `/vehicles/${vehicle_item_id}`,
                method: 'PUT',
                body: updatedItem,
            }),
            invalidatesTags: ['vehicle'],
        }),

        // Delete vehicle item
        deletevehicleItem: builder.mutation<{ message: string }, {vehicle_item_id: number}>({
            query: (vehicle_item_id) => ({
                url: `/vehicles/${vehicle_item_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['vehicle'],
        }),
    }),
});

// Export hooks for usage in components
export const {
  useGetAllvehicleQuery,
  useGetvehicleByIdQuery,
  useAddvehicleMutation,
  useUpdatevehicleMutation,
  useDeletevehicleItemMutation,
} = VehicleApi;