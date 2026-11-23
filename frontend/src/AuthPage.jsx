
import { useState } from "react";
import "./AuthPage.css";

const API_URL = import.meta.env.VITE_API_URL;

function AuthPage({ onAuthenticated, onTryDemo }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isRegister = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        const registerResponse = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            password,
          }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(
            registerData.detail || "Could not create your account."
          );
        }
      }

      const loginResponse = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || "Login failed.");
      }

      onAuthenticated(loginData.access_token);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
    setSuccess("");
  };

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one"></div>
      <div className="auth-decoration auth-decoration-two"></div>

      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">D</div>
          <span>dev<span>track</span></span>
        </div>

        <div className="auth-heading">
          <div className="auth-eyebrow">
            <span></span>
            YOUR WORKSPACE STARTS HERE
          </div>

          <h1>
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>

          <p>
            {isRegister
              ? "Set up your account and start bringing your projects together."
              : "Sign in to pick up where your best work left off."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                minLength={2}
                maxLength={100}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              required
            />
            {isRegister && (
              <small>Use at least 8 characters.</small>
            )}
          </label>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister
            ? "Already have an account?"
            : "New to DevTrack?"}

          <button type="button" onClick={switchMode}>
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </div>

        <div className="auth-switch">
          <button type="button" onClick={onTryDemo} disabled={loading}>Try the demo workspace →</button>
        </div>

        <div className="auth-footer">
          <span>© 2026 DevTrack</span>
          <span>Built for focused teams ✦</span>
        </div>
      </section>

      <div className="auth-side-note">
        <div className="auth-side-icon">✦</div>
        <p>Great work happens when everything works together.</p>
        <span>PLAN · BUILD · DELIVER</span>
      </div>
    </main>
  );
}

export default AuthPage;
