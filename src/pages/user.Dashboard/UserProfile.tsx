import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import {
  User as UserIcon,
  MapPin,
  Shield,
  Edit,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  Calendar,
  Settings,
  LogOut,
  BadgeCheck,
  Loader2,
  AlertCircle,
  UserCog
} from 'lucide-react'
import { format } from 'date-fns'
import { skipToken } from '@reduxjs/toolkit/query'

// --- Imports (Adjust paths to match your project structure) ---
import DashboardLayout from '../../Dashboard.designs/DashboardLayout'
import type { RootState } from '../../store/store'
import { useGetUserByIdQuery, useUpdateUserDetailsMutation } from '../../features/api/UserAPi'
import { clearCredentials } from '../../features/api/slice/AuthSlice'
import type {  UserFormValues } from '../../types/Types'

// Form data interface that matches what we'll update


const UserProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Get logged-in user from Redux auth state
  const { user: authUser, isAuthenticated } = useSelector((state: RootState) => state.authSlice);
  
  // Debug log to check what's in authUser
  console.log('Auth User:', authUser);
  console.log('Auth User ID:', authUser?.user_id);

  // Fetch user details from API using the user_id from auth state
  const { 
    data: userData, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserByIdQuery(
    authUser?.user_id ? authUser.user_id : skipToken,
    {
      refetchOnMountOrArgChange: true,
      skip: !authUser?.user_id // Skip if no user_id
    }
  );

  // Debug log to check API response
  console.log('User Data from API:', userData);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  // Update mutation hook
  const [updateUserDetails, { isLoading: isUpdating }] = useUpdateUserDetailsMutation();

  // Local UI State
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue
  } = useForm< UserFormValues>()

  // Populate form when API data arrives
  useEffect(() => {
    if (userData) {
      console.log('Setting form with userData:', userData);
      reset({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        contact_phone: userData.contact_phone || '',
        address: userData.address || '',
      });
    }
  }, [userData, reset]);

  // Handle Form Submit
  const onSubmit = async (formData:  UserFormValues) => {
    if (!authUser?.user_id) {
      alert('User not authenticated');
      return;
    }

    try {
      // Construct payload matching the API requirement
      const payload = {
        user_id: authUser.user_id,
        ...formData
      }

      console.log('Submitting update with payload:', payload);

      const result = await updateUserDetails(payload).unwrap();
      console.log('Update result:', result);

      alert(`Success: ${result.message || 'Profile updated successfully!'}`);
      setIsEditing(false);
      
      // Refetch the updated data
      refetch();
    } catch (err: any) {
      console.error('Update failed:', err);
      alert(`Failed to update: ${err?.data?.message || 'Unknown error. Please try again.'}`);
    }
  }

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  }

  // Format Date Helper
  const formatDateDisplay = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  }

  // Get user role from either userData or authUser
  const getUserRole = () => {
    if (userData?.role) return userData.role;
    if (authUser?.user_type) return authUser.user_type;
    return 'customer';
  }

  // Get user initials safely
  const getUserInitials = () => {
    const firstInitial = userData?.first_name?.charAt(0)?.toUpperCase() || 
                       authUser?.first_name?.charAt(0)?.toUpperCase() || 
                       'U';
    const lastInitial = userData?.last_name?.charAt(0)?.toUpperCase() || 
                      authUser?.last_name?.charAt(0)?.toUpperCase() || 
                      '';
    return firstInitial + lastInitial;
  }

  // Get user full name
  const getFullName = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    if (authUser?.first_name && authUser?.last_name) {
      return `${authUser.first_name} ${authUser.last_name}`;
    }
    return 'User';
  }

  // Get user email
  const getEmail = () => {
    return userData?.email || authUser?.email || 'No email provided';
  }

  // Get user ID to display
  const getUserId = () => {
    return userData?.user_id || authUser?.user_id || 'N/A';
  }

  // Get created date
  const getCreatedDate = () => {
    return userData?.created_at ;
  }

  // Image upload placeholder
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original data
    if (userData) {
      reset({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        contact_phone: userData.contact_phone || '',
        address: userData.address || '',
      });
    }
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <UserCog className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-500">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --- Error State ---
  if (error) {
    const errorMessage = (error as any)?.data?.message || 
                        (error as any)?.message || 
                        "Could not fetch user details.";
    
    // If error is because user doesn't exist in API, fallback to auth data
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return (
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">Using cached authentication data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Stats & Navigation */}
              <div className="lg:col-span-1 space-y-6">
                {/* User Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                        <div className="flex items-center justify-center w-full h-full bg-blue-600 text-white text-4xl font-bold">
                          {getUserInitials()}
                        </div>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 text-center">
                      {getFullName()}
                    </h2>
                    <p className="text-gray-600 text-sm">{getEmail()}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="capitalize">{getUserRole()}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">User ID</span>
                      <span className="font-mono text-gray-900 text-sm">#{getUserId()}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Personal Information</span>
                  </button>
                  
                  <div className="p-4 border-t border-gray-100 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-2">
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Limited Profile Data</h4>
                          <p className="text-yellow-700 text-sm mt-1">
                            Full profile details are not available. Please contact support to complete your profile setup.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={authUser?.first_name || 'Not available'}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={authUser?.last_name || 'Not available'}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input
                            type="text"
                            value={authUser?.email || 'Not available'}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    // Other errors
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mt-10 mx-auto max-w-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => refetch()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main content - when we have userData
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isUpdating || !isDirty}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* User Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-blue-600 text-white text-4xl font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  {getFullName()}
                </h2>
                <p className="text-gray-600 text-sm">{getEmail()}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="capitalize">{getUserRole()}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Joined</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {formatDateDisplay(getCreatedDate())}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">User ID</span>
                  <span className="font-mono text-gray-900 text-sm">#{getUserId()}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Personal Information</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Security & Settings</span>
              </button>
              
              <div className="p-4 border-t border-gray-100 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Personal Details
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('first_name', { 
                            required: "First name is required",
                            minLength: {
                              value: 2,
                              message: "First name must be at least 2 characters"
                            }
                          })}
                          disabled={!isEditing}
                          className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('last_name', { 
                            required: "Last name is required",
                            minLength: {
                              value: 2,
                              message: "Last name must be at least 2 characters"
                            }
                          })}
                          disabled={!isEditing}
                          className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          {...register('email', { 
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address"
                            }
                          })}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          {...register('contact_phone', {
                            pattern: {
                              value: /^[\+]?[1-9][\d]{0,15}$/,
                              message: "Invalid phone number"
                            }
                          })}
                          disabled={!isEditing}
                          placeholder="+254..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone.message}</p>}
                    </div>

                    {/* Joined Date (Read Only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formatDateDisplay(getCreatedDate())}
                          disabled
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          rows={3}
                          {...register('address')}
                          disabled={!isEditing}
                          placeholder="Your residential address..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && isDirty && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          You have unsaved changes. Click "Save Changes" to update your profile.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Security & Settings
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Account Security</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      For security reasons, password changes must be requested through the administrator.
                    </p>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Change Password (Contact Admin)
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Enhance your account security with two-factor authentication.
                    </p>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Enable 2FA (Coming Soon)
                    </button>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
                    <p className="text-red-700 text-sm mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      disabled
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Account (Contact Admin)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UserProfilePage