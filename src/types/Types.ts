export type UserFormValues={
    email: string; 
    password: string;
    first_name:string;
    last_name:string;
    phone_number:string
}


export type OrderFormValues={
    restaurant_id:number;
    customer_id: number;
    menu_item_id:number;
    total_amount: number;
    order_type:'dine_in' | 'takeaway' | 'delivery'
}

export interface User{
    user_id:number;
    first_name:string;
    last_name:string;
    email:string;
    phone_number:string;
    created_at:string;
    user_type:string
    status:string
}

// Vehicle Types
export interface VehicleSpecification {
  vehicle_spec_id: number;
  manufacturer: string;
  model: string;
  model_year: number;
  fuel_type: string;
  engine_capacity?: number;
  transmission: 'manual' | 'automatic' | 'PDK';
  seating_capacity: number;
  color?: string;
  category: 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric' | 'Coupe';
  features: string[]; // Parsed from JSON string
  horse_power?: number;
  drive_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  vehicle_id: number;
  model:string;
  vehicle_spec_id: number[];
  rental_rate: number;
  location: string;
  vehicle_image?: string;
  availability: boolean;
  rating: number;
  review_count: number;
  price:number;
  license_plate?: string;
  vin_number?: string;
  mileage?: number;

  insurance_provider?: string;
  insurance_expiry?: string;
  created_at: string[];
  updated_at: string[];
  // specifications: VehicleSpecification; // Joined data
  // vehicle_spec_id: number;
  manufacturer: string;
  // model: string;
  model_year: number;
  fuel_type: string;
  engine_capacity?: number;
  transmission: 'manual' | 'automatic' | 'PDK';
  seating_capacity: number;
  color?: string;
  category: 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric' | 'Coupe';
  features: string[]; // Parsed from JSON string
  horse_power?: number;
  drive_type?: string;
}

export interface VehicleWithSpecs extends Vehicle {
  specifications: VehicleSpecification;
}

// Form values for creating/updating vehicles
export interface VehicleFormValues {
  vehicle_spec_id: number;
  rental_rate: number;
  availability: boolean;
  location: string;
  vehicle_image?: string;
  license_plate?: string;
  vin_number?: string;
  mileage?: number;
  insurance_provider?: string;
  insurance_expiry?: string;
}

export interface VehicleSpecFormValues {
  manufacturer: string;
  model: string;
  model_year: number;
  fuel_type: string;
  engine_capacity?: number;
  transmission: 'manual' | 'automatic' | 'PDK';
  seating_capacity: number;
  color?: string;
  category: 'SUV' | 'Sedan' | 'Sports' | 'Luxury' | 'Electric' | 'Coupe';
  features: string[];
  horse_power?: number;
  drive_type?: string;
}

// API Response Types
export interface VehiclesResponse {
  vehicles: VehicleWithSpecs[];
  total: number;
  page: number;
  limit: number;
}

export interface VehicleResponse {
  vehicle: VehicleWithSpecs;
}

export interface ApiMessageResponse {
  message: string;
}
// Booking Status Enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Main Booking Interface
export interface Booking {
  booking_id: number;
  user_id: number;
  vehicle_id: number;
  booking_date: string; // ISO date string format: "2024-01-15T10:00:00Z"
  return_date: string; // ISO date string format: "2024-01-20T14:00:00Z"
  total_amount: number;
  booking_status: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// For creating a new booking
export interface CreateBookingRequest {
  user_id: number;
  vehicle_id: number;
  booking_date: string; // ISO date string
  return_date: string; // ISO date string
  total_amount: number;
  booking_status?: string; // Optional, defaults to 'pending'
}

// For updating booking status
export interface UpdateBookingStatusRequest {
  booking_id: number;
  status: BookingStatus;
}

// For canceling a booking
export interface CancelBookingRequest {
  booking_id: number;
}

// API Response Types
export interface BookingResponse {
  message: string;
  booking?: Booking;
  booking_id?: number;
}

export interface BookingsListResponse {
  message: string;
  bookings: Booking[];
  count?: number;
}

export interface ErrorResponse {
  message: string;
  error?: string;
  code?: number;
}

// Query Parameter Types
export interface GetUserBookingsParams {
  user_id: number | string;
}

export interface GetBookingByIdParams {
  booking_id: number | string;
}

// Extended Booking with related data (if you need to join with other tables)
export interface BookingWithRelations extends Booking {
  user_name?: string;
  user_email?: string;
  vehicle_name?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
}

// Pagination for bookings list
export interface BookingsPagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedBookingsResponse {
  message: string;
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Statistics types
export interface BookingStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
}

export interface BookingStatsResponse {
  message: string;
  stats: BookingStats;
  period?: {
    start_date: string;
    end_date: string;
  };
}