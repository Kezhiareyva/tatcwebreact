import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /><span>Memeriksa sesi…</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <div className="access-denied"><div className="access-denied-card"><span className="eyebrow">403</span><h1>Akses ditolak</h1><p>Akun Anda tidak memiliki izin untuk membuka halaman ini.</p><a href="/home" className="btn btn-primary">Kembali ke beranda</a></div></div>;
  }
  return <Outlet />;
};
export default ProtectedRoute;
