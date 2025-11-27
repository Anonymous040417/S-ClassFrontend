import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { clearCredentials } from '../features/api/slice/AuthSlice';
import { ChevronDown, LogOut, User} from 'lucide-react';

const NavBar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const { isAuthenticated, user } = useSelector((state: RootState) => state.authSlice);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate("/login");
    setIsProfileDropdownOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/ourcars", label: "Our Cars" },
    { path: "/about", label: "About us" },
  ];

  return (
    <div className="navbar bg-white shadow-md sticky top-0 z-50 py-4">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={-1}
            className="menu menu-sm dropdown-content bg-white rounded-lg z-10 mt-3 w-52 p-2 shadow-lg border">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <li>
                  <a className="text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    {item.label}
                  </a>
                </li>
              </Link>
            ))}
            {!isAuthenticated ? (
              <Link to="/register">
                <li>
                  <a className="text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    Register
                  </a>
                </li>
              </Link>
            ) : (
              <Link to="/dashboard">
                <li>
                  <a className="text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    Dashboard
                  </a>
                </li>
              </Link>
            )}
          </ul>
        </div>
        <a className="btn btn-ghost text-xl font-semibold text-red-600 hover:bg-transparent">S-Class Merchants</a>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <li>
                <a className="text-gray-600 hover:text-red-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-md transition-all duration-300">
                  {item.label}
                </a>
              </li>
            </Link>
          ))}
          {!isAuthenticated ? (
            <Link to="/register">
              <li>
                <a className="text-gray-600 hover:text-red-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-md transition-all duration-300">
                  Register
                </a>
              </li>
            </Link>
          ) : (
            <Link to="/dashboard">
              <li>
                <a className="text-gray-600 hover:text-red-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-md transition-all duration-300">
                  Dashboard
                </a>
              </li>
            </Link>
          )}
        </ul>
      </div>
      
      <div className="navbar-end">
        {!isAuthenticated ? (
          <Link to='/login'>
            <a className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 px-6 py-2 font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              Login
            </a>
          </Link>
        ) : (
          <div className="dropdown dropdown-end">
            <button 
              className="btn btn-ghost flex items-center gap-2"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700">Hey, {user?.first_name}</span>
                <ChevronDown className="w-4 h-4 text-red-600" />
              </div>
            </button>
            
            {isProfileDropdownOpen && (
              <ul className="dropdown-content bg-white rounded-box z-50 mt-3 w-64 p-2 shadow-lg border">
                <li className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </li>
                
                <li>
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    {/* <Dashboard className="w-4 h-4" /> */}
                    <span>Dashboard</span>
                  </Link>
                </li>
                
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-md transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Overlay for dropdown */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  )
}

export default NavBar;