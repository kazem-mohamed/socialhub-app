import React from 'react'
import Navbar from './../../components/Layout/Navbar/Navbar';
import { Outlet } from 'react-router';
import PageTitle from "../../components/Seo/PageTitle";

export default function MainLayous() {
  return (
    <>
    <PageTitle />
    <Navbar/>
    <Outlet/>
    </>
  )
}
