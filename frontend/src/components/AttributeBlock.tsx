import React from 'react';

type AttributeBlockProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

const AttributeBlock: React.FC<AttributeBlockProps> = ({ label, value, className = '' }) => (
  <div className={`flex items-center justify-between py-2 border-b border-neutral-gray100 last:border-b-0 text-base text-neutral-gray700 ${className}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default AttributeBlock; 