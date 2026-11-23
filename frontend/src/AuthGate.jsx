
import { useEffect, useState } from "react";
import App from "./App";
import AuthPage from "./AuthPage";
import { createDemoWorkspace } from "./demoWorkspace";

const API_URL = import.meta.env.VITE_API_URL;

function AuthGate() {
  const [token, setToken] = useState(
    () => localStorage.getItem("devtrack_token")
  );

  const [demoRequest, setDemoRequest] = useState(null);
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch {
        localStorage.removeItem("devtrack_token");

        if (!cancelled) {
          setToken(null);
          setChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAuthenticated = (newToken) => {
    localStorage.setItem("devtrack_token", newToken);
    setToken(newToken);
  };

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark">D</div>
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  if (demoRequest) {
    return <App request={demoRequest} onExitDemo={() => setDemoRequest(null)} />;
  }

  if (!token) {
    return <AuthPage onAuthenticated={handleAuthenticated}
      onTryDemo={() => setDemoRequest(() => createDemoWorkspace())} />;
  }

  return <App />;
}

export default AuthGate;
