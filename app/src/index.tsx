import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import ErrorPage from "./Pages/ErrorPage";
import Login from "./Pages/Login/Login";
import Signup from "./Pages/Signup/Signup";
import Dashboard from "./Pages/Dashboard/Dashboard";
import PrivateRoute from "./Pages/PrivateRoute";
import Games from "./Pages/Games/Games";
import Game from "./Pages/Game/Game"; // bruh, wtf is this naming convention I just created

import App from "./App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/signup",
    element: <Signup />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/error",
    element: <ErrorPage />,
  },
  {
    path: "/dashboard",
    element: <PrivateRoute component={Dashboard} />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/games",
    element: <PrivateRoute component={Games} />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/game/:code",
    element: <PrivateRoute component={Game} />,
    errorElement: <ErrorPage />,
  },
]);

const node = document.getElementById("root") as HTMLElement;

createRoot(node).render(
  <RouterProvider router={router} />
);
