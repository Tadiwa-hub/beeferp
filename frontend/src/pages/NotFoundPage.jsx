import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 text-center">
      <span className="text-7xl block mb-4">🌾</span>
      <h1 className="text-5xl font-black font-serif text-primary m-0 tracking-tight">404</h1>
      <h2 className="text-xl font-bold font-serif text-accent mt-2 mb-4">Registry Record Not Found</h2>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        The feedlot directory page you are looking for has been moved, archived, or does not exist in the active herd registries.
      </p>
      <Link
        to="/"
        className="btn-premium px-6 py-3 rounded-lg bg-primary hover:bg-primary-light text-white font-bold shadow-md transition-all text-sm"
      >
        Back to Dashboard 📊
      </Link>
    </div>
  );
};

export default NotFoundPage;
