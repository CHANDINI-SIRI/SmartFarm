import { createContext, useContext, useEffect, useState } from 'react';
const API =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';
const labels = {
  dashboard: 'Dashboard',
  farm: 'My Farm',
  weather: 'Weather',
  disease: 'Disease AI',
  recommendations: 'AI Advice',
  irrigation: 'Irrigation',
  alerts: 'Alerts',
  calendar: 'Crop Calendar',
  cost: 'Cost Saving',
  market: 'Market',
  schemes: 'Government Schemes',
  procurement: 'Procurement',
  timeline: 'Farm Timeline',
  chat: 'Ask AI',
  settings: 'Settings',
  logout: 'Logout',
  welcome: 'Good day',
  soil: 'Farmer-assessed field condition',
  save: 'Save',
  loading: 'Loading...',
  noFarm: 'Create your farm profile to start.'
};
const C = createContext(null);
export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [farm, setFarm] = useState(null);
  const [lang, setLang] = useState(
    localStorage.getItem('sf_lang') || 'en'
  );
  const [page, setPage] = useState('dashboard');
  useEffect(() => {
    localStorage.setItem('sf_lang', lang);
  }, [lang]);
  useEffect(() => {
    const token = localStorage.getItem('sf_token');
    if (!token) {
      setSession(null);
      setProfile(null);
      setFarm(null);
      return;
    }
    async function loadUser() {
      try {
        const response = await fetch(
          `${API}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (!response.ok) {
          throw new Error('Authentication expired');
        }
        const user = await response.json();
        setSession({
          access_token: token,
          user
        });
        setProfile(user);
        if (
          user.preferred_language &&
          ['en', 'te', 'hi'].includes(user.preferred_language)
        ) {
          setLang(user.preferred_language);
        }
        const farmResponse = await fetch(
          `${API}/api/farms/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (farmResponse.ok) {
          const farmData = await farmResponse.json();
          setFarm(
            farmData?.farms?.[0] ||
            farmData?.farm ||
            null
          );
        } else {
          setFarm(null);
        }
      } catch (error) {
        console.error('AUTH CONTEXT ERROR:', error);
        localStorage.removeItem('sf_token');
        setSession(null);
        setProfile(null);
        setFarm(null);
      }
    }
    loadUser();
  }, []);
  // Existing pages already call t('key').
  // AutoTranslator handles Telugu/Hindi translation.
  const t = (key) => labels[key] || key;
  return (
    <C.Provider
      value={{
        session,
        setSession,
        profile,
        setProfile,
        farm,
        setFarm,
        lang,
        setLang,
        page,
        setPage,
        t
      }}
    >
      {children}
    </C.Provider>
  );
}
export const useApp = () => useContext(C);
