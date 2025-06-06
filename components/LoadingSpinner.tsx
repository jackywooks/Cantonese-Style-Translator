
import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center my-4">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-400"></div>
    <p className="ml-3 text-sky-300">Translating...</p>
  </div>
);

export default LoadingSpinner;
