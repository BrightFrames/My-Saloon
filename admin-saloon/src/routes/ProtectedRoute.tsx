import React from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '../services/auth'

type Props = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const user = auth.getCurrent()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
