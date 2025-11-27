import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import { 
  Car, 
  Eye, 
  EyeOff,
  CheckCircle,
  ShieldCheck,
  Star
} from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/footer';
import { AuthApi } from '../features/api/AuthAPi';

type RegisterFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [registerUser, { isLoading }] = AuthApi.useRegisterMutation();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const password = watch('password');

  const handleRegister: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const response = await registerUser(data).unwrap();
      toast.success("Welcome to S-Class Merchants! Your premium account has been created.");
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" richColors />
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Registration Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Car className="h-8 w-8 text-red-600" />
                <span className="text-2xl font-bold text-gray-900">Join S-Class</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Begin your luxury driving experience today</p>
            </div>

            <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
              
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    {...register('first_name', { 
                      required: 'First name is required', 
                      minLength: { 
                        value: 2, 
                        message: 'First name must be at least 2 characters' 
                      } 
                    })}
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                  />
                  {errors.first_name && (
                    <p className="text-red-600 text-sm mt-2">{errors.first_name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    {...register('last_name', { 
                      required: 'Last name is required', 
                      minLength: { 
                        value: 2, 
                        message: 'Last name must be at least 2 characters' 
                      } 
                    })}
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                  />
                  {errors.last_name && (
                    <p className="text-red-600 text-sm mt-2">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email', { 
                    required: 'Email is required', 
                    pattern: { 
                      value: /^\S+@\S+$/i, 
                      message: 'Please enter a valid email address' 
                    } 
                  })}
                  type="email"
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-2">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('phone_number', { 
                    required: 'Phone number is required', 
                    minLength: { 
                      value: 10, 
                      message: 'Phone number must be at least 10 digits' 
                    } 
                  })}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                />
                {errors.phone_number && (
                  <p className="text-red-600 text-sm mt-2">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', { 
                      required: 'Password is required', 
                      minLength: { 
                        value: 6, 
                        message: 'Password must be at least 6 characters' 
                      } 
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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
                  <p className="text-red-600 text-sm mt-2">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => 
                        value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl bg-white text-gray-900 transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-2">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-red-600 hover:text-red-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-red-600 hover:text-red-700 font-medium">
                    Privacy Policy
                  </Link>
                </label>
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
                    Creating Account...
                  </div>
                ) : (
                  "Create Premium Account"
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Right Side - Benefits */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Join the
              <span className="block text-red-600">S-Class Experience</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Create your account and unlock exclusive access to our premium luxury vehicle collection with personalized service.
            </p>

            {/* Benefits List */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Priority Booking Access</h3>
                  <p className="text-gray-600">Be the first to reserve new arrivals and limited editions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Exclusive Member Rates</h3>
                  <p className="text-gray-600">Special pricing and packages available only to registered members</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Personalized Concierge</h3>
                  <p className="text-gray-600">Dedicated support and customized rental experiences</p>
                </div>
              </div>
            </div>

            {/* Home Link */}
            <div className="mt-8">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;