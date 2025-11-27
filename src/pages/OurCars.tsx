import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { 
  Search, 
  Star,
  Users,
  Car,
  Fuel,
  Gauge,
  MapPin,
  Heart,
  Loader,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import type { RootState } from '../store/store';
import { 
  useGetAllvehicleQuery
} from '../features/api/VehiclesApi';
import { 
  useCreateNewBookingMutation 
} from '../features/api/BookingsApi';
import type { Vehicle } from '../types/Types';
import type { CreateBookingRequest } from '../types/Types';
import NavBar from "../components/NavBar"

const OurCars: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.authSlice);
  
  // Fetch vehicles from API
  const { 
    data: apiResponse,
    isLoading, 
    error,
    refetch 
  } = useGetAllvehicleQuery();

  // Booking mutation
  const [createBooking, { 
    isLoading: isBookingLoading, 
    isSuccess: isBookingSuccess,
    error: bookingError,
    reset: resetBooking 
  }] = useCreateNewBookingMutation();

  // State for filtered cars
  const [filteredCars, setFilteredCars] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [priceRange, setPriceRange] = useState(1000);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Vehicle | null>(null);
  const [bookingDates, setBookingDates] = useState({
    startDate: '',
    endDate: '',
    duration: 1
  });
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Get unique categories and brands from API data
  const categories = ['All', ...new Set(
    apiResponse?.filter((v: Vehicle) => v.category)
      .map((v: Vehicle) => v.category) || []
  )];
  
  const brands = ['All', ...new Set(
    apiResponse?.filter((v: Vehicle) => v.manufacturer)
      .map((v: Vehicle) => v.manufacturer) || []
  )];

  // Filter cars based on search and filters
  useEffect(() => {
    if (!apiResponse || apiResponse?.length === 0) {
      setFilteredCars([]);
      return;
    }   

    let filtered = [...apiResponse];

    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(car => car.category === selectedCategory);
    }

    if (selectedBrand !== 'All') {
      filtered = filtered.filter(car => car.manufacturer === selectedBrand);
    }

    filtered = filtered.filter(car => car.price <= priceRange);

    setFilteredCars(filtered);
  }, [apiResponse, searchTerm, selectedCategory, selectedBrand, priceRange]);

  // Reset booking result when modal closes
  useEffect(() => {
    if (!showBookingModal) {
      setBookingResult(null);
      resetBooking();
    }
  }, [showBookingModal, resetBooking]);

  const handleBookCar = (car: Vehicle) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    setSelectedCar(car);
    setShowBookingModal(true);
    setBookingDates({
      startDate: '',
      endDate: '',
      duration: 1
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !user) return;

    try {
      const bookingData: CreateBookingRequest = {
        user_id: user.user_id, // Make sure your user object has user_id
        vehicle_id: selectedCar.vehicle_id,
        booking_date: bookingDates.startDate,
        return_date: bookingDates.endDate,
        total_amount: calculateTotal(),
        booking_status: 'pending' // Default status
      };

      const result = await createBooking(bookingData).unwrap();
      
      setBookingResult({
        success: true,
        message: result.message || `Booking confirmed for ${selectedCar.model}! Our concierge will contact you shortly.`
      });

      // Close modal after 3 seconds on success
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedCar(null);
        setBookingDates({ startDate: '', endDate: '', duration: 1 });
      }, 3000);

    } catch (error) {
      const errorMessage = (error as any)?.data?.message || 
                          (error as any)?.message || 
                          'Failed to create booking. Please try again.';
      
      setBookingResult({
        success: false,
        message: errorMessage
      });
    }
  };

  const calculateTotal = () => {
    if (!selectedCar) return 0;
    return selectedCar.price * bookingDates.duration;
  };

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setBookingDates(prev => {
      const newDates = { ...prev, [field]: value };
      
      // Calculate duration if both dates are set
      if (newDates.startDate && newDates.endDate) {
        newDates.duration = calculateDuration(newDates.startDate, newDates.endDate);
      } else {
        newDates.duration = 1;
      }
      
      return newDates;
    });
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get min return date (day after start date)
  const getMinReturnDate = () => {
    if (!bookingDates.startDate) return getTodayDate();
    const nextDay = new Date(bookingDates.startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Luxury Fleet</h2>
          <p className="text-gray-600">Please wait while we load our premium vehicles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = (error as any)?.data?.message || 
                        (error as any)?.message || 
                        'There was an error loading our vehicle fleet.';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Vehicles</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar/>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Luxury Fleet</h1>
              <p className="text-lg text-gray-600">Choose from our exclusive collection of premium vehicles</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Vehicles</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredCars.filter(car => car.availability).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Vehicles</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {categories.map((category: string) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {brands.map((brand: string) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: Up to ${priceRange}/day
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>$100/day</span>
              <span>$1000/day</span>
            </div>
          </div>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCars.map((car) => (
            <div key={car.vehicle_id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group">
              {/* Image Section */}
              <div className="relative overflow-hidden">
                <img
                  src={car.vehicle_image}
                  alt={car.model}
                  className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {!car.availability && (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Booked
                    </span>
                  )}
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ${car.price}/day
                  </span>
                </div>
                <div className="absolute top-4 left-4 bg-gray-900 text-white px-2 py-1 rounded text-xs font-semibold">
                  {car.manufacturer}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{car.manufacturer} {car.model}</h3>
                  <span className="text-red-600 font-semibold">{car.model_year}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(car.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({car.review_count})</span>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span>{car.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span>{car.transmission}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{car.seating_capacity} seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{car.location}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookCar(car)}
                    disabled={!car.availability}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      car.availability
                        ? 'bg-red-600 hover:bg-red-700 text-white transform hover:-translate-y-1'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {car.availability ? 'Book Now' : 'Not Available'}
                  </button>
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCars.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedBrand('All');
                setPriceRange(1000);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCar && isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Book {selectedCar.manufacturer} {selectedCar.model}</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  disabled={isBookingLoading}
                >
                  ×
                </button>
              </div>

              {/* Booking Result Message */}
              {bookingResult && (
                <div className={`mb-6 p-4 rounded-lg ${
                  bookingResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {bookingResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className={bookingResult.success ? 'text-green-800' : 'text-red-800'}>
                      {bookingResult.message}
                    </p>
                  </div>
                </div>
              )}

              {!bookingResult?.success && (
                <form onSubmit={handleBookingSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Car Details */}
                    <div>
                      <img
                        src={selectedCar.vehicle_image}
                        alt={selectedCar.model}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="text-lg font-semibold mb-2">{selectedCar.manufacturer} {selectedCar.model}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Brand:</span>
                          <span>{selectedCar.manufacturer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span>{selectedCar.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Year:</span>
                          <span>{selectedCar.model_year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Rate:</span>
                          <span className="text-red-600 font-semibold">${selectedCar.price}/day</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Pick-up Date
                        </label>
                        <input
                          type="date"
                          required
                          min={getTodayDate()}
                          value={bookingDates.startDate}
                          onChange={(e) => handleDateChange('startDate', e.target.value)}
                          disabled={isBookingLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Return Date
                        </label>
                        <input
                          type="date"
                          required
                          min={getMinReturnDate()}
                          value={bookingDates.endDate}
                          onChange={(e) => handleDateChange('endDate', e.target.value)}
                          disabled={isBookingLoading || !bookingDates.startDate}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Booking Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Booking Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Daily Rate:</span>
                            <span>${selectedCar.price}/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{bookingDates.duration} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Insurance:</span>
                            <span>Included</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-red-600">${calculateTotal()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isBookingLoading || !bookingDates.startDate || !bookingDates.endDate}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                      >
                        {isBookingLoading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Processing Booking...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OurCars;