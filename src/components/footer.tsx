import React from 'react';
import { Link } from 'react-router';
import { 
  Car, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Shield,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Premium Banner Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-white" />
              <div>
                <h3 className="text-xl font-bold">Premium Certified</h3>
                <p className="text-red-100">Every vehicle undergoes 150-point inspection</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Award className="h-8 w-8 text-white" />
              <div>
                <h3 className="text-xl font-bold">Award Winning</h3>
                <p className="text-red-100">Best Luxury Dealership 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-white" />
              <div>
                <h3 className="text-xl font-bold">24/7 Support</h3>
                <p className="text-red-100">Always here to serve you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <Car className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-white">S-Class Merchants</span>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your premier destination for luxury and performance vehicles. 
              Experience excellence in every drive with our curated collection 
              of premium automobiles.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 hover:bg-red-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-red-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-red-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 hover:bg-red-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white border-b border-red-600 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/ourcars', label: 'Our Collection' },
                { to: '/about', label: 'About Us' },
                { to: '/financing', label: 'Financing' },
                { to: '/test-drive', label: 'Schedule Test Drive' },
                { to: '/contact', label: 'Contact' }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="flex items-center text-gray-300 hover:text-red-400 transition-all duration-300 group"
                  >
                    <ArrowRight className="h-4 w-4 mr-3 transform group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicle Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white border-b border-red-600 pb-2">Our Fleet</h3>
            <ul className="space-y-3">
              {[
                'Luxury Sedans',
                'Sports Cars',
                'SUVs & Crossovers',
                'Electric Vehicles',
                'Pre-Owned Collection',
                'Limited Editions'
              ].map((category) => (
                <li key={category}>
                  <a href="#" className="text-gray-300 hover:text-red-400 transition-colors duration-300">
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white border-b border-red-600 pb-2">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">123 Luxury Avenue</p>
                  <p className="text-gray-300">Beverly Hills, CA 90210</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-red-600" />
                <a href="tel:+11234567890" className="text-gray-300 hover:text-red-400 transition-colors">
                  +1 (123) 456-7890
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-red-600" />
                <a href="mailto:info@sclassmerchants.com" className="text-gray-300 hover:text-red-400 transition-colors">
                  info@sclassmerchants.com
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-2 text-white">Business Hours</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span>9:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>12:00 PM - 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 S-Class Merchants. All rights reserved. | Luxury Redefined
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Cookie Policy</a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;