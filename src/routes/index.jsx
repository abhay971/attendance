import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { LoginPage } from '../pages/LoginPage';
import { EmployeeDashboardPage } from '../pages/employee/DashboardPage';
import { EmployeeHistoryPage } from '../pages/employee/HistoryPage';
import { EmployeeProfilePage } from '../pages/employee/ProfilePage';
import { AdminDashboardPage } from '../pages/admin/DashboardPage';
import { AdminEmployeesPage } from '../pages/admin/EmployeesPage';
import { AdminAttendancePage } from '../pages/admin/AttendancePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <EmployeeDashboardPage />,
      },
      {
        path: 'history',
        element: <EmployeeHistoryPage />,
      },
      {
        path: 'profile',
        element: <EmployeeProfilePage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <MainLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'employees',
        element: <AdminEmployeesPage />,
      },
      {
        path: 'attendance',
        element: <AdminAttendancePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
