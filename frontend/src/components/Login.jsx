import { useState } from "react";
import { apiRequest } from "../api";

function Login({ setIsAuth, setShowSignup, setShowForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    if (!email.endsWith("@gmail.com") && !email.endsWith("@kluniversity.in")) {
      alert("Email must end with @gmail.com or @kluniversity.in");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("currentUser", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userData", JSON.stringify(data.user));
      setIsAuth(true);
    } catch (error) {
      alert(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container modern-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">🤝</div>
          <h1>Relief Connection</h1>
          <p>Welcome back! Please enter your details.</p>
        </div>

        <div className="login-body">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="forgot-link-container">
            <button className="text-btn small" onClick={() => setShowForgot(true)}>
              Forgot Password?
            </button>
          </div>

          <button 
            className={`primary-btn ${loading ? 'loading' : ''}`} 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <button className="text-btn bold" onClick={() => setShowSignup(true)}>
              Sign up for free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
