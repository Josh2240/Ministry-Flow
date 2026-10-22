import React, { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";

/**
 * @typedef {{ type: string, message: string }} AuthError
 *
 * @typedef {{
 *   status?: number,
 *   message?: string,
 *   data?: { extra_data?: { reason?: string } }
 * }} ApiError
 *
 * @typedef {{
 *   user: any,
 *   isAuthenticated: boolean,
 *   isLoadingAuth: boolean,
 *   isLoadingPublicSettings: boolean,
 *   authError: AuthError | null,
 *   appPublicSettings: any,
 *   authChecked: boolean,
 *   logout: (shouldRedirect?: boolean) => void,
 *   navigateToLogin: () => void,
 *   checkUserAuth: () => Promise<void>,
 *   checkAppState: () => Promise<void>
 * }} AuthContextValue
 */

/** @type {React.Context<AuthContextValue | null>} */
const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/** @param {{ children?: React.ReactNode }} props */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {any} */ (null));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(/** @type {AuthError | null} */ (null));
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(/** @type {any} */ (null));

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      try {
        const publicSettings = await base44.app.getPublicSettings();
        setAppPublicSettings(publicSettings);
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error("App state check failed:", appError);
        const err = /** @type {ApiError} */ (appError);
        const reason = err?.data?.extra_data?.reason;
        if (err?.status === 403 && reason) {
          if (reason === "auth_required") {
            setAuthError({ type: "auth_required", message: "Authentication required" });
          } else if (reason === "user_not_registered") {
            setAuthError({ type: "user_not_registered", message: "User not registered for this app" });
          } else {
            setAuthError({ type: reason, message: err.message || "Error" });
          }
        } else {
          setAuthError({ type: "unknown", message: err?.message || "Failed to load app" });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      const err = /** @type {ApiError} */ (error);
      setAuthError({ type: "unknown", message: err?.message || "An unexpected error occurred" });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error("User auth check failed:", error);
      const err = /** @type {ApiError} */ (error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (err?.status === 401 || err?.status === 403) {
        setAuthError({ type: "auth_required", message: "Authentication required" });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};