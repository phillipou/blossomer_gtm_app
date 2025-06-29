import React from 'react';

type ContentBlockProps = {
  children: React.ReactNode;
  className?: string;
};

const ContentBlock: React.FC<ContentBlockProps> = ({ children, className = '' }) => (
  <section className={`bg-white border border-neutral-gray200 rounded-base p-6 shadow ${className}`}>
    {children}
  </section>
);

export default ContentBlock; 