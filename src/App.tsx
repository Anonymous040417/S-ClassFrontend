import {createBrowserRouter,RouterProvider} from 'react-router';
import Home from './pages/Home';
import OurCars from './pages/OurCars';
import About from './pages/About';
import Register from './pages/Register';
import Login from './pages/Login';

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
    }
  ])


return(
  <RouterProvider router={route}/>

)
}
 export default App