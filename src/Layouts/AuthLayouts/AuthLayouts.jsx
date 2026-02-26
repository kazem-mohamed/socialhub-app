import React from 'react'
import { Outlet } from 'react-router'
import Footer from './../../components/Layout/Footer/Footer';
import PageTitle from "../../components/Seo/PageTitle";

export default function AuthLayouts() {
  return (
   <>
   <PageTitle />
   <Outlet />
   </>
  )
}
