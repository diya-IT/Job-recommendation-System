import { Search, User, Trash2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/User.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short" });
}

// ─── Small reusable UI ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9ca3af", margin: "14px 0 7px" }}>
      {children}
    </p>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "0.5px solid #f3f4f6" }}>
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "#111827" }}>{value || "—"}</span>
    </div>
  );
}
function Tag({ children, color = "#6366f1" }) {
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, background: color + "18", color, fontWeight: 500, border: `0.5px solid ${color}40` }}>
      {children}
    </span>
  );
}
function LevelBar({ level }) {
  const map = { fresher: 10, beginner: 25, intermediate: 55, advanced: 78, expert: 95 };
  const pct = map[(level || "fresher").toLowerCase()] ?? 25;
  const label = level ? level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() : "Fresher";
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: "#9ca3af" }}>Proficiency level</span>
        <span style={{ color: "#6366f1", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}
function ExperienceCard({ exp }) {
  const responsibilities = toArray(exp.responsibilities);
  return (
    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{exp.jobTitle || "—"}</p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", fontWeight: 500 }}>{exp.company || "—"}</p>
        </div>
        {exp.type && (
          <span style={{ fontSize: 11, padding: "2px 8px", background: "#e0e7ff", color: "#4338ca", borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>{exp.type}</span>
        )}
      </div>
      {exp.createdAt && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
          From {formatDate(exp.createdAt)}{exp.updatedAt ? ` · Updated ${formatDate(exp.updatedAt)}` : ""}
        </p>
      )}
      {responsibilities.length > 0 && (
        <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
          {responsibilities.map((r, i) => <li key={i} style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.55 }}>{r}</li>)}
        </ul>
      )}
    </div>
  );
}
function ProjectCard({ project }) {
  const title = typeof project === "string" ? project : project?.title || project?.name || "Project";
  const desc = typeof project === "object" ? project?.description || project?.desc : null;
  const tech = typeof project === "object" ? toArray(project?.tech || project?.techStack) : [];
  return (
    <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: "1px solid #f3f4f6" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{title}</p>
      {desc && <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 6px", lineHeight: 1.55 }}>{desc}</p>}
      {tech.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
          {tech.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 7px", background: "#e0e7ff", color: "#4338ca", borderRadius: 4, fontWeight: 500 }}>{t}</span>)}
        </div>
      )}
    </div>
  );
}
function Avatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isRecruiter = user.role === "recruiter";
  const accent = isRecruiter ? "#10b981" : "#6366f1";
  const bgColor = isRecruiter ? "#d1fae5" : "#e0e7ff";
  const txtColor = isRecruiter ? "#065f46" : "#4338ca";
  const src = user.profileImage || user.avatar;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
      {src && !imgFailed ? (
        <img src={src} alt={user.name} onError={() => setImgFailed(true)} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${accent}` }} />
      ) : (
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: bgColor, border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: txtColor }}>
          {getInitials(user.name)}
        </div>
      )}
    </div>
  );
}

// ─── Candidate body ────────────────────────────────────────────────────────────
function UserBody({ user }) {
  const skills = toArray(user.skills);
  const projects = toArray(user.projects);
  const experience = toArray(user.experience);
  const isFresher = (user.level || "fresher").toLowerCase() === "fresher";
  return (
    <>
      <SectionLabel>Skill level</SectionLabel>
      <LevelBar level={user.level} />
      {skills.length > 0 && (
        <>
          <SectionLabel>Skills</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.map(s => <Tag key={s} color="#6366f1">{s}</Tag>)}</div>
        </>
      )}
      {user.location && (
        <>
          <SectionLabel>Location</SectionLabel>
          <InfoRow label="Location" value={typeof user.location === "object" ? [user.location.city, user.location.state, user.location.country].filter(Boolean).join(", ") : user.location} />
        </>
      )}
      <SectionLabel>Experience {isFresher ? "(Fresher — no experience)" : `(${experience.length} record${experience.length !== 1 ? "s" : ""})`}</SectionLabel>
      {isFresher || experience.length === 0
        ? <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", margin: 0 }}>No work experience added yet.</p>
        : experience.map(exp => <ExperienceCard key={exp._id} exp={exp} />)
      }
      {projects.length > 0 && (
        <>
          <SectionLabel>Projects ({projects.length})</SectionLabel>
          {projects.map((p, i) => <ProjectCard key={i} project={p} />)}
        </>
      )}
      {user.createdAt && <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 18 }}>Member since {formatDate(user.createdAt)}</p>}
    </>
  );
}

// ─── Recruiter body ────────────────────────────────────────────────────────────
function RecruiterBody({ user }) {
  return (
    <>
      <SectionLabel>Company details</SectionLabel>
      <InfoRow label="Company name" value={user.companyName} />
      <InfoRow label="Company title" value={user.companyTitle} />
      <InfoRow label="Status" value={user.companyStatus} />
      {user.companyWebsite && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "0.5px solid #f3f4f6" }}>
          <span style={{ color: "#9ca3af" }}>Website</span>
          <a href={user.companyWebsite} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontWeight: 500, fontSize: 13, wordBreak: "break-all" }}>{user.companyWebsite}</a>
        </div>
      )}
      {user.adminNotes && <InfoRow label="Admin notes" value={user.adminNotes} />}
      {user.createdAt && <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 18 }}>Member since {formatDate(user.createdAt)}</p>}
    </>
  );
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ user, loading, onClose }) {
  if (!user && !loading) return null;
  const isRecruiter = user?.role === "recruiter";
  const accent = isRecruiter ? "#10b981" : "#6366f1";
  const badgeBg = isRecruiter ? "#d1fae5" : "#e0e7ff";
  const badgeColor = isRecruiter ? "#065f46" : "#4338ca";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.16)", position: "relative", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: "sticky", top: 12, float: "right", marginRight: 12, zIndex: 10, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#6366f1", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading profile...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Content */}
        {!loading && user && (
          <>
            <div style={{ padding: "22px 20px 0", textAlign: "center" }}>
              <Avatar user={user} />
              <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "3px 0 8px" }}>{user.email}</p>
              <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: badgeBg, color: badgeColor, border: `0.5px solid ${accent}40` }}>
                {isRecruiter ? "Recruiter" : "Candidate"}
              </span>
              <div style={{ height: 1, background: "#f3f4f6", margin: "14px 0 0" }} />
            </div>
            <div style={{ padding: "0 20px 22px" }}>
              {isRecruiter ? <RecruiterBody user={user} /> : <UserBody user={user} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main UsersTab ─────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users");
      setUsers(res.data);
    } catch (err) { console.error("Error fetching users:", err); }
  };

  const openProfile = async (userId) => {
    setSelectedUser(null);
    setProfileLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/aprofile/${userId}/profile`);
      setSelectedUser(res.data);
    } catch (err) { console.error("Profile fetch failed:", err); }
    finally { setProfileLoading(false); }
  };

  const closeProfile = () => { setSelectedUser(null); setProfileLoading(false); };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) { console.error("Delete failed:", err); }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="dashboard-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 className="navy-header-small">Users Directory</h1>
            <p className="text-xl text-gray-700 font-medium mt-2">
              {users.length} Total Users • {filteredUsers.length} Visible
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="search-modern">
          <Search size={16} />
          <input
            placeholder="Search users by name, email, role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="modern-table-container">
          <div className="table-header">
            <User size={16} color="#2563eb" />
            Active Users Directory
          </div>

          {/* Header row */}
          <div className="table-row-header">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Actions</div>
          </div>

          {/* User rows */}
          {filteredUsers.map(user => (
            <div key={user._id} className="glass-card">
              {/* Name */}
              <div className="table-cell" style={{ gap: 10 }}>
                <div className="w-20">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="font-semibold text-gray-900">{user.name}</span>
              </div>

              {/* Email */}
              <div className="table-cell font-medium text-gray-700" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>

              {/* Role */}
              <div className="table-cell">
                <span className="px-4 py-2 bg-white/80 backdrop-blur rounded-xl text-sm font-bold text-gray-800 border border-gray-200 shadow-sm">
                  {user.role?.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="table-cell">
                <div className="action-buttons">
                  <button onClick={() => openProfile(user._id)} className="view-btn" title="View Profile">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => deleteUser(user._id)} className="reject-btn" title="Delete User">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty */}
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', borderTop: '1px solid #f3f4f6' }}>
              <User size={40} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>No users found</p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Try adjusting the search filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {(profileLoading || selectedUser) && (
        <ProfileModal user={selectedUser} loading={profileLoading} onClose={closeProfile} />
      )}
    </div>
  );
};

export default UsersTab;