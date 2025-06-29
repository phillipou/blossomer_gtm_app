import React, { useState } from 'react';

type SandboxCardProps = {
  onStart?: (url: string, icp: string) => void;
  onEnhance?: (icp: string) => void;
};

const SandboxCard: React.FC<SandboxCardProps> = ({ onStart, onEnhance }) => {
  const [url, setUrl] = useState('');
  const [icp, setIcp] = useState('');

  return (
    <div className="card-container">
      <input
        type="text"
        placeholder="Enter your website URL"
        className="input input-full mb-2"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Ideal Customer Profile (optional)"
          className="input input-flex"
          value={icp}
          onChange={e => setIcp(e.target.value)}
        />
        <button
          className="btn-ghost"
          type="button"
          onClick={() => onEnhance?.(icp)}
        >
          ✨ Enhance
        </button>
      </div>
      <button
        className="btn-primary w-full mt-2"
        type="button"
        onClick={() => onStart?.(url, icp)}
      >
        Start for free
      </button>
      {/* TODO: Add validation, loading, and error handling */}
      {/* TODO: Integrate <SkeletonCard /> and <ErrorBanner /> for loading and error states */}
    </div>
  );
};

export default SandboxCard; 