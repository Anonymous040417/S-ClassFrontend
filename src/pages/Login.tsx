import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast, Toaster } from 'sonner';
import { 
  Car, 
  Eye, 
  EyeOff,
  Shield,
  Award,
  Clock
} from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/footer';
import { AuthApi } from '../features/api/AuthAPi';
import { setCredentials } from '../features/api/slice/AuthSlice';

type LoginFormValues = {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loginUser, { isLoading }] = AuthApi.useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLoginForm: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const response = await loginUser(data).unwrap();

      dispatch(
        setCredentials({
          token: response.token,
          user: response.userInfo
        })
      );

      toast.success("Welcome to S-Class Merchants!");
      navigate('/');
    } catch (error: unknown) {
      const err = error as { data: { error: string } };
      toast.error(err.data.error || "Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" richColors />
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Brand & Features */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <Car className="h-10 w-10 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">S-Class Merchants</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome Back to
              <span className="block text-red-600">Luxury Driving</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Access your premium account and continue your journey with the world's finest luxury vehicles.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Access</h3>
                  <p className="text-gray-600 text-sm">Your account is protected with enterprise-grade security</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Premium Benefits</h3>
                  <p className="text-gray-600 text-sm">Exclusive rates and priority booking access</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Access</h3>
                  <p className="text-gray-600 text-sm">Manage bookings and preferences in one place</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Enter your credentials to access your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(handleLoginForm)}>
              
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...register("email", {
                    required: "Email address is required",
                    pattern: { 
                      value: /^\S+@\S+$/i, 
                      message: "Please enter a valid email address" 
                    }
                  })}
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: { 
                        value: 6, 
                        message: "Password must be at least 6 characters" 
                      }
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                  Remember me
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In to Your Account"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to S-Class?</span>
                </div>
              </div>

              {/* Registration Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>

              {/* Home Link */}
              <div className="text-center pt-4">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  ← Back to Homepage
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Login;