import { useState } from "react";
import { apiRequest } from "../api";

function Signup({ setShowSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      alert("Please fill in all fields");
      return;
    }

    if (!email.endsWith("@gmail.com") && !email.endsWith("@kluniversity.in")) {
      alert("Email must end with @gmail.com or @kluniversity.in");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      alert("Account created successfully! Please login.");
      setShowSignup(false);
    } catch (error) {
      alert(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container modern-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">✨</div>
          <h1>Create Account</h1>
          <p>Join Relief Connection and start making a difference.</p>
        </div>

        <div className="login-body">
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label>Mobile Number</label>
            <input
              type="text"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            className={`primary-btn ${loading ? 'loading' : ''}`} 
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>

        <div className="login-footer">
          <p>
            Already have an account?{" "}
            <button className="text-btn bold" onClick={() => setShowSignup(false)}>
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
