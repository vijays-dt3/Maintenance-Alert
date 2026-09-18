import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EquipmentListPage } from '../pages/equipment/EquipmentListPage';
import { EquipmentDetailPage } from '../pages/equipment/EquipmentDetailPage';
import { AddEquipmentPage } from '../pages/equipment/AddEquipmentPage';
import { ParameterReadingsPage } from '../pages/parameters/ParameterReadingsPage';
import { AlertListPage } from '../pages/alerts/AlertListPage';
import { AlertDetailPage } from '../pages/alerts/AlertDetailPage';
import { WorkOrderListPage } from '../pages/work-orders/WorkOrderListPage';
import { WorkOrderDetailPage } from '../pages/work-orders/WorkOrderDetailPage';
import { CreateWorkOrderPage } from '../pages/work-orders/CreateWorkOrderPage';
import { SparePartsPage } from '../pages/spare-parts/SparePartsPage';
import { MaintenanceHistoryPage } from '../pages/maintenance-history/MaintenanceHistoryPage';
import { LoginPage } from '../pages/auth/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'equipment',
        element: <EquipmentListPage />,
      },
      {
        path: 'equipment/new',
        element: <AddEquipmentPage />,
      },
      {
        path: 'equipment/:id',
        element: <EquipmentDetailPage />,
      },
      {
        path: 'readings',
        element: <ParameterReadingsPage />,
      },
      {
        path: 'alerts',
        element: <AlertListPage />,
      },
      {
        path: 'alerts/:id',
        element: <AlertDetailPage />,
      },
      {
        path: 'work-orders',
        element: <WorkOrderListPage />,
      },
      {
        path: 'work-orders/new',
        element: <CreateWorkOrderPage />,
      },
      {
        path: 'work-orders/:id',
        element: <WorkOrderDetailPage />,
      },
      {
        path: 'spare-parts',
        element: <SparePartsPage />,
      },
      {
        path: 'history',
        element: <MaintenanceHistoryPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
