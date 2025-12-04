export interface Vehicle {
  // Make auto-generated fields optional
  vehicle_id: number; // Changed from optional to required
  vehicle_spec_id?: number; // Made nullable since you changed the DB
  
  // Make timestamp fields optional (will be set by DB)
  created_at?: string | Date;
  updated_at?: string | Date;
  
  // Required fields for creating a vehicle
  model: string;
  manufacturer: string;
  model_year: number;
  category: 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric' | 'Coupe';
  rental_rate: number;
  price: number;
  location: string;
  transmission: 'manual' | 'automatic' | 'PDK';
  fuel_type: string;
  seating_capacity: number;
  availability: boolean;
  rating: number;
  review_count: number;
  status:string;
  
  // Optional fields
  vehicle_image?: string;
  license_plate?: string;
  vin_number?: string;
  mileage?: number;
  insurance_provider?: string;
  insurance_expiry?: string;
  engine_capacity?: number;
  color?: string;
  horse_power?: number;
  drive_type?: string;
  
  // Array fields
  features: string[]; // Parsed from JSON string
}
export interface VehicleSpec {
  vehicleSpec_id?: number;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string;
  engine_capacity: string;
  transmission: string;
  seating_capacity: number;
  color: string;
  features: string[] | string;
  images: string[] | string;
  review_count: number;
  created_at?: string;
  updated_at?: string;
}


// User Types
export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone?: string;
  address?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact_phone?: string;
  address?: string;
  role?: 'user' | 'admin';
}

// Payment Types
export interface PaymentFormValues {
  booking_id: number;
  amount: number;
  payment_method?: string;
}

// Booking Types


  // Re// types/Types.ts

// Recent Booking Type (for display)
export interface RecentBooking {
  id: number;
  customer: string;
  vehicle: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  time: string;
}

// API Booking Type (from backend)
export interface Booking {

  booking_id: number;
  user_id?: number;
  vehicle_id: number;
  booking_date: string;
  return_date: string;
  total_amount: number;
  booking_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?:string;
   

    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    driver_license_number?: string;
  
   
    manufacturer: string;
    model: string;
    model_year: number;
    category: string;
    transmission: string;
    fuel_type: string;
    seating_capacity: number;
    rental_rate: number;
    vehicle_image?: string;
    color?: string;
    location?: string;
  
  payments?: Payment[];
    };
  
 
// Other existing types remain the same...cent Booking Type




// Vehicle Types


export interface VehicleFormValues {
  vehicle_spec_id: number;
  rental_rate: number;
  location: string;
  vehicle_image?: string;
  license_plate?: string;
}

// Admin Dashboard Types
export interface DashboardStats {
  total_users: number;
  total_vehicles: number;
  total_bookings: number;
  total_revenue: number;
  active_bookings: number;
  available_vehicles: number;
}

export interface AnalyticsData {
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
  popular_vehicles: Array<{
    manufacturer: string;
    model: string;
    bookings_count: number;
  }>;
  user_registrations: Array<{
    month: string;
    registrations: number;
  }>;
}
export interface Payment {

  payment_id: number;
  booking_id: number;
  amount: number;
  currency: string;
  payment_method: 'mpesa' | 'card' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?:string;
  transaction_reference?: string;
  mpesa_receipt_number?: string;
  phone_number?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  
  // Related data
  booking?: {
    booking_id: number;
    user_name?: string;
    user_email?: string;
    vehicle_model?: string;
    vehicle_manufacturer?: string;
  };
  user?: {
    user_id:number;
    first_name: string;
    last_name: string;
    email: string;
  };
}