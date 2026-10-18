import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Avatar from './pages/Avatar';
import Home from './pages/Home';


const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/avatar',
        element: <Avatar />,
      },
    ],
  },
]);


function App() {
  return <RouterProvider router={router} />;
}

export default App;
