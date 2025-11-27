import React from 'react';
import { Link } from 'react-router';
import { 
  Car, 
  Award, 
  Users, 
  Shield, 
  Star, 
  Clock, 
  Heart,
  ArrowRight,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/footer';

const About: React.FC = () => {
  const stats = [
    { number: '15+', label: 'Years of Excellence', icon: <Award className="h-8 w-8" /> },
    { number: '5000+', label: 'Satisfied Clients', icon: <Users className="h-8 w-8" /> },
    { number: '50+', label: 'Premium Vehicles', icon: <Car className="h-8 w-8" /> },
    { number: '24/7', label: 'Concierge Service', icon: <Clock className="h-8 w-8" /> }
  ];

  const values = [
    {
      icon: <Shield className="h-10 w-10" />,
      title: 'Trust & Security',
      description: 'Every vehicle is meticulously maintained and fully insured for your complete peace of mind.'
    },
    {
      icon: <Star className="h-10 w-10" />,
      title: 'Excellence',
      description: 'We set the standard for luxury car rentals with unparalleled service and attention to detail.'
    },
    {
      icon: <Heart className="h-10 w-10" />,
      title: 'Passion',
      description: 'Our love for exceptional automobiles drives us to deliver unforgettable experiences.'
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: 'Innovation',
      description: 'Constantly evolving to bring you the latest in luxury automotive technology and service.'
    }
  ];

  const milestones = [
    { year: '2008', event: 'S-Class Merchants Founded', description: 'Started with 3 luxury vehicles and a vision for premium service' },
    { year: '2012', event: 'Fleet Expansion', description: 'Grew collection to 20+ premium vehicles including first Rolls-Royce' },
    { year: '2016', event: 'International Recognition', description: 'Awarded "Best Luxury Car Rental Service" by Premium Auto Magazine' },
    { year: '2020', event: 'Digital Transformation', description: 'Launched premium online booking platform and mobile app' },
    { year: '2024', event: 'Global Expansion', description: 'Opening new locations in Dubai and Monaco' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Car className="h-12 w-12 text-red-600" />
              <span className="text-4xl font-bold text-white">S-Class Merchants</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Redefining Luxury
              <span className="block text-red-600">Mobility</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              For over 15 years, S-Class Merchants has been the premier destination for discerning clients 
              seeking exceptional luxury vehicle experiences. Our curated collection represents the pinnacle 
              of automotive excellence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/ourcars" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2 group"
              >
                Explore Our Fleet
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/contact" 
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-px bg-red-600"></div>
                <span className="text-red-600 font-semibold uppercase tracking-wider text-sm">
                  Our Heritage
                </span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6">The S-Class Story</h2>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2008, S-Class Merchants began with a simple yet powerful vision: to provide 
                  unparalleled luxury vehicle rental experiences. What started as a modest collection of 
                  three premium sedans has evolved into one of the most respected names in luxury mobility.
                </p>
                
                <p>
                  Our journey has been guided by an unwavering commitment to excellence, personalized service, 
                  and a deep passion for exceptional automobiles. Each vehicle in our fleet is carefully 
                  selected and meticulously maintained to meet the highest standards of quality and performance.
                </p>
                
                <p>
                  Today, we serve discerning clients worldwide, from business executives and celebrities to 
                  those celebrating life's special moments. Our mission remains unchanged: to deliver 
                  unforgettable driving experiences that exceed expectations.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-gray-900 font-semibold">ISO 9001 Certified Quality Management</span>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="S-Class Showroom"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-red-600 text-white p-6 rounded-2xl shadow-2xl">
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The principles that guide every aspect of our service and define the S-Class experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-800 rounded-2xl p-8 text-center hover:transform hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Milestones that mark our commitment to growth and excellence in luxury mobility
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 mb-12 last:mb-0">
                <div className="md:w-1/4 text-center md:text-right">
                  <div className="bg-red-600 text-white px-4 py-2 rounded-full inline-block">
                    <span className="font-bold text-lg">{milestone.year}</span>
                  </div>
                </div>
                <div className="md:w-3/4">
                  <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.event}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Luxury?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied clients who have chosen S-Class Merchants for their luxury vehicle needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/ourcars" 
              className="bg-white hover:bg-gray-100 text-red-600 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              View Our Fleet
            </Link>
            <Link 
              to="/contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;