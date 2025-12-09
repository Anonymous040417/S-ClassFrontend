import {createBrowserRouter,RouterProvider} from 'react-router';
import Home from './pages/Home';
import OurCars from './pages/OurCars';
import About from './pages/About';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin.Dashboard/AdminDash';
import AdminUsersPage from './pages/Admin.Dashboard/Users';
import AdminVehiclesPage from './pages/Admin.Dashboard/Vehicles';
import AdminBookingsPage from './pages/Admin.Dashboard/Bookings';
import AdminPaymentsPage from './pages/Admin.Dashboard/Payments';
import UserBookingPage from './pages/user.Dashboard/UserBookings';
import UserPaymentsPage from './pages/user.Dashboard/UserPayments';
import UserDashboard from './pages/user.Dashboard/UserDashboard';
import UserProfilePage from './pages/user.Dashboard/UserProfile';


function App(){
  const route= createBrowserRouter([
    {
      path:'/',
      element:<Home/>
    },
    {
      path:'/ourcars',
      element:<OurCars/>

    },
    {
      path:'/about',
      element:<About/>
    },
    {
      path:'/register',
      element:<Register/>
    },
    {
      path:'/login',
      element:<Login/>
    },
    {
      path: '/admin/dashboard',
      element:<AdminDashboard/>
    },
    {
      path:'/admin/users',
      element:<AdminUsersPage/>
    },
    {
      path:'/admin/vehicles',
      element:<AdminVehiclesPage/>
    },
    {
      path:'/admin/bookings',
      element:<AdminBookingsPage/>
    },
      {
      path:'/admin/payments',
      element:<AdminPaymentsPage/>
    },
      {
      path:'/user/dashboard',
      element:<UserDashboard/>
    },
    {
      path:'/user/bookings',
      element:<UserBookingPage/>
    },
     {
      path:'/user/payments',
      element:<UserPaymentsPage/>
    },
     {
      path:'/user/profile',
      element:<UserProfilePage/>
    },




  ])


return(
  <RouterProvider router={route}/>

)
}
 export default App