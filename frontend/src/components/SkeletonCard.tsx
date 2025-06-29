import React from 'react';

type SkeletonCardProps = {
  className?: string;
};

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`}></div>
);

export default SkeletonCard; 