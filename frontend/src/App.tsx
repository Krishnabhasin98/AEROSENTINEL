import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useAppStore, NavigationTab } from './stores/useAppStore';
import { wsClient } from './services/websocket';


// Pages
import { OverviewPage } from './pages/OverviewPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { AirspacePage } from './pages/AirspacePage';
import { FleetPage } from './pages/FleetPage';
import { DepotsPage } from './pages/DepotsPage';
import { SwarmsPage } from './pages/SwarmsPage';
import { MissionsPage } from './pages/MissionsPage';
import { BatteryPage } from './pages/BatteryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    fetchInitialData,
    applyTelemetryUpdate,
    setIsConnected,
    isLoading,
    error
  } = useAppStore();

  useEffect(() => {
    // Sync initial tab from URL hash or query param (e.g. #fleet or ?tab=fleet)
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || hash;
    const validTabs: NavigationTab[] = [
      'overview', 'telemetry', 'airspace', 'fleet', 'depots',
      'swarms', 'missions', 'battery', 'analytics', 'settings'
    ];
    if (tabParam && validTabs.includes(tabParam as NavigationTab)) {
      setActiveTab(tabParam as NavigationTab);
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash && validTabs.includes(currentHash as NavigationTab)) {
        setActiveTab(currentHash as NavigationTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // 1. Initial backend state load
    fetchInitialData();


    // 2. Connect live WebSocket telemetry stream
    wsClient.connect();
    const unsubscribeTelemetry = wsClient.subscribe((data) => {
      applyTelemetryUpdate(data);
    });

    const unsubscribeStatus = wsClient.subscribeStatus((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeTelemetry();
      unsubscribeStatus();
      wsClient.disconnect();
    };
  }, [fetchInitialData, applyTelemetryUpdate, setIsConnected]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'telemetry':
        return <TelemetryPage />;
      case 'airspace':
        return <AirspacePage />;
      case 'fleet':
        return <FleetPage />;
      case 'depots':
        return <DepotsPage />;
      case 'swarms':
        return <SwarmsPage />;
      case 'missions':
        return <MissionsPage />;
      case 'battery':
        return <BatteryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-aerotext-primary flex">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Persistent Top Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 mt-16 p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchInitialData()}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-xs"
              >
                Retry Connection
              </button>
            </div>
          )}

          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
