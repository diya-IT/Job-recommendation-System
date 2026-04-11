import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container, Row, Col, Card, Button, Badge, OverlayTrigger, Tooltip, Modal, InputGroup, ProgressBar, Alert, Form,
} from "react-bootstrap";
import Image from "react-bootstrap/Image";
import { AlertCircle } from "lucide-react";
import {
  Bell, Briefcase, GraphUp, GeoAlt, PencilSquare, CheckCircle, Plus, X, Trash, BoxArrowRight, LightbulbFill, GraphUpArrow,
} from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import "../../styles/UserDashboard.css";

// LEAFLET ICON FIX
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BASE = "http://localhost:5000";

// ── HELPERS ──
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined" || stored === "null") return null;
    return JSON.parse(stored);
  } catch (err) {
    console.error("Invalid user in localStorage:", err);
    return null;
  }
};

const getCompanyColor = (name = "") => {
  const colors = [
    { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
    { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
    { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF" },
    { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    { bg: "#FDF2F8", text: "#DB2777", border: "#FBCFE8" },
    { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    { bg: "#F0FDFA", text: "#0D9488", border: "#99F6E4" },
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ── COMPANY LOGO COMPONENT ──
const CompanyLogo = ({ company, size = 55 }) => {
  const color = getCompanyColor(company);
  const initials = company
    ? company.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const fontSize = size * 0.33;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "12px",
        background: color.bg, color: color.text,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontWeight: "800", fontSize, flexShrink: 0,
        border: `1.5px solid ${color.border}`,
        letterSpacing: "1px", lineHeight: 1, gap: "3px", userSelect: "none",
      }}
    >
      <span>{initials}</span>
      <span style={{ fontSize: size * 0.13, fontWeight: "600", letterSpacing: "0.3px", opacity: 0.75, maxWidth: size - 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1 }}>
        {company?.split(" ")[0]}
      </span>
    </div>
  );
};

const UserDashboard = () => {
  const didAutofillExp = useRef(false);
  const [isManualExp, setIsManualExp] = useState(false);
  const navigate = useNavigate();
  const [storedUser, setStoredUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    name: storedUser?.name || "User",
    email: storedUser?.email || "",
    userId: storedUser?.id || null,
    photo: null,
    skills: [],
    experiences: [],
    location: { address: "", city: "", country: "India" },
    projects: [],
    experience: { years: 0, months: 0 },
    level: "Fresher",
  });

  const [editedProfile, setEditedProfile] = useState({ ...userProfile });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [tempSkills, setTempSkills] = useState([]);
  const [experienceYears, setExperienceYears] = useState(0);
  const [experienceMonths, setExperienceMonths] = useState(0);
  const [locationInput, setLocationInput] = useState({ city: "", country: "India", address: "" });
  const [newExperience, setNewExperience] = useState({ title: "", company: "", type: "Full-time", responsibilities: "" });
  const [topCompanies, setTopCompanies] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [currentSkills, setCurrentSkills] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);
  const [coveragePercentage, setCoveragePercentage] = useState(0);
  const [stats, setStats] = useState([]);
  const [hasForcedExpOnce, setHasForcedExpOnce] = useState(false);
  const [tempProjects, setTempProjects] = useState([]);
  const [projectInput, setProjectInput] = useState({ title: "", url: "", techUsed: "" });
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // ── GUARD: redirect if not logged in ──
  useEffect(() => {
    if (!storedUser) { navigate("/Login", { replace: true }); return; }
    setIsLoading(false);
  }, [navigate, storedUser]);

  // ── LISTEN FOR CROSS-TAB STORAGE CHANGES ──
  useEffect(() => {
    const handleStorageChange = () => setStoredUser(getStoredUser());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── FETCH USER PROFILE ──
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!storedUser?.id) return;
      try {
        const res = await axios.get(`${BASE}/api/user/${storedUser.id}`);
        const d = res.data;
        const photo = d.profileImage || d.photo || d.avatar || null;
        setUserProfile(prev => ({
          ...prev,
          name: d.name || prev.name,
          email: d.email || prev.email,
          photo: photo
            ? (photo.startsWith("http") ? photo : `${BASE}/uploads/${photo}`)
            : null,
        }));
        setEditedProfile(prev => ({
          ...prev,
          name: d.name || prev.name,
          email: d.email || prev.email,
        }));
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserProfile();
  }, [storedUser?.id]);

  // ── FETCH SKILLS / PROJECTS / EXPERIENCE / LOCATION ──
  useEffect(() => {
    const fetchSkillsData = async () => {
      if (!storedUser?.id) return;
      try {
        const res = await axios.get(`${BASE}/api/fetchskills/${storedUser.id}`);
        const d = res.data;
        setUserProfile(prev => ({
          ...prev,
          skills: d.skills || [],
          projects: d.projects || [],
          experience: d.experience || { years: 0, months: 0 },
          level: d.level || "Fresher",
          location: d.location || { address: "", city: "", country: "India" },
        }));
        setEditedProfile(prev => ({
          ...prev,
          skills: d.skills || [],
          projects: d.projects || [],
          experience: d.experience || { years: 0, months: 0 },
          level: d.level || "Fresher",
          location: d.location || { address: "", city: "", country: "India" },
        }));
      } catch (err) {
        console.error("Failed to fetch skills data:", err);
      }
    };
    fetchSkillsData();
  }, [storedUser?.id]);

  // ── FETCH RECOMMENDATIONS ──
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!storedUser?.id) return;
      try {
        const res = await axios.get(`${BASE}/api/recommended/${storedUser.id}`);
        const data = res.data;

        if (!Array.isArray(data) || data.length === 0) {
          setRecommendedJobs([]);
          setTopCompanies([]);
          setCurrentSkills([]);
          setSkillsToLearn([]);
          setCoveragePercentage(0);
          return;
        }

        setRecommendedJobs(data.slice(0, 10));

        const topJob = data[0];
        const totalSkills = (topJob.matchedSkills?.length || 0) + (topJob.missingSkills?.length || 0);
        const coverage = totalSkills > 0
          ? Math.round((topJob.matchedSkills.length / totalSkills) * 100)
          : 0;
        setCoveragePercentage(coverage);
        setCurrentSkills((topJob.matchedSkills || []).map(s => ({ name: s })));
        setSkillsToLearn((topJob.missingSkills || []).map(s => ({ name: s })));

        const companySet = new Set();
        const companies = [];
        for (const job of data) {
          if (!companySet.has(job.company)) {
            companySet.add(job.company);
            companies.push({ name: job.company, jobTitle: job.title, match: job.match });
          }
          if (companies.length >= 5) break;
        }
        setTopCompanies(companies);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      }
    };
    fetchRecommendations();
  }, [storedUser?.id]);

  // ── STATS CARDS ──
  useEffect(() => {
    setStats([
      {
        label: "Skill Coverage",
        value: `${coveragePercentage}%`,
        change: "+0%",
        icon: <LightbulbFill size={20} />,
      },
      {
        label: "Matched Skills",
        value: currentSkills.length,
        change: "+0",
        icon: <CheckCircle size={20} />,
      },
      {
        label: "Missing Skills",
        value: skillsToLearn.length,
        change: "0",
        icon: <AlertCircle size={20} />,
      },
      {
        label: "Top Fit Job",
        value: recommendedJobs[0]?.title || "N/A",
        change: recommendedJobs[0] ? `${recommendedJobs[0].match}% Fit` : "—",
        icon: <Briefcase size={20} />,
      },
    ]);
  }, [coveragePercentage, currentSkills, skillsToLearn, recommendedJobs]);

  // ── AUTO-FILL EXPERIENCE INPUT WHEN SKILL MODAL OPENS ──
  useEffect(() => {
    if (!showAddSkillModal) return;
    if (isManualExp) return;
    if (didAutofillExp.current) return;
    const exp = userProfile.experience;
    if (exp && (exp.years > 0 || exp.months > 0)) {
      setExperienceYears(exp.years || 0);
      setExperienceMonths(exp.months || 0);
      didAutofillExp.current = true;
    }
  }, [showAddSkillModal, userProfile.experience, isManualExp]);

  useEffect(() => {
    if (!showAddSkillModal) {
      didAutofillExp.current = false;
      setIsManualExp(false);
    }
  }, [showAddSkillModal]);

  // ── FETCH EXISTING SKILLS INTO MODAL WHEN IT OPENS ──
  const handleFetchSkills = useCallback(async () => {
    if (!storedUser?.id) return;
    try {
      const res = await axios.get(`${BASE}/api/fetchskills/${storedUser.id}`);
      const d = res.data;
      setUserProfile(prev => ({
        ...prev,
        skills: d.skills || [],
        projects: d.projects || [],
        experience: d.experience || { years: 0, months: 0 },
        level: d.level || "Fresher",
        location: d.location || { address: "", city: "", country: "India" },
      }));
      setTempSkills([]);
      setExperienceYears(d.experience?.years || 0);
      setExperienceMonths(d.experience?.months || 0);
      setLocationInput({
        address: d.location?.address || "",
        city: d.location?.city || "",
        country: d.location?.country || "India",
      });
    } catch (err) {
      console.error("fetchskills error:", err.response?.status, err.response?.data);
    }
  }, [storedUser?.id]);

  // ── FETCH EXISTING EXPERIENCE INTO MODAL WHEN IT OPENS ──
  useEffect(() => {
    if (!showAddExperienceModal || !storedUser?.id) return;
    const fetchExperience = async () => {
      try {
        const res = await axios.get(`${BASE}/api/experience/${storedUser.id}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const exp = res.data[0];
          setNewExperience({
            _id: exp._id || null,
            title: exp.jobTitle || "",
            company: exp.company || "",
            type: exp.type || "Full-time",
            responsibilities: Array.isArray(exp.responsibilities)
              ? exp.responsibilities.join("\n")
              : exp.responsibilities || "",
          });
        } else {
          setNewExperience({ _id: null, title: "", company: "", type: "Full-time", responsibilities: "" });
        }
      } catch (err) {
        console.error("Fetch experience failed:", err);
      }
    };
    fetchExperience();
  }, [showAddExperienceModal, storedUser?.id]);

  // ─────────────────────────────────────────────
  //  HANDLERS
  // ─────────────────────────────────────────────

  const handleEditClick = useCallback(() => setIsEditing(true), []);

  const handleCloseSkillModal = useCallback(() => {
    setShowAddSkillModal(false);
    setCurrentSkillInput("");
    setTempSkills([]);
    setExperienceYears(0);
    setExperienceMonths(0);
    setLocationInput({ address: "", city: "", country: "India" });
    setTempProjects([]);
    setProjectInput({ title: "", url: "", techUsed: "" });
    setEditingProject(null);
    setEditingProjectIndex(null);
  }, []);

  const handleCloseExperienceModal = useCallback(() => {
    setShowAddExperienceModal(false);
    setNewExperience({ title: "", company: "", type: "Full-time", responsibilities: "" });
  }, []);

  const handleProfileImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedProfile({ ...userProfile });
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setTempSkills([]);
    setCurrentSkillInput("");
  }, [userProfile]);

  const handleSaveClick = useCallback(async () => {
    if (!storedUser?.id) return;
    try {
      const formData = new FormData();
      formData.append("name", editedProfile.name.trim());
      formData.append("email", editedProfile.email.trim());
      if (profileImageFile) formData.append("photo", profileImageFile);

      const res = await axios.put(
        `${BASE}/api/users/edit/${storedUser.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data.user || res.data;
      const photo = updated.profileImage || updated.photo || updated.avatar || null;
      const photoUrl = photo
        ? (photo.startsWith("http") ? photo : `${BASE}/uploads/${photo}`)
        : null;

      setUserProfile(prev => ({
        ...prev,
        name: updated.name || prev.name,
        email: updated.email || prev.email,
        photo: photoUrl,
      }));
      setEditedProfile(prev => ({
        ...prev,
        name: updated.name || prev.name,
        email: updated.email || prev.email,
        photo: photoUrl,
      }));
      setIsEditing(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setSuccessMsg("✅ Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err.response?.data || err.message);
      alert("Failed to update profile. Please try again.");
    }
  }, [storedUser?.id, editedProfile, profileImageFile]);

  const handleAddAllSkills = useCallback(async () => {
    const finalExp = {
      years: parseInt(experienceYears) || 0,
      months: parseInt(experienceMonths) || 0,
    };
    if (finalExp.months > 11) {
      finalExp.years += Math.floor(finalExp.months / 12);
      finalExp.months = finalExp.months % 12;
    }

    const hasWorkExp = editedProfile.experiences?.length > 0;
    const hasAnyExpValue = finalExp.years > 0 || finalExp.months > 0;

    if (hasAnyExpValue && !hasWorkExp && !hasForcedExpOnce) {
      alert(
        `⚠️ You have ${finalExp.years} years and ${finalExp.months} months of experience.\n\nPlease add work experience first!`
      );
      setHasForcedExpOnce(true);
      handleCloseSkillModal();
      setTimeout(() => setShowAddExperienceModal(true), 300);
      return;
    }

    const hasContent =
      tempSkills.length > 0 ||
      tempProjects.length > 0 ||
      hasAnyExpValue ||
      locationInput.city;

    if (!hasContent) {
      alert("Please add at least one skill, project, experience, or location!");
      return;
    }

    const invalidProjects = tempProjects.filter((p) => !p.url?.startsWith("http"));
    if (invalidProjects.length > 0) {
      alert("Fix invalid project URLs (must start with http:// or https://)");
      return;
    }

    try {
      const payload = {
        skills: tempSkills,
        experience: finalExp,
        location: {
          address: locationInput.address || "",
          city: locationInput.city || "",
          country: locationInput.country || "India",
        },
        projects: tempProjects,
      };

      await axios.post(`${BASE}/api/skills/add/${storedUser.id}`, payload);

      const refreshed = await axios.get(`${BASE}/api/fetchskills/${storedUser.id}`);
      const d = refreshed.data;
      setUserProfile(prev => ({
        ...prev,
        skills: d.skills || [],
        projects: d.projects || [],
        experience: d.experience || { years: 0, months: 0 },
        level: d.level || "Fresher",
        location: d.location || { address: "", city: "", country: "India" },
      }));
      setEditedProfile(prev => ({
        ...prev,
        skills: d.skills || [],
        projects: d.projects || [],
        experience: d.experience || { years: 0, months: 0 },
        level: d.level || "Fresher",
        location: d.location || { address: "", city: "", country: "India" },
      }));

      handleCloseSkillModal();
      setSuccessMsg("✅ Skills & Projects saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);

      try {
        const rec = await axios.get(`${BASE}/api/recommended/${storedUser.id}`);
        const data = rec.data;
        if (Array.isArray(data) && data.length > 0) {
          setRecommendedJobs(data.slice(0, 10));
          const topJob = data[0];
          const total = (topJob.matchedSkills?.length || 0) + (topJob.missingSkills?.length || 0);
          const cov = total > 0 ? Math.round((topJob.matchedSkills.length / total) * 100) : 0;
          setCoveragePercentage(cov);
          setCurrentSkills((topJob.matchedSkills || []).map(s => ({ name: s })));
          setSkillsToLearn((topJob.missingSkills || []).map(s => ({ name: s })));
          const companySet = new Set();
          const companies = [];
          for (const job of data) {
            if (!companySet.has(job.company)) {
              companySet.add(job.company);
              companies.push({ name: job.company, jobTitle: job.title, match: job.match });
            }
            if (companies.length >= 5) break;
          }
          setTopCompanies(companies);
        }
      } catch (e) {
        console.error("Re-fetch recommendations failed:", e);
      }
    } catch (error) {
      console.error("Save skills error:", error.response?.data || error.message);
      const msg = error.response?.data?.error || error.response?.data?.message || "Failed to save. Check your skill names.";
      alert(msg);
    }
  }, [
    experienceYears, experienceMonths, editedProfile.experiences, hasForcedExpOnce,
    tempSkills, tempProjects, locationInput, storedUser?.id, handleCloseSkillModal,
  ]);

  const handleAddSingleSkill = useCallback(() => {
    const skill = currentSkillInput.trim();
    if (!skill) return;
    if (tempSkills.includes(skill)) { alert("Skill already added"); return; }
    setTempSkills(prev => [...prev, skill]);
    setCurrentSkillInput("");
  }, [currentSkillInput, tempSkills]);

  const handleRemoveSkillFromPreview = useCallback((skillToRemove) => {
    setTempSkills(prev => prev.filter(s => s !== skillToRemove));
  }, []);

  const handleRemoveSkill = useCallback((skillToRemove) => {
    setEditedProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  }, []);

  const handleEditProject = useCallback((project, index) => {
    setEditingProject(project);
    setEditingProjectIndex(index);
    setProjectInput({
      title: project.title || "",
      url: project.url || "",
      techUsed: Array.isArray(project.techUsed) ? project.techUsed.join(", ") : project.techUsed || "",
    });
  }, []);

  const handleCancelEditProject = useCallback(() => {
    setEditingProject(null);
    setEditingProjectIndex(null);
    setProjectInput({ title: "", url: "", techUsed: "" });
  }, []);

  const isValidUrl = (url) => {
    try { new URL(url); return url.startsWith("http://") || url.startsWith("https://"); } catch { return false; }
  };

  const handleSaveProject = useCallback(async () => {
    if (!projectInput.title.trim() || !projectInput.url.trim() || !isValidUrl(projectInput.url)) {
      alert("❌ Complete all fields with a valid URL!");
      return;
    }
    const updatedProject = {
      title: projectInput.title.trim(),
      url: projectInput.url.trim(),
      techUsed: projectInput.techUsed?.split(",").map(t => t.trim()).filter(Boolean) || [],
    };
    try {
      if (editingProject !== null && editingProjectIndex !== null) {
        const response = await axios.put(
          `${BASE}/api/skills/project/${storedUser.id}/${editingProjectIndex}`,
          updatedProject
        );
        setUserProfile(prev => ({
          ...prev,
          projects: prev.projects.map((p, i) =>
            i === editingProjectIndex ? response.data.updatedProject : p
          ),
        }));
        setSuccessMsg("✅ Project updated!");
      } else {
        setTempProjects(prev => [...prev, { ...updatedProject, status: "Not Verified" }]);
        setSuccessMsg("✅ Project added to queue!");
      }
      handleCancelEditProject();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Save project error:", error.response?.data || error.message);
      alert("Save failed – check console");
    }
  }, [projectInput, editingProject, editingProjectIndex, storedUser?.id, handleCancelEditProject]);

  const handleAddExperience = async () => {
    if (!newExperience.title?.trim() || !newExperience.company?.trim()) {
      alert("Job title and company are required!");
      return;
    }
    try {
      const responsibilitiesArray = (newExperience.responsibilities || "")
        .split("\n")
        .map(r => r.trim())
        .filter(Boolean);

      const experienceData = {
        jobTitle: newExperience.title.trim(),
        company: newExperience.company.trim(),
        type: newExperience.type,
        responsibilities: responsibilitiesArray,
      };

      const res = await axios.put(
        `${BASE}/api/experience/update/user/${storedUser.id}`,
        experienceData
      );
      const savedExperience = res.data.experience;

      setEditedProfile(prev => ({ ...prev, experiences: [savedExperience] }));
      setUserProfile(prev => ({ ...prev, experiences: [savedExperience] }));
      handleCloseExperienceModal();
      setTimeout(() => setShowAddSkillModal(true), 200);
    } catch (err) {
      console.error("Save experience failed:", err.response?.data || err.message);
      alert("Failed to save experience");
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    setStoredUser(null);
    navigate("/Login");
  }, [navigate]);

  const handleDeleteAccount = useCallback(() => setShowDeleteAlert(true), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!storedUser?.id) return;
    try {
      await axios.delete(`${BASE}/api/users/${storedUser.id}`);
      localStorage.removeItem("user");
      setStoredUser(null);
      setShowDeleteAlert(false);
      navigate("/Login");
    } catch (err) {
      console.error("Delete account error:", err.response?.data || err.message);
      setDeleteError("Failed to delete account. Please try again.");
      setTimeout(() => setDeleteError(""), 5000);
    }
  }, [storedUser?.id, navigate]);

  // ─────────────────────────────────────────────
  //  LOADING STATE
  // ─────────────────────────────────────────────
  if (isLoading || !storedUser) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{ background: "linear-gradient(135deg, #ddeeff 0%, #e8d8f5 45%, #fde8cc 100%)" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted fw-semibold">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const profileImageSrc =
  profileImagePreview ||
  (userProfile.photo && userProfile.photo !== "null" && userProfile.photo !== "undefined"
    ? (userProfile.photo.startsWith("http") ? userProfile.photo : `${BASE}/uploads/${userProfile.photo}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || "User")}&background=2563eb&color=fff&size=120&bold=true`);
  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="dashboard-root">

      {/* ── NAVBAR ── */}
      <nav className="navbar-custom shadow-sm d-flex align-items-center justify-content-between px-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-light d-lg-none"
            style={{ width: 36, height: 36, padding: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <span className="brand-spacing">
            <Briefcase size={22} />
            <span>Skill<span style={{ color: "#1d4ed8" }}>Hire</span></span>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="position-relative d-none d-md-block">
            <input type="text" className="search-bar" placeholder="Search..." style={{ paddingLeft: "2.25rem" }} />
            <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <OverlayTrigger placement="bottom" overlay={<Tooltip>Add Skills</Tooltip>}>
            <button className="add-skill-btn" onClick={() => setShowAddSkillModal(true)}>
              <Plus size={18} />
            </button>
          </OverlayTrigger>

          <OverlayTrigger placement="bottom" overlay={<Tooltip>Add Experience</Tooltip>}>
            <button className="add-experience-btn" onClick={() => setShowAddExperienceModal(true)}>
              <Briefcase size={16} />
            </button>
          </OverlayTrigger>

          <div className="position-relative">
            <button className="btn btn-light" style={{ width: 38, height: 38, padding: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} />
            </button>
            <span className="badge bg-danger position-absolute" style={{ top: -4, right: -4, fontSize: "0.62rem", padding: "2px 5px", borderRadius: 10 }}>3</span>
          </div>

          <div className="user-avatar-circle ms-1">
            {getInitials(userProfile.name)}
          </div>

          <button
            className="btn btn-light d-none d-md-flex align-items-center gap-1"
            style={{ borderRadius: 10, fontSize: "0.8rem", color: "#ef4444", border: "1.5px solid #fecaca" }}
            onClick={handleDeleteAccount}
          >
            <Trash size={14} />
          </button>
        </div>
      </nav>

      {/* ── DELETE ACCOUNT ALERT ── */}
      <Alert
        show={showDeleteAlert}
        variant="danger"
        onClose={() => setShowDeleteAlert(false)}
        dismissible
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1060, maxWidth: "460px", width: "90%", borderRadius: "18px", boxShadow: "0 20px 60px rgba(220,53,69,0.2)", border: "1.5px solid rgba(220,53,69,0.15)", padding: 0 }}
      >
        <div className="d-flex align-items-start p-4 pb-3">
          <div className="d-flex align-items-center justify-content-center rounded-circle me-3 flex-shrink-0"
            style={{ width: 44, height: 44, background: "linear-gradient(135deg,#dc3545,#c82333)" }}>
            <Trash className="text-white" size={20} />
          </div>
          <div className="flex-grow-1">
            <Alert.Heading className="mb-1 fs-6 fw-bold text-dark">Delete Account Permanently?</Alert.Heading>
            <p className="mb-0 text-muted small">This action cannot be undone</p>
          </div>
        </div>
        <hr className="my-0" style={{ opacity: 0.1 }} />
        <div className="px-4 py-3">
          <p className="mb-3 text-secondary small" style={{ lineHeight: "1.6" }}>
            All your data including profile, skills, job matches, and experiences will be{" "}
            <strong className="text-danger">permanently deleted</strong>.
          </p>
        </div>
        <div className="d-flex gap-2 p-4 pt-2">
          <Button variant="outline-secondary" className="flex-grow-1 fw-semibold" style={{ borderRadius: 10 }} onClick={() => setShowDeleteAlert(false)}>Cancel</Button>
          <Button variant="danger" className="flex-grow-1 fw-semibold" style={{ borderRadius: 10, background: "linear-gradient(135deg,#dc3545,#c82333)", border: "none" }} onClick={handleConfirmDelete}>Yes, Delete Account</Button>
        </div>
      </Alert>

      {deleteError && (
        <Alert variant="danger" onClose={() => setDeleteError("")} dismissible
          className="position-fixed start-50 translate-middle-x"
          style={{ top: "20px", maxWidth: "400px", width: "90%", borderRadius: "14px", zIndex: 1061 }}>
          {deleteError}
        </Alert>
      )}

      {/* ── ADD SKILLS MODAL ── */}
      <Modal
        show={showAddSkillModal}
        onHide={handleCloseSkillModal}
        onEntered={handleFetchSkills}
        centered
        dialogClassName="add-skill-modal"
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title><Plus className="me-2 text-primary" size={20} />Add Skills &amp; Information</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-3">

          {/* Skills */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2 small text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
              Skills <Badge bg="primary" className="ms-2">{userProfile.skills?.length || 0} saved</Badge>
            </Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                type="text"
                placeholder="e.g., Flutter, Python…"
                value={currentSkillInput}
                onChange={(e) => setCurrentSkillInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSingleSkill(); } }}
              />
              <Button variant="primary" onClick={handleAddSingleSkill} disabled={!currentSkillInput.trim()}>
                <Plus size={18} />
              </Button>
            </InputGroup>

            {tempSkills.length > 0 && (
              <div className="added-skills-preview p-3 bg-light rounded-3 mb-2">
                <small className="text-muted fw-semibold d-block mb-2">New Skills to Add ({tempSkills.length}):</small>
                <div className="d-flex flex-wrap gap-2">
                  {tempSkills.map((skill, idx) => (
                    <Badge key={idx} bg="primary" pill className="px-3 py-2 d-flex align-items-center gap-1">
                      {skill}
                      <X size={13} onClick={() => handleRemoveSkillFromPreview(skill)} style={{ cursor: "pointer" }} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {userProfile.skills?.length > 0 && (
              <div className="p-2 bg-success bg-opacity-10 border border-success rounded-3 mb-2">
                <small className="text-success fw-semibold d-block mb-1">Already Saved ({userProfile.skills.length}):</small>
                <div className="d-flex flex-wrap gap-1">
                  {userProfile.skills.map((s, i) => (
                    <Badge key={i} bg="success" pill className="px-2 py-1 fw-normal" style={{ fontSize: "0.7rem" }}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            <small className="text-muted">Press Enter or click + to add skills. Skill names must be valid (from master list).</small>
          </Form.Group>

          {/* Experience */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2 small text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
              Experience <small className="text-muted fw-normal">(Auto + Manual)</small>
            </Form.Label>
            <Row className="g-2">
              <Col xs={6}>
                <Form.Control
                  type="number" min="0" placeholder="Years"
                  value={experienceYears}
                  onChange={(e) => { setExperienceYears(e.target.value); setIsManualExp(true); }}
                />
              </Col>
              <Col xs={6}>
                <Form.Control
                  type="number" min="0" max="11" placeholder="Months (0-11)"
                  value={experienceMonths}
                  onChange={(e) => { setExperienceMonths(e.target.value); setIsManualExp(true); }}
                />
              </Col>
            </Row>
            <small className="text-muted mt-1 d-block">Auto-filled from your work experience. You can edit manually.</small>
          </Form.Group>

          {/* Location */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold mb-2 small text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
              Location <small className="text-muted fw-normal">(Optional)</small>
            </Form.Label>
            <Form.Control type="text" placeholder="Full Address" value={locationInput.address} onChange={(e) => setLocationInput({ ...locationInput, address: e.target.value })} className="mb-2" />
            <Row className="g-2">
              <Col xs={8}>
                <Form.Control type="text" placeholder="City *" value={locationInput.city} onChange={(e) => setLocationInput({ ...locationInput, city: e.target.value })} />
              </Col>
              <Col xs={4}>
                <Form.Select value={locationInput.country} onChange={(e) => setLocationInput({ ...locationInput, country: e.target.value })}>
                  <option value="">Country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                </Form.Select>
              </Col>
            </Row>
          </Form.Group>

          {/* Projects */}
          <Form.Group className="mb-0">
            <Form.Label className="fw-semibold mb-2 small text-uppercase text-muted" style={{ letterSpacing: "0.5px" }}>
              Projects <Badge bg="success" className="ms-2">{userProfile.projects?.length || 0} saved</Badge>
            </Form.Label>

            {userProfile.projects?.length > 0 && (
              <div className="mb-3 p-3 bg-success bg-opacity-10 border border-success rounded-3">
                <h6 className="fw-bold text-success mb-2" style={{ fontSize: "0.82rem" }}>📂 Saved Projects ({userProfile.projects.length})</h6>
                <div className="row g-2">
                  {userProfile.projects.map((project, idx) => (
                    <div key={idx} className="col-12 col-md-6">
                      <div
                        className={`p-2 bg-white border rounded-3 shadow-sm ${editingProjectIndex === idx ? "border-primary" : ""}`}
                        onClick={() => handleEditProject(project, idx)}
                        style={{ cursor: "pointer" }}
                      >
                        <strong className="d-block text-truncate" style={{ fontSize: "0.82rem" }}>{project.title}</strong>
                        <small className="text-muted text-truncate d-block">{project.url}</small>
                        <Badge bg={editingProjectIndex === idx ? "primary" : "success"} className="mt-1" style={{ fontSize: "0.65rem" }}>
                          {editingProjectIndex === idx ? "EDITING" : project.status?.toUpperCase() || "SAVED"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tempProjects.length > 0 && (
              <div className="mb-3 p-3 bg-primary bg-opacity-10 border border-primary rounded-3">
                <h6 className="fw-bold text-primary mb-2" style={{ fontSize: "0.82rem" }}>✨ New Projects ({tempProjects.length})</h6>
                <div className="row g-2">
                  {tempProjects.map((p, i) => (
                    <div key={i} className="col-12 col-md-6">
                      <div className="p-2 bg-white border rounded-3 position-relative">
                        <Button
                          variant="outline-danger" size="sm"
                          className="position-absolute top-0 end-0 m-1 p-0"
                          style={{ width: 24, height: 24 }}
                          onClick={(e) => { e.stopPropagation(); setTempProjects(prev => prev.filter((_, idx) => idx !== i)); }}
                        >
                          <X size={12} />
                        </Button>
                        <strong className="d-block text-truncate pe-4" style={{ fontSize: "0.82rem" }}>{p.title}</strong>
                        <small className="text-muted d-block text-truncate">{p.url}</small>
                        <Badge bg="primary" style={{ fontSize: "0.65rem" }}>NEW</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-3 p-3 bg-light">
              <h6 className="fw-bold mb-3 text-primary" style={{ fontSize: "0.85rem" }}>
                {editingProject ? `✏️ Editing: ${editingProject.title}` : "➕ Add New Project"}
                {editingProject && (
                  <Button variant="outline-danger" size="sm" className="ms-2 py-0 px-2" onClick={handleCancelEditProject}>
                    <X size={12} /> Cancel
                  </Button>
                )}
              </h6>
              <Form.Control
                className="mb-2" placeholder="Project Title *"
                value={projectInput.title}
                onChange={(e) => setProjectInput({ ...projectInput, title: e.target.value })}
                isInvalid={projectInput.title !== "" && !projectInput.title.trim()}
              />
              <Form.Control
                type="url" className="mb-2" placeholder="https://github.com/…"
                value={projectInput.url}
                onChange={(e) => setProjectInput({ ...projectInput, url: e.target.value })}
                isInvalid={!!projectInput.url && !projectInput.url.startsWith("http")}
                isValid={!!projectInput.url && projectInput.url.startsWith("http")}
              />
              {projectInput.url && !projectInput.url.startsWith("http") && (
                <div className="text-danger small mb-2">❌ Must start with http:// or https://</div>
              )}
              <Form.Control
                className="mb-3" placeholder="React, Node.js (optional, comma separated)"
                value={projectInput.techUsed}
                onChange={(e) => setProjectInput({ ...projectInput, techUsed: e.target.value })}
              />
              <Button
                variant="primary" className="w-100"
                onClick={handleSaveProject}
                disabled={!projectInput.title.trim() || !projectInput.url.trim() || !projectInput.url.startsWith("http")}
              >
                {editingProject
                  ? <><CheckCircle size={16} className="me-2" />Update Project</>
                  : <><Plus size={16} className="me-2" />Add Project</>}
              </Button>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={handleCloseSkillModal}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleAddAllSkills}>
            <CheckCircle size={16} className="me-2" />Save All
            <Badge bg="light" text="dark" className="ms-2">{tempSkills.length + tempProjects.length}</Badge>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── ADD EXPERIENCE MODAL ── */}
      <Modal
        show={showAddExperienceModal}
        onHide={handleCloseExperienceModal}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title><Briefcase className="me-2 text-primary" size={20} />Add Work Experience</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-3">
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1 small">Job Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text" placeholder="e.g., Frontend Developer"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1 small">Company <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text" placeholder="e.g., TechCorp"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-1 small">Type</Form.Label>
                  <Form.Select value={newExperience.type} onChange={(e) => setNewExperience({ ...newExperience, type: e.target.value })}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label className="fw-semibold mb-1 small">Responsibilities</Form.Label>
              <Form.Control
                as="textarea" rows={4}
                placeholder="• Built responsive UI&#10;• Led development team"
                value={newExperience.responsibilities}
                onChange={(e) => setNewExperience({ ...newExperience, responsibilities: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseExperienceModal}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleAddExperience}
            disabled={!newExperience.title?.trim() || !newExperience.company?.trim()}
          >
            <CheckCircle size={16} className="me-2" />Save Experience
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── SKILLS SUMMARY MODAL ── */}
      <Modal show={showSkillsModal} onHide={() => setShowSkillsModal(false)} centered backdrop="static" size="md">
        <Modal.Header closeButton><Modal.Title>Skills &amp; Experience Level</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-success fw-bold mb-0">✅ Experience added successfully!</p>
          <p className="text-muted mt-2">Your experience field has been <strong>automatically updated</strong> based on your work history.</p>
          <div className="mt-3 p-3 bg-light rounded-3">
            <h6>Current Level: <span>{userProfile.level || "Fresher"}</span></h6>
            <p className="mb-0">Experience: <strong>{userProfile.experience?.years || 0} years {userProfile.experience?.months || 0} months</strong></p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSkillsModal(false)}>Done</Button>
        </Modal.Footer>
      </Modal>

      {/* ── JOB DETAILS MODAL (view only, no apply) ── */}
      <Modal show={!!selectedJob} onHide={() => setSelectedJob(null)} centered size="lg">
        {selectedJob && (
          <>
            <Modal.Header className="border-bottom pb-3">
              <div className="d-flex align-items-center gap-3 flex-grow-1">
                <CompanyLogo company={selectedJob.company} size={48} />
                <div>
                  <h5 className="mb-0 fw-bold" style={{ fontSize: "1rem" }}>{selectedJob.title}</h5>
                  <small className="text-muted"><strong>{selectedJob.company}</strong></small>
                </div>
                <Badge
                  bg={selectedJob.fitStatus === "Strong" ? "success" : selectedJob.fitStatus === "Partial" ? "warning" : "secondary"}
                  className="ms-auto px-3 py-2"
                >
                  {selectedJob.match}% Match
                </Badge>
              </div>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
              <Row className="mb-4 g-3">
                {[
                  { label: "Fit Status", value: selectedJob.fitStatus ?? "N/A" },
                  { label: "Match Score", value: `${selectedJob.match}%` },
                  { label: "Matched Skills", value: selectedJob.matchedSkills?.length ?? 0 },
                ].map((stat) => (
                  <Col key={stat.label}>
                    <div className="bg-light rounded-3 p-3 text-center">
                      <small className="text-muted d-block mb-1">{stat.label}</small>
                      <strong style={{ fontSize: "0.9rem" }}>{stat.value}</strong>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <CheckCircle className="text-success me-2" size={16} />
                  <h6 className="mb-0 fw-semibold text-success">
                    Matched Skills <Badge bg="success" pill className="ms-2">{selectedJob.matchedSkills?.length ?? 0}</Badge>
                  </h6>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedJob.matchedSkills?.length > 0
                    ? selectedJob.matchedSkills.map((skill) => (
                        <Badge key={skill} bg="success" pill className="px-3 py-2 fw-normal">{skill}</Badge>
                      ))
                    : <small className="text-muted">No matched skills found</small>}
                </div>
              </div>
              <div>
                <div className="d-flex align-items-center mb-2">
                  <LightbulbFill className="text-warning me-2" size={16} />
                  <h6 className="mb-0 fw-semibold text-warning">
                    Missing Skills <Badge bg="warning" text="dark" pill className="ms-2">{selectedJob.missingSkills?.length ?? 0}</Badge>
                  </h6>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedJob.missingSkills?.length > 0
                    ? selectedJob.missingSkills.map((skill) => (
                        <Badge key={skill} bg="danger" pill className="px-3 py-2 fw-normal">{skill}</Badge>
                      ))
                    : <small className="text-success"><CheckCircle size={13} className="me-1" />You have all required skills!</small>}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setSelectedJob(null)}>Close</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-content">

          {/* Profile Section */}
          <div className="user-profile-section">
  <div className="profile-image-container">
    <Image
      src={profileImageSrc}
      roundedCircle width={80} height={80}
      className="border border-3 border-primary shadow"
      alt="Profile"
    />
    {isEditing && (
      <label
        htmlFor="profile-upload"
        className="btn btn-light btn-sm p-1 rounded-circle shadow-sm position-absolute bottom-0 end-0"
        style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <PencilSquare size={13} />
      </label>
    )}
    <input id="profile-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImageChange} />
    {isEditing && (profileImagePreview || (userProfile.photo && userProfile.photo !== "null")) && (
      <Button
        variant="light" size="sm"
        className="position-absolute top-0 end-0 p-1 rounded-circle shadow-sm"
        style={{ width: 24, height: 24 }}
        onClick={(e) => { e.stopPropagation(); setProfileImageFile(null); setProfileImagePreview(null); setEditedProfile(prev => ({ ...prev, photo: "" })); }}
      >
        <Trash size={12} />
      </Button>
    )}
  </div>

  {isEditing ? (
    <Form.Control
      type="text" value={editedProfile.name}
      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
      size="sm" className="mb-2 text-center"
    />
  ) : (
    <h5 className="mb-0">{userProfile.name}</h5>
  )}
  {!isEditing && <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>{userProfile.email}</small>}
  {isEditing && (
    <Form.Control
      type="email" value={editedProfile.email}
      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
      size="sm" className="mb-2" placeholder="Email"
    />
  )}
  <span className="role-badge">JOB SEEKER</span>

  <div className="d-grid gap-2 mt-3">
    {!isEditing ? (
      <Button variant="outline-primary" size="sm" onClick={handleEditClick}>
        <PencilSquare size={14} className="me-1" /> Edit Profile
      </Button>
    ) : (
      <>
        <Button variant="success" size="sm" onClick={handleSaveClick}>
          <CheckCircle size={14} className="me-1" /> Save Changes
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit}>Cancel</Button>
      </>
    )}
  </div>
</div>

          {/* ── SIDEBAR NAV: Overview only ── */}
          <nav className="sidebar-nav">
            <button className="sidebar-nav-item active">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Overview
            </button>
          </nav>

          {/* Skills chips */}
          <div className="skills-section">
            <div className="skills-section-header">
              <h6>MY SKILLS</h6>
              <span style={{ fontSize: "0.72rem", color: "#3b82f6", cursor: "pointer", fontWeight: 600 }} onClick={() => setShowAddSkillModal(true)}>
                + Add Skills
              </span>
            </div>
            <div className="skills-container">
              {(isEditing ? editedProfile.skills : userProfile.skills)?.length > 0 ? (
                (isEditing ? editedProfile.skills : userProfile.skills).map((skill, idx) => (
                  <Badge key={`${skill}-${idx}`} className="skill-badge d-inline-flex align-items-center gap-1">
                    {skill}
                    {isEditing && (
                      <button
                        type="button" className="btn-close btn-close-white p-0"
                        style={{ fontSize: "0.5rem", width: 12, height: 12, opacity: 0.8 }}
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    )}
                  </Badge>
                ))
              ) : (
                <div className="text-center py-2 w-100">
                  <small className="text-muted fst-italic d-block mb-1">No skills added yet</small>
                  <span className="text-primary small" style={{ cursor: "pointer" }} onClick={() => setShowAddSkillModal(true)}>+ Add Skills</span>
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <Button variant="secondary" size="sm" onClick={handleLogout} className="w-100">
            <BoxArrowRight size={14} className="me-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* ── MAIN BODY ── */}
      <div className="dashboard-body">
        <div className={`sidebar-spacer ${sidebarOpen ? "open" : ""}`} />
        <main className="main-content">
          <Container fluid>

            {/* Welcome Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 welcome-header">
              <div>
                <h2 className="mb-1">Welcome Back, {userProfile.name}! 👋</h2>
                <p className="mb-0">Manage your skills and track your job matches</p>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0 welcome-actions">
                <Button variant="outline-primary" size="sm" onClick={() => setShowAddSkillModal(true)}>
                  <Plus size={14} className="me-1" /> Add Skills
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddExperienceModal(true)}>
                  <Briefcase size={14} className="me-1" /> Add Experience
                </Button>
                <Button variant="outline-danger" size="sm" onClick={handleDeleteAccount}>
                  <Trash size={14} className="me-1" /> Delete Account
                </Button>
              </div>
            </div>

            {successMsg && (
              <div className="alert alert-success mb-4 rounded-3" style={{ fontSize: "0.875rem" }}>{successMsg}</div>
            )}

            {/* Stats Row */}
            <Row className="mb-4 g-3">
              {stats.map((s, idx) => (
                <Col lg={3} md={6} key={idx}>
                  <Card className="stat-card border-0 h-100">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted text-uppercase small mb-2">{s.label}</h6>
                        <h2 className="mb-1 fw-bold" style={{ fontSize: s.label === "Top Fit Job" ? "1rem" : undefined }}>
                          {s.value}
                        </h2>
                        <small className="text-success fw-semibold">
                          <GraphUp size={11} className="me-1" />{s.change} from last week
                        </small>
                      </div>
                      <div className="icon-circle">{s.icon}</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Recommended Jobs + Top Companies */}
            <Row className="mb-4 g-4">
              {/* Recommended Jobs */}
              <Col lg={6}>
                <Card className="border-0 h-100">
                  <Card.Header className="d-flex align-items-center justify-content-between">
                    <span><Briefcase className="me-2" size={16} />Top Recommended Jobs</span>
                    <Badge bg="primary" pill>{recommendedJobs.length}</Badge>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {recommendedJobs.length === 0 ? (
                      <div className="text-center py-5">
                        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>💼</div>
                        <p className="text-muted small mb-0">No recommendations yet. Add your skills to get started.</p>
                      </div>
                    ) : (
                      recommendedJobs.map((job, index) => {
                        const color = getCompanyColor(job.company);
                        const initials = getInitials(job.company);
                        return (
                          <div
                            key={job.jobId || index}
                            className={`d-flex justify-content-between align-items-center py-3 px-3 job-item ${index !== recommendedJobs.length - 1 ? "border-bottom" : ""}`}
                          >
                            <div className="d-flex align-items-center flex-grow-1 me-3">
                              <div
                                className="me-3 flex-shrink-0"
                                style={{ width: 46, height: 46, borderRadius: 12, background: color.bg, border: `1.5px solid ${color.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, userSelect: "none" }}
                              >
                                <span style={{ fontSize: 14, fontWeight: 800, color: color.text, lineHeight: 1 }}>{initials}</span>
                                <span style={{ fontSize: 7, fontWeight: 600, color: color.text, opacity: 0.7, maxWidth: 42, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.company?.split(" ")[0]}</span>
                              </div>
                              <div>
                                <div className="fw-bold" style={{ fontSize: "0.875rem", color: "#1e293b" }}>{job.title}</div>
                                <small className="text-muted"><strong>{job.company}</strong></small>
                              </div>
                            </div>
                            <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                              <Badge
                                bg={job.fitStatus === "Strong" ? "success" : job.fitStatus === "Partial" ? "warning" : "secondary"}
                                style={{ fontSize: "0.68rem" }}
                              >
                                {job.match}% {job.fitStatus}
                              </Badge>
                              <Button
                                size="sm" variant="outline-primary"
                                className="px-2 py-1" style={{ fontSize: "0.75rem" }}
                                onClick={() => setSelectedJob(job)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Top Companies */}
              <Col lg={6}>
                <Card className="border-0 h-100">
                  <Card.Header className="d-flex align-items-center justify-content-between">
                    <span><Briefcase className="me-2" size={16} />Top Companies Hiring</span>
                    <Badge bg="secondary" pill>{topCompanies.length}</Badge>
                  </Card.Header>
                  <Card.Body className="p-3">
                    {topCompanies.length === 0 ? (
                      <div className="text-center py-5">
                        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🏢</div>
                        <p className="text-muted small mb-0">No companies found yet</p>
                      </div>
                    ) : (
                      <Row className="g-3">
                        {topCompanies.map((company, index) => (
                          <Col xs={12} key={index}>
                            <div className="d-flex align-items-center p-2 rounded-3" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                              <div className="me-3 flex-shrink-0">
                                <CompanyLogo company={company.name} size={44} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-bold" style={{ fontSize: "0.875rem", color: "#1e293b" }}>{company.name}</div>
                                <small className="text-muted">{company.jobTitle}</small>
                              </div>
                              <Badge bg="primary" className="ms-2">{company.match}% Match</Badge>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Skill Gap Analysis */}
            <Row className="mb-4">
              <Col xs={12}>
                <Card className="skill-gap-card border-0">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <GraphUpArrow className="text-primary" size={20} />
                        <h5 className="mb-0 fw-bold" style={{ fontFamily: "Sora, sans-serif", fontSize: "1rem" }}>Skill Gap Analysis</h5>
                      </div>
                      <Badge bg="info" pill className="px-3 py-2" style={{ fontSize: "0.75rem" }}>{coveragePercentage}% Coverage</Badge>
                    </div>

                    <p className="text-muted small mb-3">Your skills vs. market demand</p>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Skill Coverage</span>
                        <span className="fw-bold text-primary">{coveragePercentage}%</span>
                      </div>
                      <ProgressBar now={coveragePercentage} className="skill-progress-bar" variant="primary" />
                    </div>

                    <Row>
                      <Col lg={6} md={12} className="mb-3 mb-lg-0">
                        <div className="d-flex align-items-center mb-2 gap-1">
                          <CheckCircle className="text-success" size={15} />
                          <h6 className="mb-0 fw-semibold text-success" style={{ fontSize: "0.85rem" }}>You Have</h6>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {currentSkills.length > 0
                            ? currentSkills.map((skill, idx) => (
                                <Badge key={idx} bg="primary" pill className="px-3 py-2 fw-normal" style={{ fontSize: "0.75rem" }}>{skill.name}</Badge>
                              ))
                            : <small className="text-muted fst-italic">No matched skills yet</small>}
                        </div>
                      </Col>
                      <Col lg={6} md={12}>
                        <div className="d-flex align-items-center mb-2 gap-1">
                          <LightbulbFill className="text-warning" size={15} />
                          <h6 className="mb-0 fw-semibold text-warning" style={{ fontSize: "0.85rem" }}>Skills to Learn</h6>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {skillsToLearn.length > 0
                            ? skillsToLearn.map((skill, idx) => (
                                <Badge key={idx} bg="light" text="dark" pill className="px-3 py-2 fw-normal" style={{ fontSize: "0.75rem", border: "1px solid #e2e8f0" }}>
                                  {skill.name}
                                  {skill.priority && <span className="ms-1 text-muted">({skill.priority})</span>}
                                </Badge>
                              ))
                            : <small className="text-muted fst-italic">No missing skills</small>}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

          </Container>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;