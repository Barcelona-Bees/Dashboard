import { useState } from "react";
import { register } from "../services/auth";

/**
 * Simple registration page:
 * - Email, password, confirm password
 * - Basic client-side validation
 * - On success, logs the user in and switches to the protected app
 */
export default function RegisterScreen({ onRegisterSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      await register({ email, password });
      // Token is stored by the auth service; we just notify the parent.
      onRegisterSuccess();
    } catch (err) {
      setError(err.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="loginCard">
        <div className="logoBig">BB</div>
        <div className="center" style={{ fontWeight: 900, marginBottom: 6 }}>
          Create your hive account
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <div className="fieldLabel">Email</div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="fieldLabel">Password</div>
            <input
              placeholder="********"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="fieldLabel">Confirm password</div>
            <input
              placeholder="********"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="smallMuted" style={{ color: "var(--danger)", marginTop: 8 }}>
              {error}
            </div>
          )}

          <button className="loginBtn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="center" style={{ marginTop: 12, fontSize: 12 }}>
          <span>Already have an account? </span>
          <button
            type="button"
            className="linkBtn"
            style={{ border: "none", background: "none", padding: 0 }}
            onClick={onSwitchToLogin}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

