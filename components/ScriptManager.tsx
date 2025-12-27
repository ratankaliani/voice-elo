"use client";

import { useState } from "react";

interface Script {
  id: string;
  title: string;
  content: string;
  category?: string | null;
}

const CATEGORIES = [
  "greeting",
  "troubleshooting",
  "billing",
  "empathy",
  "hold_transfer",
  "closing",
  "confirmation",
  "escalation",
];

export default function ScriptManager({
  scripts: initialScripts,
}: {
  scripts: Script[];
}) {
  const [scripts, setScripts] = useState(initialScripts);
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "greeting",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newScript = await res.json();
      setScripts([newScript, ...scripts]);
      setForm({ title: "", content: "", category: "greeting" });
      setShowAdd(false);
    }
  };

  const generateScript = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: form.category, saveToDb: true }),
      });
      if (res.ok) {
        const newScript = await res.json();
        setScripts([newScript, ...scripts]);
      } else {
        alert("Failed to generate. Check OpenAI API key.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const deleteScript = async (id: string) => {
    if (!confirm("Delete this script?")) return;
    const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScripts(scripts.filter((s) => s.id !== id));
    }
  };

  return (
    <section className="admin-section">
      <div className="section-header">
        <h2>Scripts</h2>
        <div className="section-actions">
          <button
            className="btn btn-primary"
            onClick={generateScript}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate with AI"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? "Cancel" : "Add Manually"}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="form-input"
            placeholder="Script content..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            required
          />
          <button type="submit" className="btn btn-primary">
            Save Script
          </button>
        </form>
      )}

      <div className="scripts-list">
        {scripts.length === 0 ? (
          <p className="empty-state">No scripts yet</p>
        ) : (
          scripts.map((s) => (
            <div key={s.id} className="script-item">
              <div className="script-meta">
                <strong>{s.title}</strong>
                {s.category && <span className="badge">{s.category}</span>}
              </div>
              <p className="script-text">{s.content}</p>
              <button
                className="btn-text danger"
                onClick={() => deleteScript(s.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
