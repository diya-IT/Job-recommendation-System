import React, { useState } from "react";
import "../../styles/Register.css";
import ImageSlider from "../../components/ImageSlider";
import { Link, useNavigate } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import { Form } from "react-bootstrap";

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
  background: "#fafafa",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const errorBorder = {
  borderColor: "#ef4444",
  background: "#fff5f5",
};

const errorText = {
  display: "block",
  fontSize: "12px",
  color: "#ef4444",
  marginTop: "4px",
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
  marginBottom: "10px",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  transition: "opacity 0.2s",
};

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [checkingWebsite, setCheckingWebsite] = useState(false);

  // ✅ PRODUCTION-READY: URL Format Validation ONLY (No CORS issues)
  const validateWebsite = async (url) => {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    setCheckingWebsite(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setCheckingWebsite(false);
    return urlRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }
    if (!role) newErrors.role = "Please select a role";

    if (role === "recruiter") {
      if (!companyName.trim()) newErrors.companyName = "Company name is required";
      if (!companyTitle.trim()) newErrors.companyTitle = "Company title is required";
      if (!companyWebsite.trim()) {
        newErrors.companyWebsite = "Company website is required";
      } else {
        const isValidUrl = await validateWebsite(companyWebsite);
        if (!isValidUrl) {
          newErrors.companyWebsite = "Please enter a valid website URL (e.g., google.com)";
        }
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else {
      const uppercaseRegex = /[A-Z]/;
      const lowercaseRegex = /[a-z]/;
      const numberRegex = /[0-9]/;
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!uppercaseRegex.test(password)) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!lowercaseRegex.test(password)) {
        newErrors.password = "Password must contain at least one lowercase letter";
      } else if (!numberRegex.test(password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!specialCharRegex.test(password)) {
        newErrors.password = "Password must contain at least one special character";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      };

      if (role === "recruiter") {
        payload.companyName = companyName.trim();
        payload.companyWebsite = companyWebsite.trim();
        payload.companyTitle = companyTitle.trim();
      }

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ backend: result.message || "Registration failed" });
        return;
      }

      localStorage.setItem("user", JSON.stringify(result.user));
      setSuccessMessage("Registration successful! Redirecting...");

      const targetDashboard =
        result.user.role === "recruiter" ? "/RecruiterDashboard" : "/UserDashboard";

      setTimeout(() => {
        navigate(targetDashboard);
      }, 1200);
    } catch (error) {
      setErrors({ backend: "Backend not reachable. Please try again." });
      console.error("Registration error:", error);
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

      {/* RIGHT PANEL */}
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
        padding: "40px 44px",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.08)",
        zIndex: 10,
        overflowY: "auto",
        position: "relative",
      }}>

        {/* Brand */}
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
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
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                fill="#fff"
              />
            </svg>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: "24px", color: "#111827", margin: 0, letterSpacing: "-0.3px" }}>
            Create Account
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px", marginBottom: 0 }}>
            Join us today — it only takes a minute
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

        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Full Name */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Full Name</label>
            <input
              style={{ ...inputStyle, ...(errors.name ? errorBorder : {}) }}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span style={errorText}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Email Address</label>
            <input
              style={{ ...inputStyle, ...(errors.email ? errorBorder : {}) }}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span style={errorText}>{errors.email}</span>}
          </div>

          {/* Role */}
          <div style={fieldGroup}>
            <label style={labelStyle}>I am a</label>
            <Form.Group>
              <Form.Select
                style={{
                  ...inputStyle,
                  ...(errors.role ? errorBorder : {}),
                  appearance: "auto",
                  cursor: "pointer",
                }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select your role</option>
                <option value="user">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
              </Form.Select>
            </Form.Group>
            {errors.role && <span style={errorText}>{errors.role}</span>}
          </div>

          {/* Recruiter Fields */}
          {role === "recruiter" && (
            <div style={{
              background: "#f5f3ff",
              border: "1.5px solid #c7d2fe",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "18px",
            }}>
              <p style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6366f1",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "14px",
              }}>
                🏢 Company Details
              </p>

              {/* Company Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Company Name</label>
                <input
                  style={{ ...inputStyle, ...(errors.companyName ? errorBorder : {}) }}
                  placeholder="e.g. Google Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                {errors.companyName && <span style={errorText}>{errors.companyName}</span>}
              </div>

              {/* Company Title */}
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Your Title</label>
                <input
                  style={{ ...inputStyle, ...(errors.companyTitle ? errorBorder : {}) }}
                  placeholder="e.g. HR Manager"
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                />
                {errors.companyTitle && <span style={errorText}>{errors.companyTitle}</span>}
              </div>

              {/* Company Website */}
              <div>
                <label style={labelStyle}>Company Website</label>
                <input
                  style={{
                    ...inputStyle,
                    ...(errors.companyWebsite ? errorBorder : {}),
                    opacity: checkingWebsite ? 0.6 : 1,
                  }}
                  placeholder="e.g. google.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  disabled={checkingWebsite}
                />
                {checkingWebsite && (
                  <span style={{ fontSize: "12px", color: "#6366f1", marginTop: "4px", display: "block" }}>
                    🔄 Validating website...
                  </span>
                )}
                {errors.companyWebsite && <span style={errorText}>{errors.companyWebsite}</span>}
              </div>
            </div>
          )}

          {/* Password */}
          <div style={fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input
              style={{ ...inputStyle, ...(errors.password ? errorBorder : {}) }}
              type="password"
              placeholder="Min 8 chars, uppercase, number, symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span style={errorText}>{errors.password}</span>}

            {/* Password Strength Bar */}
            {!errors.password && password.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                {["length", "upper", "number", "special"].map((check, i) => {
                  const checks = [
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                    /[!@#$%^&*(),.?":{}|<>]/.test(password),
                  ];
                  return (
                    <div key={i} style={{
                      flex: 1,
                      height: "4px",
                      borderRadius: "4px",
                      background: checks[i] ? "#6366f1" : "#e5e7eb",
                      transition: "background 0.3s",
                    }} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={checkingWebsite}
            style={{
              ...primaryBtn,
              opacity: checkingWebsite ? 0.7 : 1,
              cursor: checkingWebsite ? "not-allowed" : "pointer",
            }}
          >
            {checkingWebsite ? "🔄 Validating Website..." : "Create Account →"}
          </button>

        </form>

        {/* Footer */}
        <p style={{ marginTop: "24px", fontSize: "14px", color: "#6b7280", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;