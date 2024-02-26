import React from "react";
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  component: React.FC;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return (
    <>
      {isAuthenticated ? <Component /> : <Navigate to="/" replace />}
    </>
  );
};

export default PrivateRoute;
