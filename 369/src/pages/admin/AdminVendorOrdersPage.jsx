import React from 'react';
import { Navigate } from 'react-router-dom';

export function AdminVendorOrdersPage() {
  return <Navigate to="/admin/orders?tab=vendor" replace />;
}
