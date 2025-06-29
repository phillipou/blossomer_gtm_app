import React from 'react';
import HeaderBar from '../components/HeaderBar';
import SandboxCard from '../components/SandboxCard';

// TODO: Extract HeaderBar, SandboxCard, and other components as needed

const Landing: React.FC = () => {
  return (
    <div className="page-bg">
      <HeaderBar />
      {/* Hero Section */}
      <section className="section-hero">
        <h1 className="section-title">
          AI-powered Go-to-Market Dashboard
        </h1>
        <p className="section-subtitle">
          Paste your startup's website URL and (optionally) ICP to generate a complete GTM workspace in seconds.
        </p>
      </section>
      <SandboxCard />
      {/* TODO: Add loading state, error banners, and skeleton cards as per PRD */}
    </div>
  );
};

export default Landing; 