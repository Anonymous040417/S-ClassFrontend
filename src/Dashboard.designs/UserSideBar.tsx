import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux' // Added useDispatch
import { 
  CreditCard, 
  Calendar, 
  Receipt, 
  User as UserIcon,
  Home,
  Car,
  Loader2,
  AlertCircle,
  LogOut as LogoutIcon // Renamed to avoid conflict
} from 'lucide-react'
import { skipToken } from '@reduxjs/toolkit/query'

// Import the API hook and types
import { useGetUserByIdQuery } from '../features/api/UserAPi'
import type { RootState } from '../store/store'
import { clearCredentials } from '../features/api/slice/AuthSlice' // Import clearCredentials action

const UserSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch() // Initialize dispatch
  
  // Get the logged-in user from Redux auth state
  const { user: authUser, isAuthenticated } = useSelector((state: RootState) => state.authSlice);
  
  // Fetch fresh user details using the API with proper TypeScript handling
  const { 
    data: userData, 
    isLoading, 
    isError,
    error 
  } = useGetUserByIdQuery(
    // Use skipToken when user_id is undefined to skip the query
    authUser?.user_id !== undefined ? authUser.user_id : skipToken,
    {
      skip: !authUser?.user_id || !isAuthenticated,
      refetchOnMountOrArgChange: true
    }
  );

  // Helper functions to get user information safely
  const getUserInitials = () => {
    // Try API data first, then fallback to auth data
    const firstName = userData?.first_name || authUser?.first_name;
    const lastName = userData?.last_name || authUser?.last_name;
    
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || 'U';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    
    return firstInitial + lastInitial;
  };

  const getFullName = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    if (authUser?.first_name && authUser?.last_name) {
      return `${authUser.first_name} ${authUser.last_name}`;
    }
    return 'User';
  };

  const getEmail = () => {
    return userData?.email || authUser?.email || 'user@example.com';
  };

  const getUserRole = () => {
    return userData?.role || authUser?.user_type || 'customer';
  };

  const handleLogout = () => {
    // Clear credentials from Redux store
    dispatch(clearCredentials());
    
    // Clear any stored tokens from localStorage (if you're storing them)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/login');
    
    // Optional: Show logout message
    alert('You have been logged out successfully.');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/user/dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      name: 'Bookings',
      path: '/user/bookings',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      name: 'Payments',
      path: '/user/payments',
      icon: <CreditCard className="w-5 h-5" />
    },
   
    {
      name: 'Profile',
      path: '/user/profile',
      icon: <UserIcon className="w-5 h-5" />
    }
  ];
  
  const isActive = (path: string) => location.pathname === path;

  // If not authenticated, show minimal sidebar
  if (!isAuthenticated) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Guest User</h2>
              <p className="text-sm text-gray-500">Please log in</p>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Sign in to access your dashboard
            </p>
            <Link
              to="/login"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium text-center block hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </aside>
    );
  }

  // Loading State - Only show loading if we have a user_id and the query is running
  if (isLoading && authUser?.user_id) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading profile...</p>
      </aside>
    );
  }

  // If no user ID in auth state but authenticated (edge case)
  if (isAuthenticated && !authUser?.user_id) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">User Profile</h2>
              <p className="text-sm text-red-500">Missing user information</p>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
            <p className="text-sm text-red-700">
              Unable to load profile. Please log out and log in again.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
          >
            <LogoutIcon className="w-4 h-4" />
            Sign Out
          </button>
        </nav>
      </aside>
    );
  }

  // Error State with fallback to auth data
  if (isError) {
    console.error('Failed to fetch user details:', error);
    
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
        {/* User Info Section with fallback to auth data */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {getUserInitials()}
              </span>
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-gray-900 truncate">
                {getFullName()}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {getEmail()}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                getUserRole() === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getUserRole()}
              </span>
            </div>
          </div>
          
          {/* Error warning */}
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center text-yellow-800 text-xs">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>Profile sync incomplete</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <span className={`mr-3 ${
                isActive(item.path) ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}

          {/* Quick Action - Book a Car */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <Car className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Need a car?</span>
            </div>
            <Link
              to="/ourcars"
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium text-center block hover:bg-blue-700 transition-colors"
            >
              Book Now
            </Link>
          </div>

          {/* Logout button */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
            >
              <LogoutIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </nav>
      </aside>
    );
  }

  // Success State - Full user data available
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      {/* User Info Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">
              {getUserInitials()}
            </span>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-semibold text-gray-900 truncate" title={getFullName()}>
              {getFullName()}
            </h2>
            <p className="text-sm text-gray-500 truncate" title={getEmail()}>
              {getEmail()}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
              getUserRole() === 'admin' 
                ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200' 
                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
            }`}>
              {getUserRole().toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-l-4 hover:border-blue-200'
            }`}
          >
            <span className={`mr-3 transition-colors ${
              isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
            }`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}

        {/* Quick Action - Book a Car */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-blue-900">Ready to drive?</span>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            Browse our premium fleet and book instantly
          </p>
          <Link
            to="/ourcars"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold text-center block hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Book a Car
          </Link>
        </div>

        {/* Logout option */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
          >
            <LogoutIcon className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;