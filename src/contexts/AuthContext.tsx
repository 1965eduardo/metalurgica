import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  authToken: string | null;
  adminEmail: string | null;
  handleLogin: (token: string, email: string) => void;
  handleLogout: () => void;
  isAdminLoggedIn: boolean;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('fardin_admin_token') || null;
  });
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    return localStorage.getItem('fardin_admin_email') || null;
  });
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fardin_admin_edit_mode');
    if (saved !== null) return saved === 'true';
    return Boolean(localStorage.getItem('fardin_admin_token'));
  });

  useEffect(() => {
    if (authToken) {
      const saved = localStorage.getItem('fardin_admin_edit_mode');
      if (saved === null) {
        setIsEditMode(true);
      }
    } else {
      setIsEditMode(false);
    }
  }, [authToken]);

  const handleSetEditMode: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    setIsEditMode((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('fardin_admin_edit_mode', String(next));
      return next;
    });
  };

  const handleLogin = (token: string, email: string) => {
    setAuthToken(token);
    setAdminEmail(email);
    setIsEditMode(true);
    localStorage.setItem('fardin_admin_token', token);
    localStorage.setItem('fardin_admin_email', email);
    localStorage.setItem('fardin_admin_edit_mode', 'true');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAdminEmail(null);
    setIsEditMode(false);
    localStorage.removeItem('fardin_admin_token');
    localStorage.removeItem('fardin_admin_email');
    localStorage.removeItem('fardin_admin_edit_mode');
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        adminEmail,
        handleLogin,
        handleLogout,
        isAdminLoggedIn: Boolean(authToken),
        isEditMode: Boolean(authToken) && isEditMode,
        setIsEditMode: handleSetEditMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
