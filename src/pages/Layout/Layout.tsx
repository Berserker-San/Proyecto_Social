import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import WelcomeView from '../Welcome/WelcomeView';
import RegistrationView from '../Registration/RegistrationView/RegistrationView';
import CSVUploader from '../../components/CSVUploader/CSVUploader';
import Statistics from '../Statistics/Statistics';
import './Layout.css';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';

interface LayoutProps {
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState('welcome');
  const [appContext, setAppContext] = useState<AppContext>('GLOBAL');

  const handleSelectProgram = (program: 'TRIBU' | 'SOROCA') => {
    setAppContext(program);
    setActiveView('registration');
  };

  const handleContextSwitch = (program: 'TRIBU' | 'SOROCA') => {
    setAppContext(program);
  };

  const handleLogoClick = () => {
    setActiveView('welcome');
    setAppContext('GLOBAL');
  };

  const handleChangeProgram = () => {
    setAppContext('GLOBAL');
    setActiveView('registration');
  };

  const renderContent = () => {
    if (activeView === 'welcome') return <WelcomeView onSelectProgram={handleSelectProgram} />;
    if (activeView === 'registration') {
      return (
        <RegistrationView
          key={appContext}
          context={appContext}
          onChangeProgram={handleChangeProgram}
        />
      );
    }
    if (activeView === 'csv-upload') return <CSVUploader onBack={() => setActiveView('welcome')} />;
    if (activeView === 'estadisticas') return <Statistics context={appContext} />;
    return null;
  };

  return (
    <div className="layout-root">
      <Navbar
        activeView={activeView}
        onChangeView={setActiveView}
        onLogoClick={handleLogoClick}
        context={appContext}
        onContextSwitch={handleContextSwitch}
        onLogout={onLogout}
      />

      <main className="layout-main">
        <div className="layout-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Layout;