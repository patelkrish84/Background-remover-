import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from '../lib/firebase';

const AuthContext = createContext(null);

const firebaseAuthMessage = (error) => {
  const code = error?.code || '';
  const message = error?.response?.data?.message || error?.message || '';

  if (code === 'auth/configuration-not-found' || message.includes('CONFIGURATION_NOT_FOUND')) {
    return 'Firebase Authentication is not enabled for this project. Enable Email/Password and Google sign-in in Firebase Console, then restart the dev server.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is disabled in Firebase Console.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please sign in instead.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before it finished.';
  }

  return message || 'Authentication failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState(null);

  const setApiToken = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();
    localStorage.setItem('token', token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return token;
  };

  const clearApiToken = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
  };

  const syncSession = async (firebaseUser, extra = {}) => {
    await setApiToken(firebaseUser);
    const res = await axios.post('/api/auth/session', {
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      provider: extra.provider,
    });
    setUser(res.data.user);
    return res.data;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearApiToken();
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await setApiToken(firebaseUser);
        const res = await axios.get('/api/auth/profile');
        setUser(res.data.user);
      } catch {
        clearApiToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return syncSession(credential.user, { provider: 'password' });
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return syncSession(credential.user, { provider: 'password' });
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    return syncSession(credential.user, { provider: 'google.com' });
  };

  const logout = async () => {
    await signOut(auth);
    clearApiToken();
    setUser(null);
    setPendingImage(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const fetchProfile = async () => {
    const res = await axios.get('/api/auth/profile');
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, loginWithGoogle, logout,
      updateUser, pendingImage, setPendingImage, fetchProfile, firebaseAuthMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
