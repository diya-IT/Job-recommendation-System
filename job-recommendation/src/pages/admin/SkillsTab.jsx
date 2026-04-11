import { Plus, Star, Search, X, Database, Trash2, Edit2, Tag, Layers, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Skills.css";

const API = "http://localhost:5000/api/skillmaster";

const CATEGORIES = ["Frontend", "Backend", "Database", "DevOps", "Mobile", "Testing", "AI/ML", "Design", "Other"];

const CATEGORY_COLORS = {
  Frontend:  { bg: "rgba(99,102,241,0.12)",  text: "#4338ca", border: "rgba(99,102,241,0.3)" },
  Backend:   { bg: "rgba(234,88,12,0.12)",   text: "#c2410c", border: "rgba(234,88,12,0.3)" },
  Database:  { bg: "rgba(16,185,129,0.12)",  text: "#047857", border: "rgba(16,185,129,0.3)" },
  DevOps:    { bg: "rgba(14,165,233,0.12)",  text: "#0369a1", border: "rgba(14,165,233,0.3)" },
  Mobile:    { bg: "rgba(168,85,247,0.12)",  text: "#7c3aed", border: "rgba(168,85,247,0.3)" },
  Testing:   { bg: "rgba(245,158,11,0.12)",  text: "#b45309", border: "rgba(245,158,11,0.3)" },
  "AI/ML":   { bg: "rgba(236,72,153,0.12)",  text: "#be185d", border: "rgba(236,72,153,0.3)" },
  Design:    { bg: "rgba(20,184,166,0.12)",  text: "#0f766e", border: "rgba(20,184,166,0.3)" },
  Other:     { bg: "rgba(107,114,128,0.12)", text: "#374151", border: "rgba(107,114,128,0.3)" },
};

const SkillsTab = () => {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canonical, setCanonical] = useState("");
  const [category, setCategory] = useState("");
  const [aliases, setAliases] = useState([""]);
  const [formError, setFormError] = useState("");

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setSkills(res.data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  const filtered = skills.filter(s =>
    s.canonical?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase()) ||
    s.aliases?.some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  const openModal = (skill = null) => {
    if (skill) {
      setCanonical(skill.canonical);
      setCategory(skill.category);
      setAliases(skill.aliases?.length ? skill.aliases : [""]);
      setEditingSkill(skill);
    } else {
      setCanonical(""); setCategory(""); setAliases([""]); setEditingSkill(null);
    }
    setFormError(""); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setCanonical(""); setCategory(""); setAliases([""]); setEditingSkill(null);
  };

  const updateAlias = (i, val) => { const copy = [...aliases]; copy[i] = val; setAliases(copy); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canonical.trim()) return setFormError("Canonical name is required");
    if (!category) return setFormError("Please select a category");
    const payload = { canonical: canonical.trim(), category, aliases: aliases.map(a => a.trim()).filter(Boolean) };
    try {
      if (editingSkill) await axios.put(`${API}/${editingSkill._id}`, payload);
      else await axios.post(API, payload);
      fetchSkills(); closeModal();
    } catch (err) { console.error(err); setFormError("Server error"); }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try { await axios.delete(`${API}/${id}`); fetchSkills(); }
    catch (err) { console.error("Delete error:", err); }
  };

  return (
    <>
      <div className="skills-page">

        {/* Header */}
        <div className="skills-header">
          <div className="skills-header-left">
            <div className="skills-icon-box"><Star size={22} /></div>
            <div>
              <h1 className="skills-title">Skills Database</h1>
              <p className="skills-subtitle">
                {skills.length} skills · {[...new Set(skills.map(s => s.category))].length} categories
              </p>
            </div>
          </div>
          <button className="skills-add-btn" onClick={() => openModal()}>
            <Plus size={16} /> Add Skill
          </button>
        </div>

        {/* Search */}
        <div className="skills-search-wrap">
          <Search size={16} className="skills-search-icon" />
          <input
            className="skills-search-input"
            placeholder="Search canonical name, alias, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="skills-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="skills-table-card">
          <div className="skills-table-top">
            <span className="skills-table-label"><Database size={16} /> All Skills</span>
            <span className="skills-count-badge">{filtered.length} / {skills.length}</span>
          </div>

          <div className="skills-table-wrap">
            <table className="skills-table">
              <thead>
                <tr>
                  <th>Canonical</th>
                  <th>Aliases</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="skills-empty">
                      <Database size={36} color="#d1d5db" />
                      <p>Loading skills...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="skills-empty">
                      <Database size={36} color="#d1d5db" />
                      <p>No skills match your search</p>
                    </td>
                  </tr>
                ) : filtered.map(skill => {
                  const color = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Other;
                  return (
                    <tr key={skill._id} className="skills-row">
                      <td><span className="skills-canonical">{skill.canonical}</span></td>
                      <td>
                        <div className="skills-aliases-wrap">
                          {skill.aliases?.length
                            ? skill.aliases.map((a, i) => <span key={i} className="skills-alias-tag">{a}</span>)
                            : <span className="skills-no-alias">—</span>}
                        </div>
                      </td>
                      <td>
                        <span className="skills-category-badge" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                          {skill.category}
                        </span>
                      </td>
                      <td>
                        <div className="skills-actions">
                          <button className="skills-edit-btn" onClick={() => openModal(skill)} title="Edit"><Edit2 size={14} /></button>
                          <button className="skills-delete-btn" onClick={() => deleteSkill(skill._id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="skills-modal-overlay" onClick={closeModal}>
          <div className="skills-modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="skills-modal-form">

              <div className="skills-modal-header">
                <div className="skills-modal-title-row">
                  <div className="skills-modal-icon">
                    {editingSkill ? <Edit size={18} /> : <Plus size={18} />}
                  </div>
                  <h2 className="skills-modal-title">{editingSkill ? "Edit Skill" : "Add New Skill"}</h2>
                </div>
                <button type="button" className="skills-modal-close" onClick={closeModal}><X size={18} /></button>
              </div>

              <div className="skills-field">
                <label className="skills-label"><Tag size={13} /> Canonical Name</label>
                <input className="skills-input" value={canonical} onChange={e => setCanonical(e.target.value)} placeholder="e.g. React" />
              </div>

              <div className="skills-field">
                <label className="skills-label"><Layers size={13} /> Category</label>
                <div className="skills-category-grid">
                  {CATEGORIES.map(cat => {
                    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                    return (
                      <button
                        type="button"
                        key={cat}
                        className={`skills-cat-option ${category === cat ? "selected" : ""}`}
                        style={category === cat ? { background: color.bg, color: color.text, borderColor: color.border } : {}}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="skills-field">
                <label className="skills-label">Aliases</label>
                {aliases.map((alias, i) => (
                  <input key={i} className="skills-input" value={alias} onChange={e => updateAlias(i, e.target.value)} placeholder={`Alias ${i + 1}`} />
                ))}
                <button type="button" className="skills-alias-add-btn" onClick={() => setAliases([...aliases, ""])}>
                  <Plus size={13} /> Add Alias
                </button>
              </div>

              {formError && <p className="skills-form-error">{formError}</p>}

              <div className="skills-modal-actions">
                <button type="button" className="skills-cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="skills-submit-btn">
                  {editingSkill ? "Update Skill" : "Create Skill"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SkillsTab;