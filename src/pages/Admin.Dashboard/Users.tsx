import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'
import { usersApi } from '../../features/api/UserAPi'
import type { User } from '../../types/Types'
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout'

// Define API response types
interface ApiResponseArray extends Array<User> {}
interface ApiResponseWithData {
  data: User[]
}
interface ApiResponseWithUsers {
  users: User[]
}
interface ApiResponseWithSuccess {
  success: boolean
  data: User[]
}
type ApiResponse = ApiResponseArray | ApiResponseWithData | ApiResponseWithUsers | ApiResponseWithSuccess | undefined

const AdminUsersPage: React.FC = () => {
  const { data: apiResponse, isLoading, error, refetch } = usersApi.useGetAllUsersQuery()
  const [updateUserRole] = usersApi.useUpdateUserRoleMutation()
  const [deleteUser] = usersApi.useDeleteUserMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  // Type-safe function to extract users from API response
  const extractUsersFromResponse = (response: ApiResponse): User[] => {
    if (!response) return []
    
    // Handle array response
    if (Array.isArray(response)) {
      return response
    }
    
    // Handle object response with data array
    if ('data' in response && Array.isArray(response.data)) {
      return response.data
    }
    
    // Handle object response with users array
    if ('users' in response && Array.isArray(response.users)) {
      return response.users
    }
    
    // Handle object response with success and data
    if ('success' in response && response.success && 'data' in response && Array.isArray(response.data)) {
      return response.data
    }
    
    console.warn('Unexpected API response structure:', response)
    return []
  }

  // Safely extract users from API response
  useEffect(() => {
    const extractedUsers = extractUsersFromResponse(apiResponse as ApiResponse)
    setUsers(extractedUsers)
  }, [apiResponse])

  // Debug the API response structure
  useEffect(() => {
    if (apiResponse) {
      console.log('API Response:', apiResponse)
      console.log('Extracted Users:', users)
    }
  }, [apiResponse, users])

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.contact_phone && user.contact_phone.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (user: User, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole({ 
        user_id: user.user_id, 
        role: newRole 
      }).unwrap()
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser(userToDelete.user_id).unwrap()
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openDeleteModal = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  // Calculate stats safely
  const totalUsers = users.length
  const regularUsers = users.filter(u => u.role === 'user').length
  const adminUsers = users.filter(u => u.role === 'admin').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Failed to load users
        </div>
        <button 
          onClick={refetch}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
   
    <div className="space-y-6">
       <AdminDashboardLayout>
           {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all registered users and their permissions
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalUsers}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Regular Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {regularUsers}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <ShieldOff className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Administrators</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {adminUsers}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-lg font-medium">No users found</div>
                    <p className="text-gray-400 mt-1">
                      {searchTerm || roleFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'No users have been registered yet'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.user_id} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{user.email}</span>
                        </div>
                        {user.contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{user.contact_phone}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 truncate max-w-xs">{user.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as 'user' | 'admin')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border-purple-200' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                       
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                Are you sure you want to delete {userToDelete.first_name} {userToDelete.last_name}?
              </p>
              <p className="text-red-600 text-sm mt-1">
                All user data and associated bookings will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setUserToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h4>
                  <p className="text-gray-500">User ID: {selectedUser.user_id}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">Contact Information</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedUser.email}</span>
                  </div>
                  {selectedUser.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedUser.contact_phone}</span>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedUser.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">Account Information</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser, e.target.value as 'user' | 'admin')}
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        selectedUser.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
            
                <button
                  onClick={() => {
                    setUserToDelete(selectedUser)
                    setIsDeleteModalOpen(true)
                    setSelectedUser(null)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </AdminDashboardLayout>
   
    </div>
  )
}

export default AdminUsersPage