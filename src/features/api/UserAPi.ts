// usersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { User, UserFormValues } from '../../types/Types'
import { apiDomain } from '../../ApiDomain/apiDomain'

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: apiDomain }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({

    // Fetch all Users
    getAllUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['Users'],
    }),

    // Get user by id
    getUserById: builder.query<User, number>({
      query: (user_id) => `users/${user_id}`,
      providesTags: ['Users'],
    }),

    // Create new user
    createUser: builder.mutation<{ message: string }, UserFormValues>({
      query: (userData) => ({
        url: 'users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),

    // Update user details
    updateUserDetails: builder.mutation<{ message: string }, { user_id: number } & Partial<Omit<User, 'user_id' | 'created_at'>>>({
      query: ({ user_id, ...updateUser }) => ({
        url: `users/${user_id}`,
        method: 'PUT',
        body: updateUser,
      }),
      invalidatesTags: ['Users'],
    }),

    // Update user role
    updateUserRole: builder.mutation<{ message: string }, { user_id: number; role: 'user' | 'admin' }>({
      query: ({ user_id, ...updateRole }) => ({
        url: `users/${user_id}/role`,
        method: 'PATCH',
        body: updateRole,
      }),
      invalidatesTags: ['Users'],
    }),

    // Delete user
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (user_id) => ({
        url: `users/${user_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
})

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserDetailsMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = usersApi