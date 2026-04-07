import { createContext, useContext, useState, useEffect } from 'react';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

// Decode groups and build user object from Amplify session
async function buildUserFromSession() {
  try {
    const [sessionResult, currentUser] = await Promise.all([
      fetchAuthSession(),
      getCurrentUser(),
    ]);
    const payload = sessionResult.tokens?.idToken?.payload;
    if (!payload) return null;
    const groups = payload['cognito:groups'] || [];
    const role = groups.includes('Premium') ? 'Premium' : 'Free';
    const idToken = sessionResult.tokens.idToken.toString();
    const email = payload.email || currentUser.username;
    // Display name stored locally (Cognito identity is the source of truth for auth)
    const displayName = localStorage.getItem(`displayName:${email}`) || email.split('@')[0];
    return { email, username: displayName, role, idToken };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    buildUserFromSession().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Register: creates Cognito user, sends verification email
  // Returns { error } on failure, { needsConfirm: true } if verification needed
  async function register(email, password) {
    try {
      const result = await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        return { needsConfirm: true };
      }
      return {};
    } catch (err) {
      return { error: err.message || 'Registration failed.' };
    }
  }

  // Confirm registration with the code sent to email
  async function confirmRegistration(email, code) {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return {};
    } catch (err) {
      return { error: err.message || 'Confirmation failed.' };
    }
  }

  // Login: authenticates with Cognito and loads user session
  // Returns { error } on failure
  async function login(email, password) {
    try {
      const result = await signIn({ username: email, password });
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        return { error: 'Please verify your email before signing in.' };
      }
      const u = await buildUserFromSession();
      setUser(u);
      return {};
    } catch (err) {
      if (err.name === 'UserNotConfirmedException') {
        return { error: 'Please verify your email before signing in.' };
      }
      return { error: err.message || 'Login failed.' };
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  // Refresh idToken (call before API requests if needed)
  async function refreshSession() {
    const u = await buildUserFromSession();
    if (u) setUser(u);
    return u;
  }

  // Update display name: stored in localStorage, keyed by email
  // Returns an error string on failure, null on success
  function updateUsername(newUsername) {
    const trimmed = newUsername.trim();
    if (!trimmed) return 'Username cannot be empty.';
    if (trimmed.length > 30) return 'Username must be 30 characters or fewer.';
    localStorage.setItem(`displayName:${user.email}`, trimmed);
    setUser({ ...user, username: trimmed });
    return null;
  }

  // Upgrade / renew: local session override for demo purposes only.
  // Real role comes from Cognito groups (assigned by admin).
  function upgrade() {
    if (!user) return;
    setUser({ ...user, role: 'Premium', upgradeDate: new Date().toISOString() });
  }

  function renew() {
    if (!user) return;
    setUser({ ...user, upgradeDate: new Date().toISOString() });
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout,
      register, confirmRegistration,
      upgrade, renew,
      updateUsername,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
