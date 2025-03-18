// File: client/src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-4 text-gray-600">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center">
          <Link
            to="/"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Go Back Home
          </Link>
          <Link
            to="/dashboard"
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Or go to your Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;