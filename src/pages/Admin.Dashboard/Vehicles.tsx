import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  MapPin,
  DollarSign,
  Star,
  Users,
  Fuel,
  Zap,
  Palette,
  X,
  AlertCircle
} from 'lucide-react'
import { VehicleApi } from '../../features/api/VehiclesApi'
import type { Vehicle } from '../../types/Types'
import AdminDashboardLayout from '../../Dashboard.designs/AdminDashboardLayout'

const AdminVehiclesPage: React.FC = () => {
  const { data: apiResponse, isLoading, error, refetch } = VehicleApi.useGetAllVehiclesQuery()
  const [addVehicle] = VehicleApi.useAddVehicleMutation()
  const [updateVehicle] = VehicleApi.useUpdateVehicleMutation()
  const [deleteVehicle] = VehicleApi.useDeleteVehicleMutation()
  const [createVehicleSpec] = VehicleApi.useCreateVehicleSpecMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Vehicle['category']>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [creationStep, setCreationStep] = useState<'spec' | 'inventory'>('spec')

  // Form states - Split into two parts
  const [vehicleSpecForm, setVehicleSpecForm] = useState({
    manufacturer: '',
    model: '',
    model_year: new Date().getFullYear(),
    category: 'SUV' as Vehicle['category'],
    transmission: 'automatic' as 'manual' | 'automatic' | 'PDK',
    fuel_type: 'Petrol',
    seating_capacity: 5,
    color: '',
    features: [] as string[],
    engine_capacity: 0,
    horse_power: 0,
    drive_type: '',
    vin_number: ''
  })

  const [vehicleInventoryForm, setVehicleInventoryForm] = useState({
    rental_rate: 0,
    price: 0,
    location: '',
    availability: true,
    license_plate: '',
    mileage: 0,
    insurance_provider: '',
    insurance_expiry: '',
    rating: 0,
    review_count: 0,
    vehicle_image: ''
  })

  const [createdSpecId, setCreatedSpecId] = useState<number | null>(null)

  const [editVehicleForm, setEditVehicleForm] = useState({
    rental_rate: 0,
    price: 0,
    location: '',
    availability: true,
    license_plate: '',
    mileage: 0,
    insurance_provider: '',
    insurance_expiry: '',
    vehicle_image: ''
  })

  // Extract vehicles from API response
  useEffect(() => {
    if (apiResponse) {
      let vehiclesArray: any[] = []
  
      if (Array.isArray(apiResponse)) {
        vehiclesArray = apiResponse
      } else if (apiResponse && typeof apiResponse === 'object') {
        const resp = apiResponse as any
        if (Array.isArray(resp.data)) {
          vehiclesArray = resp.data
        } else if (Array.isArray(resp.vehicles)) {
          vehiclesArray = resp.vehicles
        } else {
          vehiclesArray = Object.values(resp)
        }
      }
  
      const normalizedVehicles: Vehicle[] = vehiclesArray.map((vehicle: any) => ({
        vehicle_id: vehicle.vehicle_id || vehicle.id || 0,
        vehicle_spec_id: vehicle.vehicle_spec_id || 0,
        vehice_spec_id: vehicle.vehice_spec_id || vehicle.vehicle_spec_id || 0,
        model: vehicle.model || '',
        manufacturer: vehicle.manufacturer || '',
        model_year: vehicle.model_year || new Date().getFullYear(),
        category: (vehicle.category || 'SUV') as Vehicle['category'],
        rental_rate: vehicle.rental_rate || 0,
        price: vehicle.price || 0,
        location: vehicle.location || '',
        transmission: vehicle.transmission || 'automatic',
        fuel_type: vehicle.fuel_type || 'Petrol',
        seating_capacity: vehicle.seating_capacity || 5,
        color: vehicle.color || '',
        features: Array.isArray(vehicle.features) ? vehicle.features : [],
        availability: vehicle.availability !== undefined ? vehicle.availability : true,
        license_plate: vehicle.license_plate || '',
        vin_number: vehicle.vin_number || '',
        mileage: vehicle.mileage || 0,
        insurance_provider: vehicle.insurance_provider || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        engine_capacity: vehicle.engine_capacity || 0,
        horse_power: vehicle.horse_power || 0,
        drive_type: vehicle.drive_type || '',
        rating: vehicle.rating || 0,
        review_count: vehicle.review_count || 0,
        vehicle_image: vehicle.vehicle_image || '',
        created_at: vehicle.created_at || new Date().toISOString(),
        updated_at: vehicle.updated_at || new Date().toISOString()
      }))
  
      setVehicles(normalizedVehicles)
    } else {
      setVehicles([])
    }
  }, [apiResponse])

  // Initialize edit form when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      setEditVehicleForm({
        rental_rate: selectedVehicle.rental_rate || 0,
        price: selectedVehicle.price || 0,
        location: selectedVehicle.location || '',
        availability: selectedVehicle.availability !== undefined ? selectedVehicle.availability : true,
        license_plate: selectedVehicle.license_plate || '',
        mileage: selectedVehicle.mileage || 0,
        insurance_provider: selectedVehicle.insurance_provider || '',
        insurance_expiry: selectedVehicle.insurance_expiry || '',
        vehicle_image: selectedVehicle.vehicle_image || ''
      })
    }
  }, [selectedVehicle])

  // Filter vehicles based on search and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || vehicle.category === categoryFilter
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && vehicle.availability) ||
      (availabilityFilter === 'unavailable' && !vehicle.availability)
    
    return matchesSearch && matchesCategory && matchesAvailability
  })

  // Reset forms
  const resetForms = () => {
    setVehicleSpecForm({
      manufacturer: '',
      model: '',
      model_year: new Date().getFullYear(),
      category: 'SUV',
      transmission: 'automatic',
      fuel_type: 'Petrol',
      seating_capacity: 5,
      color: '',
      features: [],
      engine_capacity: 0,
      horse_power: 0,
      drive_type: '',
      vin_number: ''
    })
    setVehicleInventoryForm({
      rental_rate: 0,
      price: 0,
      location: '',
      availability: true,
      license_plate: '',
      mileage: 0,
      insurance_provider: '',
      insurance_expiry: '',
      rating: 0,
      review_count: 0,
      vehicle_image: ''
    })
    setCreatedSpecId(null)
    setCreationStep('spec')
  }

  // Step 1: Create Vehicle Specification
  const handleCreateVehicleSpec = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    // Validation
    if (!vehicleSpecForm.manufacturer || !vehicleSpecForm.model) {
      setFormError('Manufacturer and model are required')
      setIsSubmitting(false)
      return
    }

    if (vehicleSpecForm.seating_capacity <= 0) {
      setFormError('Seating capacity must be greater than 0')
      setIsSubmitting(false)
      return
    }

    try {
      // Convert features array to JSON string
      const featuresString = JSON.stringify(vehicleSpecForm.features);
      
      // Create vehicle specification
      const specResponse = await createVehicleSpec({
        manufacturer: vehicleSpecForm.manufacturer,
        model: vehicleSpecForm.model,
        model_year: vehicleSpecForm.model_year,
        fuel_type: vehicleSpecForm.fuel_type,
        seating_capacity: vehicleSpecForm.seating_capacity,
        engine_capacity: vehicleSpecForm.engine_capacity || undefined,
        transmission: vehicleSpecForm.transmission,
        color: vehicleSpecForm.color || undefined,
        category: vehicleSpecForm.category || undefined,
        features: featuresString,
        horse_power: vehicleSpecForm.horse_power || undefined,
        drive_type: vehicleSpecForm.drive_type || undefined
      }).unwrap();

      console.log('Vehicle spec created:', specResponse);

      // Extract vehicle_spec_id from response
      let vehicleSpecId: number;
      
      // Handle different response structures
      if (specResponse.data && typeof specResponse.data === 'object') {
        // Case 1: { message: string, data: { vehicle_spec_id: number } }
        vehicleSpecId = (specResponse.data as any).vehicle_spec_id;
      } else if (typeof specResponse === 'object' && 'vehicle_spec_id' in specResponse) {
        // Case 2: Direct object with vehicle_spec_id
        vehicleSpecId = (specResponse as any).vehicle_spec_id;
      } else {
        // Case 3: Try to find it in the response
        const response = specResponse as any;
        vehicleSpecId = response.vehicle_spec_id || response.id || response.vehicleSpec_id;
      }

      if (!vehicleSpecId) {
        console.error('Could not extract vehicle_spec_id from:', specResponse);
        throw new Error('Failed to get vehicle specification ID');
      }

      setCreatedSpecId(vehicleSpecId);
      setFormSuccess('Vehicle specification created successfully! Moving to inventory details...');
      setCreationStep('inventory');
      
    } catch (error: any) {
      console.error('Failed to create vehicle spec:', error);
      setFormError(
        error?.data?.message || 
        error?.data?.error || 
        error?.message ||
        'Failed to create vehicle specification. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 2: Create Vehicle Inventory
  const handleCreateVehicleInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    if (!createdSpecId) {
      setFormError('No vehicle specification ID found. Please go back to step 1.')
      setIsSubmitting(false)
      return
    }

    if (!vehicleInventoryForm.location || !vehicleInventoryForm.license_plate) {
      setFormError('Location and license plate are required')
      setIsSubmitting(false)
      return
    }

    if (vehicleInventoryForm.rental_rate <= 0) {
      setFormError('Rental rate must be greater than 0')
      setIsSubmitting(false)
      return
    }

    try {
      const vehicleData = {
        vehicle_spec_id: createdSpecId,
        rental_rate: vehicleInventoryForm.rental_rate,
        price: vehicleInventoryForm.price || 0,
        location: vehicleInventoryForm.location,
        availability: vehicleInventoryForm.availability,
        license_plate: vehicleInventoryForm.license_plate,
        mileage: vehicleInventoryForm.mileage || 0,
        insurance_provider: vehicleInventoryForm.insurance_provider || '',
        insurance_expiry: vehicleInventoryForm.insurance_expiry || '',
        rating: vehicleInventoryForm.rating || 0,
        review_count: vehicleInventoryForm.review_count || 0,
        vehicle_image: vehicleInventoryForm.vehicle_image || ''
      }

      console.log('Creating vehicle inventory:', vehicleData);
      
      await addVehicle(vehicleData).unwrap();
      
      setFormSuccess('Vehicle added successfully!');
      setIsAddModalOpen(false);
      resetForms();
      refetch();
      
      setTimeout(() => {
        setFormSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to create vehicle inventory:', error);
      setFormError(
        error?.data?.message || 
        error?.data?.error || 
        error?.message ||
        'Failed to create vehicle inventory. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setIsSubmitting(true)
    
    if (!selectedVehicle) return

    try {
      const updateData = {
        vehicle_id: selectedVehicle.vehicle_id,
        rental_rate: editVehicleForm.rental_rate,
        price: editVehicleForm.price,
        location: editVehicleForm.location,
        availability: editVehicleForm.availability,
        vehicle_image: editVehicleForm.vehicle_image || '',
        license_plate: editVehicleForm.license_plate,
        mileage: editVehicleForm.mileage
      }

      console.log('Updating vehicle:', updateData)
      
      await updateVehicle(updateData).unwrap()
      
      setFormSuccess('Vehicle updated successfully!')
      setIsEditModalOpen(false)
      setSelectedVehicle(null)
      refetch()
      
      setTimeout(() => setFormSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to update vehicle:', error)
      setFormError(error?.data?.error || 'Failed to update vehicle. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    
    try {
      await deleteVehicle({ vehicle_id: vehicleToDelete.vehicle_id }).unwrap()
      setIsDeleteModalOpen(false)
      setVehicleToDelete(null)
      refetch()
    } catch (error: any) {
      console.error('Failed to delete vehicle:', error)
      setFormError(error?.data?.error || 'Failed to delete vehicle. Please try again.')
    }
  }

  const openDeleteModal = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle)
    setIsDeleteModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsEditModalOpen(true)
    setFormError(null)
    setFormSuccess(null)
  }

  const openAddModal = () => {
    setIsAddModalOpen(true)
    setFormError(null)
    setFormSuccess(null)
    resetForms()
  }

  // Calculate stats
  const totalVehicles = vehicles.length
  const availableVehicles = vehicles.filter(v => v.availability).length
  const totalRevenue = vehicles.reduce((sum, vehicle) => sum + (vehicle.rental_rate * (vehicle.review_count || 0)), 0)

  const categories: Vehicle['category'][] = ['SUV', 'Sedan', 'Sports', 'Luxury', 'Electric', 'Coupe']
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid']
  const transmissions = ['manual', 'automatic', 'PDK']

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <div className="text-red-600 text-lg font-semibold mb-2">
            Failed to load vehicles
          </div>
          <p className="text-red-500 mb-4">{(error as any)?.data?.error || 'Network error'}</p>
          <button 
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <div className="space-y-6">
      <AdminDashboardLayout>
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your vehicle fleet and availability
            </p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add New Vehicle
          </button>
        </div>

        {/* Success/Error Messages */}
        {formSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{formSuccess}</span>
            </div>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{formError}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalVehicles}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {availableVehicles}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vehicles by model, manufacturer, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-xl font-semibold text-gray-500 mb-2">No vehicles found</div>
              <p className="text-gray-400">
                {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No vehicles have been added yet'
                }
              </p>
              <button 
                onClick={openAddModal}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Add First Vehicle
              </button>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Vehicle Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  {vehicle.vehicle_image ? (
                    <img 
                      src={vehicle.vehicle_image} 
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                    vehicle.availability 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {vehicle.availability ? 'Available' : 'Unavailable'}
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-black bg-opacity-50 text-white">
                    {vehicle.category}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{vehicle.manufacturer} {vehicle.model}</h3>
                      <p className="text-gray-500 text-sm">{vehicle.model_year} • {vehicle.transmission}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">${vehicle.rental_rate}/day</div>
                      <div className="text-sm text-gray-500">${vehicle.price} value</div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{vehicle.seating_capacity} seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Palette className="w-4 h-4" />
                      <span>{vehicle.color || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{vehicle.rating} ({vehicle.review_count})</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{vehicle.location}</span>
                  </div>

                  {/* Features */}
                  {Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {vehicle.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                        {vehicle.features.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{vehicle.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(vehicle)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => openDeleteModal(vehicle)}
                      className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Vehicle Modal - Multi-step */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {creationStep === 'spec' ? 'Step 1: Vehicle Specifications' : 'Step 2: Vehicle Inventory'}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {creationStep === 'spec' 
                      ? 'Define the vehicle model and specifications' 
                      : 'Set rental details and location for this vehicle'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false)
                    resetForms()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <div className={`flex items-center ${creationStep === 'spec' ? 'text-blue-600' : 'text-green-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${creationStep === 'spec' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                      1
                    </div>
                    <div className="ml-2">Specifications</div>
                  </div>
                  <div className="w-16 h-1 mx-4 bg-gray-300"></div>
                  <div className={`flex items-center ${creationStep === 'inventory' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${creationStep === 'inventory' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      2
                    </div>
                    <div className="ml-2">Inventory</div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{formSuccess}</p>
                </div>
              )}

              {/* Step 1: Vehicle Specifications Form */}
              {creationStep === 'spec' && (
                <form onSubmit={handleCreateVehicleSpec} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturer *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleSpecForm.manufacturer}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, manufacturer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Toyota"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleSpecForm.model}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, model: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Camry"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model Year
                        </label>
                        <input
                          type="number"
                          value={vehicleSpecForm.model_year}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, model_year: parseInt(e.target.value) || new Date().getFullYear()})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="2000"
                          max={new Date().getFullYear() + 1}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={vehicleSpecForm.category}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, category: e.target.value as Vehicle['category']})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Specifications</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fuel Type
                        </label>
                        <select
                          value={vehicleSpecForm.fuel_type}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, fuel_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        >
                          {fuelTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transmission
                        </label>
                        <select
                          value={vehicleSpecForm.transmission}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, transmission: e.target.value as 'manual' | 'automatic' | 'PDK'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        >
                          {transmissions.map(trans => (
                            <option key={trans} value={trans}>
                              {trans.charAt(0).toUpperCase() + trans.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seating Capacity *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="20"
                          value={vehicleSpecForm.seating_capacity}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, seating_capacity: parseInt(e.target.value) || 5})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={vehicleSpecForm.color}
                          onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, color: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Red"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engine Capacity (cc)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={vehicleSpecForm.engine_capacity}
                        onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, engine_capacity: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horse Power
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={vehicleSpecForm.horse_power}
                        onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, horse_power: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drive Type
                      </label>
                      <input
                        type="text"
                        value={vehicleSpecForm.drive_type}
                        onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, drive_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., FWD, RWD, AWD"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VIN Number
                      </label>
                      <input
                        type="text"
                        value={vehicleSpecForm.vin_number}
                        onChange={(e) => setVehicleSpecForm({...vehicleSpecForm, vin_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Vehicle Identification Number"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Features (comma separated)
                    </label>
                    <input
                      type="text"
                      value={vehicleSpecForm.features.join(', ')}
                      onChange={(e) => setVehicleSpecForm({
                        ...vehicleSpecForm, 
                        features: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="GPS, Bluetooth, Sunroof, Heated Seats"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false)
                        resetForms()
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating Specification...
                        </>
                      ) : (
                        'Create Specification & Continue'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Vehicle Inventory Form */}
              {creationStep === 'inventory' && (
                <form onSubmit={handleCreateVehicleInventory} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Specification Created:</strong> {vehicleSpecForm.manufacturer} {vehicleSpecForm.model} ({vehicleSpecForm.model_year})
                      <br />
                      <strong>Spec ID:</strong> {createdSpecId}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Pricing & Location</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rental Rate ($/day) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={vehicleInventoryForm.rental_rate}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, rental_rate: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Value ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={vehicleInventoryForm.price}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, price: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleInventoryForm.location}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., New York, NY"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          License Plate *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleInventoryForm.license_plate}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, license_plate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., ABC123"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Additional Details</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mileage
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={vehicleInventoryForm.mileage}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, mileage: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Insurance Provider
                        </label>
                        <input
                          type="text"
                          value={vehicleInventoryForm.insurance_provider}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, insurance_provider: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., State Farm"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Insurance Expiry
                        </label>
                        <input
                          type="date"
                          value={vehicleInventoryForm.insurance_expiry}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, insurance_expiry: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Image URL
                        </label>
                        <input
                          type="text"
                          value={vehicleInventoryForm.vehicle_image}
                          onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, vehicle_image: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/vehicle-image.jpg"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vehicleInventoryForm.availability}
                      onChange={(e) => setVehicleInventoryForm({...vehicleInventoryForm, availability: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Available for Rent
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setCreationStep('spec')
                        setFormError(null)
                        setFormSuccess(null)
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      ← Back to Specifications
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating Vehicle...
                        </>
                      ) : (
                        'Complete & Create Vehicle'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {isEditModalOpen && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Vehicle</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <form onSubmit={handleEditVehicle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Pricing & Location</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rental Rate ($/day)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editVehicleForm.rental_rate}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, rental_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Value ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editVehicleForm.price}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        required
                        value={editVehicleForm.location}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={editVehicleForm.license_plate}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, license_plate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Additional Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Image URL
                      </label>
                      <input
                        type="text"
                        value={editVehicleForm.vehicle_image}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, vehicle_image: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/vehicle-image.jpg"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mileage
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editVehicleForm.mileage}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, mileage: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editVehicleForm.availability}
                        onChange={(e) => setEditVehicleForm({...editVehicleForm, availability: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Available for Rent
                      </label>
                    </div>
                  </div>
                </div>

                {/* Display-only Information */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Vehicle Details (Read-only)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Manufacturer
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {selectedVehicle.manufacturer}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Model
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {selectedVehicle.model}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Category
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {selectedVehicle.category}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Fuel Type
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
                        {selectedVehicle.fuel_type}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && vehicleToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Vehicle</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">
                  Are you sure you want to delete {vehicleToDelete.manufacturer} {vehicleToDelete.model}?
                </p>
                <p className="text-red-600 text-sm mt-1">
                  All vehicle data and associated bookings will be permanently removed.
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setVehicleToDelete(null)
                    setFormError(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminDashboardLayout>
    </div>
  )
}

export default AdminVehiclesPage