import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoutes({children}) {
    const token = localStorage.getItem("User_Token")
    if(token) return children
  return <Navigate to ={"/auth/login"} />
}
