import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Calendar, 
  Shield, 
  Users, 
  ArrowRight,
  Play,
  Award,
  Clock,
  Loader,
  AlertCircle
} from 'lucide-react';
import Footer from '../components/footer';
import NavBar from '../components/NavBar';
import { useGetAllVehiclesQuery } from '../features/api/VehiclesApi';

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Fetch Data from API
  const { data: vehicles, isLoading, error } = useGetAllVehiclesQuery();

  // 2. Derive Hero Cars (Top 3 by price) - Calculated directly on render
  const heroCars = vehicles && vehicles.length > 0
    ? [...vehicles].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 3)
    : [];

  // 3. Derive Fleet Cars (First 8) - Calculated directly on render
  const fleetCars = vehicles ? vehicles.slice(0, 8) : [];

  // Slider Logic
  useEffect(() => {
    if (heroCars.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroCars.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroCars.length]);

  // Helper function to safely process features
  const getSafeFeatures = (features: string | string[] | undefined | null) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',');
    return [];
  };

  // Static Features Data
  const staticFeatures = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Fully Insured",
      description: "Comprehensive coverage for complete peace of mind"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Concierge Service",
      description: "Personalized service from booking to return"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Flexible Duration",
      description: "Rent by day, week, or month - your schedule"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Chauffeur Option",
      description: "Professional drivers available upon request"
    }
  ];

  // Showcase Images
  const showcaseImages = {
    heritage: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    craftsmanship: "https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    experience: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    luxury: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Experience...</h2>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="container mx-auto px-6 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load fleet</h2>
          <p className="text-gray-600 mb-6">We're having trouble connecting to our showroom.</p>
          <Link to="/ourcars" className="text-red-600 font-semibold hover:underline">
            Try reloading the page
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar/>
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Slideshow */}
        <div className="absolute inset-0 bg-gray-900">
          {heroCars.length > 0 ? (
            heroCars.map((car, index) => (
              <div
                key={car.vehicle_id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={car.vehicle_image || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80"}
                  alt={`${car.manufacturer} ${car.model}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <h1 className="text-white text-4xl">Welcome to Luxury</h1>
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex items-center h-full">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-px bg-red-600"></div>
                <span className="text-red-600 font-semibold uppercase tracking-wider text-sm">
                  Premium Fleet
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Modern
                <span className="block text-red-600">Luxury</span>
                Redefined
              </h1>
              
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Experience the pinnacle of automotive excellence with our curated collection 
                of the world's most sophisticated modern luxury vehicles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/ourcars" 
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2 group"
                >
                  Explore Fleet
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/about"
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Car Info Panel */}
        {heroCars.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm text-white p-6">
            <div className="container mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-red-600 mb-2">
                    {heroCars[currentSlide].manufacturer} {heroCars[currentSlide].model}
                  </h3>
                  <p className="text-gray-300">{heroCars[currentSlide].category} Class Luxury</p>
                </div>
                
                <div className="text-center lg:text-right">
                  <div className="text-3xl font-bold text-white mb-2">
                    ${heroCars[currentSlide].price}<span className="text-lg font-normal text-gray-400">/day</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {heroCars[currentSlide].location} • {heroCars[currentSlide].model_year} Model
                  </p>
                </div>
                
                {/* HERO BOOKING BUTTON - Redirects to /ourcars */}
                <Link 
                  to="/ourcars"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group"
                >
                  Book Now
                  <Calendar className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Slide Indicators */}
        {heroCars.length > 1 && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
            {heroCars.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-red-600 scale-125' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-1 bg-red-600"></div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Luxury Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unmatched service and attention to detail for your luxury car rental experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {staticFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center group"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Fleet Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-px bg-red-600"></div>
                <span className="text-red-600 font-semibold uppercase tracking-wider text-sm">
                  Premium Selection
                </span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Luxury Fleet
              </h2>
              <p className="text-xl text-gray-600">
                Choose from our exclusive collection of the world's most sophisticated 
                and technologically advanced luxury vehicles.
              </p>
            </div>
            
            <Link 
              to="/ourcars" 
              className="mt-6 lg:mt-0 flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold group"
            >
              View All Vehicles
              <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {fleetCars.map((car) => {
              const safeFeatureList = getSafeFeatures(car.features);

              return (
                <div 
                  key={car.vehicle_id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden h-64 bg-gray-100">
                    <img
                      src={car.vehicle_image || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80"}
                      alt={`${car.manufacturer} ${car.model}`}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ${car.price}/day
                    </div>
                    <div className="absolute top-4 left-4 bg-gray-900 text-white px-2 py-1 rounded text-xs font-semibold uppercase">
                      {car.manufacturer}
                    </div>
                    
                    {!car.availability && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Booked</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {car.manufacturer} {car.model}
                      </h3>
                      <span className="text-red-600 font-semibold">{car.model_year}</span>
                    </div>
                    
                    {/* Features Chips */}
                    <div className="flex flex-wrap gap-2 mb-4 h-16 overflow-hidden">
                      {safeFeatureList.length > 0 ? (
                        safeFeatureList.slice(0, 3).map((feature, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {feature.trim()}
                          </span>
                        ))
                      ) : (
                        <>
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{car.transmission || 'Auto'}</span>
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{car.fuel_type || 'Petrol'}</span>
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{car.category || 'Luxury'}</span>
                        </>
                      )}
                    </div>
                    
                    {/* CARD BOOKING BUTTON - Redirects to /ourcars */}
                    <Link 
                      to="/ourcars"
                      className={`block w-full text-center py-3 rounded-lg font-semibold transition-all duration-300 transform group-hover:-translate-y-1 ${
                          car.availability 
                          ? 'bg-gray-900 hover:bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={(e) => !car.availability && e.preventDefault()}
                    >
                      {car.availability ? 'Book This Vehicle' : 'Currently Unavailable'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          
          {fleetCars.length === 0 && (
             <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No vehicles available at the moment.</p>
             </div>
          )}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Beyond the Wheel</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the innovation, craftsmanship, and luxury behind each premium vehicle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(showcaseImages).map(([key, src]) => (
                <div key={key} className="group relative overflow-hidden rounded-2xl h-80">
                <img
                    src={src}
                    alt={key}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2 capitalize">{key}</h3>
                    <p className="text-gray-200 text-sm">Experience excellence</p>
                </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Experience Luxury?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Book your premium vehicle today and elevate your driving experience. 
              Limited availability for these exclusive models.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/ourcars" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
              >
                Reserve Your Vehicle
              </Link>
              <Link 
                to="/contact" 
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default Home;