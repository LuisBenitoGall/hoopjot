import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AppShell } from '../shell/AppShell';
import { SmokeRoute } from '../shell/SmokeRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />
  },
  {
    path: '/smoke',
    element: <SmokeRoute />
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
