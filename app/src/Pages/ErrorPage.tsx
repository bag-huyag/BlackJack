import React from "react";
import { useRouteError } from "react-router-dom";

interface Error {
  statusText: string;
  message: string;
}

const ErrorPage = () => {
  const error = useRouteError() as Error;
  return (
    <div id="error-page">
      <h1>Упс!</h1>
      <p>Извините, произошла непредвиденная ошибка.</p>
      <p>
        <i>{error?.statusText || error?.message}</i>
      </p>
    </div>
  );
}

export default ErrorPage  