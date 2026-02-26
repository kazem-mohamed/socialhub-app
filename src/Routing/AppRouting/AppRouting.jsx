import { createBrowserRouter } from "react-router-dom";
import MainLayous from "./../../Layouts/MainLayouts/MainLayous";
import Home from "./../../pages/Home/Home";
import Profile from "./../../pages/profile/Profile";
import Notfound from "./../../pages/Notfound/Notfound";
import AuthLayouts from "./../../Layouts/AuthLayouts/AuthLayouts";
import Login from "./../../pages/Auth/Login/Login";
import Register from "./../../pages/Auth/Register/Register";
import ProtectedRoutes from "../ProtectedRoutes/ProtectedRoutes";
import ProtectedAuthRoutes from "../ProtectedRoutes/ProtectedAuthRoutes";
import PostDetails from './../../pages/PostDetails/PostDetails';
import Notifications from "./../../pages/Notifications/Notifications";
import Setting from "../../pages/Setting/Setting";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayous />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoutes>
            <Home />
          </ProtectedRoutes>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoutes>
            <Profile />
          </ProtectedRoutes>
        ),
      },
        {
        path: "Setting",
        element: (
          <ProtectedRoutes>
            <Setting />
          </ProtectedRoutes>
        ),
      },
         {
        path: "notifications",
        element: (
          <ProtectedRoutes>
            <Notifications />
          </ProtectedRoutes>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <ProtectedRoutes>
            <Profile />
          </ProtectedRoutes>
        ),
      },
       {
        path: "PostDetails/:id",
        element: (
          <ProtectedRoutes>
            <PostDetails />
          </ProtectedRoutes>
        ),
      },
      {
        path: "*",
        element: (
          <ProtectedRoutes>
            <Notfound />
          </ProtectedRoutes>
        ),
        
      },
    ],
  },
  {
    path: "auth",
    element: <AuthLayouts />,
    children: [
      {
        path: "login",
        element: (
          <ProtectedAuthRoutes>
            <Login />
          </ProtectedAuthRoutes>
        ),
      },
      {
        path: "register",
        element: (
          <ProtectedAuthRoutes>
            <Register />
          </ProtectedAuthRoutes>
        ),
      },
    ],
  },
]);
