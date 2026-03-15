import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ims_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ims_user') || 'null'); } catch { return null; }
  });

  const fetchMe = async (tok) => {
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('ims_user', JSON.stringify(data.user));
      }
    } catch {}
  };

  const login = (newToken) => {
    localStorage.setItem('ims_token', newToken);
    setToken(newToken);
    fetchMe(newToken);
  };

  const logout = () => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token && !user) fetchMe(token);
  }, [token]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('ims:logout', handler);
    return () => window.removeEventListener('ims:logout', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
