import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Farm from './pages/Farm';
import Weather from './pages/Weather';
import Disease from './pages/Disease';
import Decision from './pages/Decision';
import Irrigation from './pages/Irrigation';
import {
  Alerts,
  Market,
  Schemes,
  Procurement,
  Calendar,
  Cost,
  Timeline,
  Chat,
  Settings
} from './pages/Generic';
export default function App() {
  const { session, page } = useApp();
  if (!session) {
    return <Auth />;
  }
  const logout = () => {
    localStorage.removeItem('sf_token');
    window.location.reload();
  };
  const pages = {
    dashboard: <Dashboard />,
    farm: <Farm />,
    weather: <Weather />,
    disease: <Disease />,
    recommendations: <Decision />,
    irrigation: <Irrigation />,
    alerts: <Alerts />,
    calendar: <Calendar />,
    cost: <Cost />,
    market: <Market />,
    schemes: <Schemes />,
    procurement: <Procurement />,
    timeline: <Timeline />,
    chat: <Chat />,
    settings: <Settings />
  };
  return (
    <Layout onLogout={logout}>
      <ErrorBoundary>
        {pages[page] || <Dashboard />}
      </ErrorBoundary>
    </Layout>
  );
}
