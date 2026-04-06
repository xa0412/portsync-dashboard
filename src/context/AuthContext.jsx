import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Helpers for the local accounts store
function getAccounts() {
  return JSON.parse(localStorage.getItem('accounts') || '{}');
}
function saveAccounts(accounts) {
  localStorage.setItem('accounts', JSON.stringify(accounts));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  // Register: stores account in localStorage
  // Returns null on success, or an error string
  // TODO: replace with Cognito Auth.signUp() once Member 2 provides IDs
  function register(email, password) {
    const accounts = getAccounts();
    if (accounts[email]) return 'An account with this email already exists.';
    const role = email.includes('premium') ? 'Premium' : 'Free';
    // Set upgradeDate now for accounts that start as Premium via email
    const upgradeDate = role === 'Premium' ? new Date().toISOString() : null;
    accounts[email] = { password, role, upgradeDate };
    saveAccounts(accounts);
    return null;
  }

  // Login: checks against localStorage accounts
  // Returns null on success, or an error string
  // TODO: replace with Cognito Auth.signIn() once Member 2 provides IDs
  function login(email, password) {
    const accounts = getAccounts();
    const account = accounts[email];
    if (!account) return 'No account found with this email.';
    if (account.password !== password) return 'Incorrect password.';
    const userData = {
      email,
      role: account.role,
      upgradeDate: account.upgradeDate || null,
      username: account.username || email.split('@')[0],
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return null;
  }

  // Update username: stores new username in accounts store and current session
  // Returns null on success, or an error string
  function updateUsername(newUsername) {
    const trimmed = newUsername.trim();
    if (!trimmed) return 'Username cannot be empty.';
    if (trimmed.length > 30) return 'Username must be 30 characters or fewer.';
    const accounts = getAccounts();
    if (accounts[user.email]) accounts[user.email].username = trimmed;
    saveAccounts(accounts);
    const updated = { ...user, username: trimmed };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return null;
  }

  // Upgrade: bumps the current user's role to Premium, stores upgrade date for 30-day countdown
  function upgrade() {
    const accounts = getAccounts();
    if (!user) return;
    const upgradeDate = new Date().toISOString();
    if (accounts[user.email]) {
      accounts[user.email].role = 'Premium';
      accounts[user.email].upgradeDate = upgradeDate;
    }
    saveAccounts(accounts);
    const upgraded = { ...user, role: 'Premium', upgradeDate };
    localStorage.setItem('user', JSON.stringify(upgraded));
    setUser(upgraded);
  }

  // Renew: resets upgradeDate to now, giving another 30 days
  function renew() {
    const accounts = getAccounts();
    if (!user) return;
    const upgradeDate = new Date().toISOString();
    if (accounts[user.email]) accounts[user.email].upgradeDate = upgradeDate;
    saveAccounts(accounts);
    const renewed = { ...user, upgradeDate };
    localStorage.setItem('user', JSON.stringify(renewed));
    setUser(renewed);
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, upgrade, renew, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
