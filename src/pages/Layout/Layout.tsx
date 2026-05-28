import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import WelcomeView from '../Welcome/WelcomeView';
import RegistrationView from '../Registration/RegistrationView/RegistrationView';
import CSVUploader from '../../components/CSVUploader/CSVUploader';
import Statistics from '../Statistics/Statistics';
import Attendance from '../Attendance/Attendance';
import AdminUsers from '../Admin/AdminUsers';
import ValienteProfileView from '../ValienteProfile/ValienteProfileView';
import ValientesListView from '../ValienteProfile/ValientesListView';
import ValienteEditView from '../ValienteProfile/ValienteEditView';
import { getValientes } from '../../lib/services/valientes.service';
import type { Valiente } from '../../types/database.types';
import './Layout.css';

type AppContext = 'GLOBAL' | 'TRIBU' | 'SOROCA';

interface LayoutProps {
  onLogout?: () => void;
  usuarioId?: string | null;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, usuarioId = null }) => {
  const [activeView, setActiveView] = useState('welcome');
  const [appContext, setAppContext] = useState<AppContext>('GLOBAL');
  const [selectedValienteId, setSelectedValienteId] = useState<number | null>(null);
  const [editingValienteId,  setEditingValienteId]  = useState<number | null>(null);
  const [allValientes, setAllValientes] = useState<Valiente[]>([]);

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

  const handleSelectValiente = (id: number) => {
    setSelectedValienteId(id);
    setEditingValienteId(null);
    setActiveView('valientes-directory');
  };

  const handleEditValiente = (id: number) => {
    setEditingValienteId(id);
    setActiveView('valientes-edit');
  };

  useEffect(() => {
    getValientes().then(setAllValientes).catch(() => {});
  }, []);

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
    if (activeView === 'attendance')   return <Attendance usuarioId={usuarioId} context={appContext} />;
    if (activeView === 'admin-users')  return <AdminUsers currentUsuarioId={usuarioId} />;
    if (activeView === 'directorio') {
      return (
        <ValientesListView
          onSelectValiente={handleSelectValiente}
          context={appContext}
        />
      );
    }
    if (activeView === 'valientes-directory' && selectedValienteId !== null) {
      return (
        <ValienteProfileView
          valienteId={selectedValienteId}
          allValientes={allValientes}
          onSelectValiente={handleSelectValiente}
          onBack={() => {
            setSelectedValienteId(null);
            setActiveView('directorio');
          }}
          onEdit={handleEditValiente}
          context={appContext}
        />
      );
    }
    if (activeView === 'valientes-edit' && editingValienteId !== null) {
      return (
        <ValienteEditView
          valienteId={editingValienteId}
          context={appContext}
          onBack={() => {
            setActiveView('valientes-directory');
          }}
        />
      );
    }
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