import React from 'react';

type ErrorBannerProps = {
  children: React.ReactNode;
  className?: string;
};

const ErrorBanner: React.FC<ErrorBannerProps> = ({ children, className = '' }) => (
  <div className={`error-banner ${className}`}>{children}</div>
);

export default ErrorBanner; 