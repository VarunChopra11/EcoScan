import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { LandingPage } from './components/Landing/LandingPage';
import { TestApp } from './components/TestMode/TestApp';
import { ProductionApp } from './components/Production/ProductionApp';
import { checkHealth } from './services/api';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    // Check URL query param e.g. ?mode=test or ?mode=prod
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'test' || m === 'prod') return m;
    return 'landing';
  });

  const [isAzure, setIsAzure] = useState<boolean>(false);
  const [dbMode, setDbMode] = useState<string>('persistent_storage');

  useEffect(() => {
    checkHealth()
      .then((h) => {
        setIsAzure(h.azure_openai_configured);
        if (h.database_mode) setDbMode(h.database_mode);
      })
      .catch(() => {});
  }, []);

  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    const url = new URL(window.location.href);
    if (mode === 'landing') {
      url.searchParams.delete('mode');
    } else {
      url.searchParams.set('mode', mode);
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <>
      {appMode === 'landing' && (
        <LandingPage
          onSelectTestMode={() => handleSelectMode('test')}
          onSelectProdMode={() => handleSelectMode('prod')}
          isAzure={isAzure}
          dbMode={dbMode}
        />
      )}

      {appMode === 'test' && (
        <TestApp
          onBackToLanding={() => handleSelectMode('landing')}
          onSwitchToProd={() => handleSelectMode('prod')}
        />
      )}

      {appMode === 'prod' && (
        <ProductionApp
          onBackToLanding={() => handleSelectMode('landing')}
          onSwitchToTestBuild={() => handleSelectMode('test')}
        />
      )}
    </>
  );
};

export default App;
