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
} from 'lucide-react';
import Footer from '../components/footer';
import NavBar from '../components/NavBar';

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroCars = [
    {
      id: 1,
      name: "2024 Range Rover Autobiography",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      price: "$450/day",
      tagline: "Ultimate Luxury SUV",
      description: "Sophisticated design with unparalleled comfort"
    },
    {
      id: 2,
      name: "2024 Mercedes-Benz S-Class",
      image: "https://i.pinimg.com/1200x/d3/94/0d/d3940d167dc6f99e1b0954a5ac290293.jpg",
      price: "$400/day",
      tagline: "The Benchmark of Luxury",
      description: "Cutting-edge technology with exquisite craftsmanship"
    },
    {
      id: 3,
      name: "2024 Porsche 911 Turbo S",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      price: "$600/day",
      tagline: "Performance Redefined",
      description: "Blistering acceleration with daily usability"
    }
  ];

  const features = [
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

  const luxuryCars = [
    {
      id: 1,
      name: "Rolls-Royce Ghost",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$800/day",
      features: ["V12 Power", "Suicide Doors", "Starlight Headliner"],
      brand: "Rolls-Royce"
    },
    {
      id: 2,
      name: "Audi RS e-tron GT",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$350/day",
      features: ["All-Electric", "637 HP", "0-60: 3.1s"],
      brand: "Audi"
    },
    {
      id: 3,
      name: "BMW M8 Competition",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$500/day",
      features: ["617 HP", "Carbon Roof", "M xDrive"],
      brand: "BMW"
    },
    {
      id: 4,
      name: "Bentley Bentayga",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$550/day",
      features: ["W12 Engine", "Mulliner Trim", "All-Terrain"],
      brand: "Bentley"
    },
    {
      id: 5,
      name: "Lamborghini Urus",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$700/day",
      features: ["641 HP", "Super SUV", "Carbon Ceramics"],
      brand: "Lamborghini"
    },
    {
      id: 6,
      name: "Mercedes-AMG GT",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$450/day",
      features: ["4.0L V8", "Coupe", "AMG Performance"],
      brand: "Mercedes"
    },
    {
      id: 7,
      name: "Porsche Taycan Turbo",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$480/day",
      features: ["Electric", "670 HP", "800V Architecture"],
      brand: "Porsche"
    },
    {
      id: 8,
      name: "Aston Martin DBX",
      year: "2024",
      image: "https://images.unsplash.com/photo-1563720223480-1872c94d42c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      price: "$520/day",
      features: ["AMG V8", "Luxury SUV", "British Craftsmanship"],
      brand: "Aston Martin"
    }
  ];

  // Additional showcase images
  const showcaseImages = {
    heritage: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    craftsmanship: "https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    experience: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    luxury: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80"
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroCars.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <NavBar/>
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Slideshow */}
        <div className="absolute inset-0">
          {heroCars.map((car, index) => (
            <div
              key={car.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
            </div>
          ))}
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
                <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  <Play className="h-5 w-5" />
                  Our Story
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Car Info Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm text-white p-6">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold text-red-600 mb-2">
                  {heroCars[currentSlide].name}
                </h3>
                <p className="text-gray-300">{heroCars[currentSlide].tagline}</p>
              </div>
              
              <div className="text-center lg:text-right">
                <div className="text-3xl font-bold text-white mb-2">
                  {heroCars[currentSlide].price}
                </div>
                <p className="text-gray-400 text-sm">
                  {heroCars[currentSlide].description}
                </p>
              </div>
              
              <Link 
                to={`/car/${heroCars[currentSlide].id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group"
              >
                Book Now
                <Calendar className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section - Cards Only */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-1 bg-red-600"></div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The S-Class Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unmatched service and attention to detail for your luxury car rental experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
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
            {luxuryCars.map((car) => (
              <div 
                key={car.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {car.price}
                  </div>
                  <div className="absolute top-4 left-4 bg-gray-900 text-white px-2 py-1 rounded text-xs font-semibold">
                    {car.brand}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                    <span className="text-red-600 font-semibold">{car.year}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {car.features.map((feature, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full bg-gray-900 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform group-hover:-translate-y-1">
                    Book This Vehicle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Showcase Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Beyond the Wheel
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the innovation, craftsmanship, and luxury behind each premium vehicle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-2xl h-80">
              <img
                src={showcaseImages.heritage}
                alt="Modern Innovation"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Modern Innovation</h3>
                <p className="text-gray-200">Cutting-edge technology</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl h-80">
              <img
                src={showcaseImages.craftsmanship}
                alt="Premium Craftsmanship"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Premium Craftsmanship</h3>
                <p className="text-gray-200">Exquisite attention to detail</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl h-80">
              <img
                src={showcaseImages.experience}
                alt="Driving Experience"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Driving Experience</h3>
                <p className="text-gray-200">Unforgettable journeys</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl h-80">
              <img
                src={showcaseImages.luxury}
                alt="Luxury Lifestyle"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Luxury Lifestyle</h3>
                <p className="text-gray-200">Elevate every moment</p>
              </div>
            </div>
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
                to="/register" 
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