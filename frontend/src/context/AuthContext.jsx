import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken, getToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!getToken() && !user);

  useEffect(() => {
    if (getToken() && !user) {
      api.get('/auth/me').then(u => {
        setUser(u);
        localStorage.setItem('tf_user', JSON.stringify(u));
      }).catch(() => {
        removeToken();
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('tf_user', JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await api.post('/auth/signup', { name, email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('tf_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
