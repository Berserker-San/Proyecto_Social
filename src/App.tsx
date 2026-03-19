import { useAuth } from './lib/hooks/useAuth';
import { Login } from './pages/Login/Login';
import Layout from './pages/Layout/Layout';

function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;

  return <Layout onLogout={signOut} />;
}

export default App;
