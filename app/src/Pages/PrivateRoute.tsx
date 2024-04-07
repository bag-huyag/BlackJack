import React from "react";
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  component: React.FC;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component }) => {
  const isAuthenticated = localStorage.getItem('token') !== null && localStorage.getItem('id') !== null;
  return (
    <>
      {isAuthenticated ? (
      <>
        <Component />
      </>
      ) : <Navigate to="/" replace />}
    </>
  );
};

export default PrivateRoute;
