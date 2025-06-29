import React, { useState } from 'react';
import HeaderBar from '../components/HeaderBar';
import SandboxCard from '../components/SandboxCard';
// If you have a design system icon set, import icons here. Otherwise, use placeholders.

const features = [
  {
    icon: (
      <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4">
        {/* Replace with your Target icon */}
        <span className="text-primary-base text-2xl">🎯</span>
      </div>
    ),
    title: 'Company Analysis',
    description: 'Deep insights into your business model, value proposition, and market positioning',
  },
  {
    icon: (
      <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4">
        {/* Replace with your Users icon */}
        <span className="text-primary-base text-2xl">👥</span>
      </div>
    ),
    title: 'Target Customers',
    description: 'Identify ideal customer profiles, personas, and prospecting sources',
  },
  {
    icon: (
      <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4">
        {/* Replace with your TrendingUp icon */}
        <span className="text-primary-base text-2xl">📈</span>
      </div>
    ),
    title: 'Campaign Ideas',
    description: 'AI-generated marketing campaigns and go-to-market strategies',
  },
];

const Landing: React.FC = () => {
  const [url, setUrl] = useState('');
  const [icp, setIcp] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      // In real implementation, redirect to dashboard or show results
      console.log('Analyzing:', { url, icp });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-hero bg-hero-gradient bg-no-repeat bg-top">
      {/* Navigation/Header */}
      <HeaderBar />

      {/* Promo Banner */}
      <div className="bg-primary-light/20 border-b border-primary-light">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-primary-base">
            {/* Replace with your Sparkles icon if available */}
            <span className="text-lg">✨</span>
            <span>Get your first GTM analysis free - no credit card required</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 py-6xl px-4">
        {/* Badge/Callout */}
        <div className="mb-6">
          <span className="inline-block bg-primary-light/60 text-primary-base font-medium px-4 py-2 rounded-pill text-md shadow-xs">
            🚀 For Early-Stage B2B Founders
          </span>
        </div>
        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black mb-8 text-center leading-tight">
          <span className="text-neutral-black">AI-powered GTM</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-base to-primary-dark">
            for startups & founders
          </span>
        </h1>
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-neutral-gray700 text-center max-w-2xl mb-10 md:mb-16">
          Transform your website URL into a complete Go-to-Market strategy. Get company insights, target customers, and campaign ideas powered by AI.
        </p>
        {/* Form Card (SandboxCard or inline form) */}
        <div className="w-full flex justify-center mb-8">
          {/* If SandboxCard is a form, use it. Otherwise, recreate the form here. */}
          <div className="max-w-2xl w-full bg-neutral-white rounded-2xl shadow-lg p-8">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAnalyze();
              }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-neutral-gray700 mb-2 text-left">
                  Website URL *
                </label>
                <div className="relative">
                  <input
                    id="url"
                    type="url"
                    placeholder="https://your-startup.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="pr-12 h-12 text-lg border border-neutral-gray300 rounded-lg w-full focus:border-primary-base focus:ring-primary-base px-4"
                    required
                  />
                  {/* Replace with your ArrowRight icon if available */}
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-gray400 text-xl">→</span>
                </div>
              </div>
              <div>
                <label htmlFor="icp" className="block text-sm font-medium text-neutral-gray700 mb-2 text-left">
                  Ideal Customer Profile (Optional)
                </label>
                <textarea
                  id="icp"
                  placeholder="e.g., B2B SaaS companies with 50-200 employees in the fintech space..."
                  value={icp}
                  onChange={e => setIcp(e.target.value)}
                  className="min-h-[100px] border border-neutral-gray300 rounded-lg w-full focus:border-primary-base focus:ring-primary-base px-4 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={!url.trim() || isAnalyzing}
                className="w-full h-12 text-lg bg-primary-base hover:bg-primary-dark text-white rounded-lg disabled:opacity-50 flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing website...
                  </>
                ) : (
                  <>
                    Generate GTM Strategy
                    <span className="ml-2 text-xl">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-10 w-full max-w-5xl">
          {features.map((feature, idx) => (
            <div key={idx} className="text-center">
              {feature.icon}
              <h3 className="text-lg font-semibold text-neutral-black mb-2">{feature.title}</h3>
              <p className="text-neutral-gray700">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing; 