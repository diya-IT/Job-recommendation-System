// FIXED AdminPortal.jsx - Profile fetch + admin role handling
// UI stays PERFECT - only data flow fixed

import React, { useState, useEffect } from "react";
import "../../styles/AdminPortal.css";
import axios from "axios";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Star,
  LogOut,
  ChevronLeft,
  Edit2
} from "lucide-react";

const navItems = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "companies",  label: "Companies",  icon: Building2 },
  { id: "users",      label: "Users",      icon: Users },
  { id: "skills",     label: "Skills",     icon: Star },
];

const AdminPortal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    _id: "", name: "", email: "", role: "admin"
  });

  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split("/")[2] || "overview";

  // ================= LOAD & FETCH ADMIN PROFILE =================
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) { navigate("/login", { replace: true }); return; }
        const user = JSON.parse(raw);
        if (!user?.role || user.role.toLowerCase() !== "admin") { navigate("/login", { replace: true }); return; }

        if (user.id) {
          try {
            const res = await axios.get(`http://localhost:5000/api/admin/pradmin/${user.id}`);
            const freshData = res.data;
            setProfileData({ _id: freshData._id || user.id, name: freshData.name || user.name || "Admin", email: freshData.email || user.email || "", role: "admin" });
            localStorage.setItem("user", JSON.stringify({ id: freshData._id || user.id, name: freshData.name || user.name, email: freshData.email || user.email, role: "admin", avatar: freshData.avatar || null }));
          } catch (fetchErr) {
            console.warn("Profile fetch failed, using localStorage:", fetchErr);
            setProfileData({ _id: user.id || "", name: user.name || "Admin", email: user.email || "", role: "admin" });
          }
        } else {
          setProfileData({ _id: "", name: user.name || "Admin", email: user.email || "", role: "admin" });
        }
        setLoading(false);
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login", { replace: true });
      }
    };
    loadAdmin();
  }, [navigate]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleSaveProfile = async () => {
    if (!profileData._id) { alert("User ID not found. Cannot update profile."); return; }
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/editadmin/pr/${profileData._id}`, { name: profileData.name, email: profileData.email, role: "admin" });
      const updatedUser = res.data;
      localStorage.setItem("user", JSON.stringify({ id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role || "admin", avatar: updatedUser.avatar || null }));
      setProfileData({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: "admin" });
      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("skillhire_token");
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name.split(" ").map(word => word[0]).join("").toUpperCase();
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="admin-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">

      {/* ===== NAVBAR ===== */}
      <nav className={`admin-navbar ${collapsed ? "collapsed" : ""}`}>
        <div className="brand-title">
          <span className="skillhire-logo">SkillHire</span>
          <span className="admin-text">Admin</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '7px 13px', width: 200 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#9CA3AF" strokeWidth="2"/><path d="M13.5 13.5L17 17" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>
            <input style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#111827', flex: 1 }} placeholder="Search..." />
          </div>
          {/* Bell */}
          <div style={{ position: 'relative', padding: 8, borderRadius: 9, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M15 17H20L18.595 15.595A2.5 2.5 0 0 1 18 14.152V11a6 6 0 0 0-12 0v3.152a2.5 2.5 0 0 1-.595 1.595L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9"/></svg>
          </div>
          {/* Avatar */}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
            {getInitials(profileData.name)}
          </div>
        </div>
      </nav>

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar-modern ${collapsed ? "collapsed" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}>

        {/* Header / Logo */}
        <div className="sidebar-header">
          {!collapsed && (
            <div className="brand-section">
              <div className="skillhire-bag-logo"></div>
              <div>
                <h1 className="skillhire-title">Skill<span>Hire</span></h1>
                <p className="admin-portal-text">Admin Portal</p>
              </div>
            </div>
          )}
          <div className="header-actions">
            <button
              className={`sidebar-toggle ${collapsed ? "collapsed" : ""}`}
              onClick={() => setCollapsed(!collapsed)}
            >
              <span></span><span></span><span></span>
            </button>
            <button className="close-sidebar-btn lg:hidden" onClick={() => setSidebarOpen(false)}>
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="profile-top">
            <div className="profile-avatar">{getInitials(profileData.name)}</div>
            {!collapsed && (
              <div className="profile-info">
                <p className="profile-name">{profileData.name}</p>
                <p className="profile-email">{profileData.email}</p>
                <p className="profile-role">Admin</p>
              </div>
            )}
          </div>

          {!collapsed && !editingProfile && (
            <button className="edit-profile-btn-full" onClick={() => setEditingProfile(true)}>
              <Edit2 size={14} /> Edit Profile
            </button>
          )}

          {!collapsed && editingProfile && (
            <div className="profile-edit-full">
              <input
                className="edit-input-full"
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Name"
              />
              <input
                className="edit-input-full"
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Email"
              />
              <div className="edit-buttons-row">
                <button className="save-btn-full" onClick={handleSaveProfile}>Save</button>
                <button className="cancel-btn-full" onClick={() => setEditingProfile(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => item.id === "overview" ? navigate("/admin") : navigate(`/admin/${item.id}`)}
              className={`nav-item ${activeTab === item.id ? "nav-item-active" : ""}`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-logout">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`admin-content ${collapsed ? "collapsed-content" : ""}`}>
        {/* Sub-header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {activeTab === 'overview'  && 'Admin Dashboard'}
            {activeTab === 'companies' && 'Companies'}
            {activeTab === 'users'     && 'Users'}
            {activeTab === 'skills'    && 'Skills'}
          </h2>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{today}</p>
        </div>
        <Outlet />
      </main>

      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default AdminPortal;