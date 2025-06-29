import React from 'react';

type HeaderBarProps = {
  onSignIn?: () => void;
};

const HeaderBar: React.FC<HeaderBarProps> = ({ onSignIn }) => (
  <header className="w-full max-w-screen-xl mx-auto flex justify-between items-center py-6 px-4">
    <div className="text-xl font-bold text-primary-base">Blossomer</div>
    <button className="btn-secondary" onClick={onSignIn}>Sign in</button>
  </header>
);

export default HeaderBar; 