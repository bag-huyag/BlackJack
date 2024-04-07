import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';

import Dashboard from "./pages/Dashboard";
import ErrorPage from "./pages/ErrorPage";
import Game from "./pages/Game";
import Games from "./pages/Games";
import Login from "./pages/Login";
import PrivateRoute from "./pages/PrivateRoute";
import Signup from "./pages/Signup";

import App from "./App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/error",
    element: <ErrorPage />,
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
