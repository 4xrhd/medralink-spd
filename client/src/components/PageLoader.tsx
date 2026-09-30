import React from 'react';
import { Icon } from '../ui/primitives.js';

export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Loading clinical portal module...',
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6"
    >
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-3 border-[#E2E8F0] border-t-[#1B365D] animate-spin" />
        <div className="absolute inset-0 grid place-items-center text-[#1B365D]">
          <Icon.Cross size={16} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-[#64748B]">
        {message}
      </p>
    </div>
  );
};

export default PageLoader;
