import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import ImageSlider from "../../components/ImageSlider";
import "../../styles/Register.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [otpSentEmail, setOtpSentEmail] = useState("");

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  /* ================= LOGIN SEND OTP ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!email || !password) {
      setErrors({ backend: "Email and password required" });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpSentEmail(email);
        setSuccessMessage("OTP sent to your email");
      } else {
        setErrors({ backend: result.message });
      }
    } catch {
      setErrors({ backend: "Backend not reachable" });
    }
  };

  /* ================= VERIFY LOGIN OTP ================= */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!otp) {
      setErrors({ backend: "Please enter OTP" });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpSentEmail, otp: otp.trim() }),
      });

      const result = await response.json();
      console.log("OTP verify result:", result);

      if (response.ok) {
        const userToStore = {
          id: result.userId || result.user._id,
          email: result.email || otpSentEmail,
          role: result.role,
          name: result.name || result.fullName || "User",
          avatar: result.avatar || null,
        };

        localStorage.setItem("user", JSON.stringify(userToStore));
        console.log("✅ Logged-in user:", userToStore);

        setSuccessMessage("Login successful! Redirecting...");

        setTimeout(() => {
          switch (userToStore.role?.toLowerCase()) {
            case "admin":
              navigate("/admin", { replace: true });
              break;
            case "recruiter":
              navigate("/RecruiterDashboard", { replace: true });
              break;
            case "user":
            default:
              navigate("/UserDashboard", { replace: true });
              break;
          }
        }, 1500);
      } else {
        setErrors({ backend: result.message });
      }
    } catch (err) {
      console.error(err);
      setErrors({ backend: "Backend not reachable" });
    }
  };

  /* ================= FORGOT PASSWORD SEND OTP ================= */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!email) {
      setErrors({ backend: "Email required" });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setResetOtpSent(true);
        setSuccessMessage("Reset OTP sent to your email");
      } else {
        setErrors({ backend: result.message });
      }
    } catch {
      setErrors({ backend: "Backend not reachable" });
    }
  };

  /* ================= RESET PASSWORD ================= */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!otp || !newPassword) {
      setErrors({ backend: "OTP and new password required" });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Password reset successful! You can now login.");
        setForgotMode(false);
        setResetOtpSent(false);
        setOtp("");
        setNewPassword("");
      } else {
        setErrors({ backend: result.message });
      }
    } catch {
      setErrors({ backend: "Backend not reachable" });
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      background: "#f3f4f6",
    }}>

      {/* LEFT PANEL - Image Slider */}
      <div
        style={{ flex: 1, minHeight: "100vh", overflow: "hidden" }}
        className="d-none d-md-block"
      >
        <ImageSlider />
      </div>

      {/* ✅ RIGHT PANEL — Fixed */}
      <div style={{
        flex: "0 0 auto",
        width: "100%",
        maxWidth: "460px",
        height: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        padding: "48px 44px",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.08)",
        overflowY: "auto",
        position: "relative",
        zIndex: 10,
      }}>

        {/* Logo / Brand */}
        <div style={{ marginBottom: "36px", textAlign: "center" }}>
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 6px 18px rgba(99,102,241,0.4)",
          }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
                fill="#fff"
              />
            </svg>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: "24px", color: "#111827", margin: 0, letterSpacing: "-0.3px" }}>
            {forgotMode ? "Reset Password" : "Welcome Back"}
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px", marginBottom: 0 }}>
            {forgotMode
              ? "Enter your details to recover access"
              : otpSent
              ? "Enter the OTP sent to your email"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Alerts */}
        {successMessage && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccessMessage("")}
            style={{ borderRadius: "10px", fontSize: "13px", padding: "10px 14px", marginBottom: "16px" }}
          >
            ✅ {successMessage}
          </Alert>
        )}
        {errors.backend && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setErrors({})}
            style={{ borderRadius: "10px", fontSize: "13px", padding: "10px 14px", marginBottom: "16px" }}
          >
            ⚠️ {errors.backend}
          </Alert>
        )}

        {/* ── LOGIN FORM ── */}
        {!forgotMode && !otpSent && (
          <form onSubmit={handleLogin}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Email Address</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Password</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: "22px" }}>
              <button type="button" onClick={() => setForgotMode(true)} style={linkBtn}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" style={primaryBtn}>
              Send OTP →
            </button>
          </form>
        )}

        {/* ── VERIFY OTP ── */}
        {!forgotMode && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <div style={otpInfoBox}>
              <span style={{ fontSize: "20px" }}>📧</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#374151" }}>OTP Sent To</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#6366f1" }}>{otpSentEmail}</p>
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Enter 6-digit OTP</label>
              <input
                style={{ ...inputStyle, letterSpacing: "8px", textAlign: "center", fontSize: "22px", fontWeight: 700 }}
                placeholder="• • • • • •"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button type="submit" style={primaryBtn}>Verify & Login ✓</button>
            <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} style={outlineBtn}>
              ← Change Email
            </button>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {forgotMode && !resetOtpSent && (
          <form onSubmit={handleForgotPassword}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Registered Email</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" style={primaryBtn}>Send Reset OTP →</button>
            <button type="button" onClick={() => setForgotMode(false)} style={outlineBtn}>
              ← Back to Login
            </button>
          </form>
        )}

        {/* ── RESET PASSWORD ── */}
        {forgotMode && resetOtpSent && (
          <form onSubmit={handleResetPassword}>
            <div style={otpInfoBox}>
              <span style={{ fontSize: "20px" }}>🔒</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#374151" }}>Reset OTP Sent To</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#6366f1" }}>{email}</p>
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Enter 6-digit OTP</label>
              <input
                style={{ ...inputStyle, letterSpacing: "8px", textAlign: "center", fontSize: "22px", fontWeight: 700 }}
                placeholder="• • • • • •"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>New Password</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" style={primaryBtn}>Reset Password ✓</button>
            <button type="button" onClick={() => { setResetOtpSent(false); setOtp(""); }} style={outlineBtn}>
              ↺ Resend OTP
            </button>
          </form>
        )}

        {/* Footer */}
        {!forgotMode && (
          <p style={{ marginTop: "32px", fontSize: "14px", color: "#6b7280", textAlign: "center" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
              Register
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}

/* ── Shared Styles ── */
const fieldGroup = { marginBottom: "18px" };

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  color: "#1e1e2e",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#fafafa",
  boxSizing: "border-box",
};

const primaryBtn = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "10px",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  transition: "opacity 0.2s",
};

const outlineBtn = {
  width: "100%",
  padding: "11px",
  background: "transparent",
  color: "#6366f1",
  border: "1.5px solid #6366f1",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "6px",
  transition: "background 0.2s",
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#6366f1",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};

const otpInfoBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#f0f0ff",
  border: "1px solid #c7d2fe",
  borderRadius: "10px",
  padding: "12px 16px",
  marginBottom: "20px",
};

export default Login;