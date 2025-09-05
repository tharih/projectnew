import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedUser() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const location = useLocation()
  if (!token) return <Navigate to="/user/login" replace state={{ from: location }} />
  return <Outlet />
}
