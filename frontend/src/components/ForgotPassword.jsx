import { useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

function ForgotPassword({ setShowForgot }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
       alert("Please enter your email");
       return;
    }
    if (!normalizedEmail.endsWith("@gmail.com") && !normalizedEmail.endsWith("@kluniversity.in")) {
      alert("Please enter a valid @gmail.com or @kluniversity.in address");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(apiUrl("/api/forgot-password"), { email: normalizedEmail });
      alert(response.data.message);
      setEmail(normalizedEmail);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }
    if (!newPassword) {
      alert("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(apiUrl("/api/verify-otp"), {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      alert(response.data.message);
      setShowForgot(false);
    } catch (err) {
      alert(err.response?.data?.error || "Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container modern-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">🔑</div>
          <h1>Reset Password</h1>
          <p>
            {step === 1 
              ? "We'll send a verification code to your email." 
              : "Enter the code and set your new password."}
          </p>
        </div>

        <div className="login-body">
          {step === 1 ? (
            <div className="input-group">
              <label>Registered Email</label>
              <input
                type="email"
                placeholder="e.g. name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button 
                className={`primary-btn ${loading ? 'loading' : ''}`} 
                onClick={handleSendOTP} 
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>
            </div>
          ) : (
            <>
              <div className="input-group">
                <label>Verification Code (OTP)</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button 
                className={`primary-btn ${loading ? 'loading' : ''}`} 
                onClick={handleVerifyOTP} 
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}
        </div>

        <div className="login-footer">
          <button className="text-btn bold" onClick={() => setShowForgot(false)}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
