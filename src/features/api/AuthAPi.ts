import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { apiDomain } from '../../ApiDomain/apiDomain';
import type { User, UserFormValues } from '../../types/Types';





export const AuthApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl:apiDomain }),
    endpoints: (builder) => ({

        // User Login
        login: builder.mutation<{ token: string; userInfo: User }, Partial<Omit<UserFormValues,'first_name'>>>({
            query: (credentials) => ({
                url: 'auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        // User Registration
        register: builder.mutation<{ message: string }, UserFormValues>({  
            query: (userInfo) => ({
                url: 'auth/register',
                method: 'POST',
                body: userInfo,
            }),
        }),
    }),
})