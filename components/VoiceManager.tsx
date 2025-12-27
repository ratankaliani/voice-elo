"use client";

import { useState } from "react";

interface Voice {
  id: string;
  name: string;
  voiceId: string;
  provider: string;
  description?: string | null;
  isActive: boolean;
}

interface ProviderVoice {
  id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
}

export default function VoiceManager({
  voices: initialVoices,
}: {
  voices: Voice[];
}) {
  const [voices, setVoices] = useState(initialVoices);
  const [importingFrom, setImportingFrom] = useState<
    "elevenlabs" | "cartesia" | null
  >(null);
  const [providerVoices, setProviderVoices] = useState<ProviderVoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVoices = async (provider: "elevenlabs" | "cartesia") => {
    setLoading(true);
    setImportingFrom(provider);
    try {
      const res = await fetch(`/api/${provider}/voices`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // Normalize the response
      const normalized =
        provider === "elevenlabs"
          ? data.map((v: any) => ({
              id: v.voice_id,
              name: v.name,
              category: v.category,
              preview_url: v.preview_url,
            }))
          : data.map((v: any) => ({
              id: v.id,
              name: v.name,
              description: v.description,
            }));

      setProviderVoices(normalized);
    } catch {
      alert(`Failed to fetch ${provider} voices`);
      setImportingFrom(null);
    } finally {
      setLoading(false);
    }
  };

  const importVoice = async (v: ProviderVoice) => {
    if (!importingFrom) return;
    if (
      voices.some(
        (existing) =>
          existing.voiceId === v.id && existing.provider === importingFrom
      )
    ) {
      alert("Already imported");
      return;
    }

    const res = await fetch("/api/voices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        voiceId: v.id,
        provider: importingFrom,
        description: v.description || v.category || "",
      }),
    });

    if (res.ok) {
      const newVoice = await res.json();
      setVoices([newVoice, ...voices]);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/voices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      setVoices(
        voices.map((v) => (v.id === id ? { ...v, isActive: !current } : v))
      );
    }
  };

  const deleteVoice = async (id: string) => {
    if (!confirm("Delete this voice?")) return;
    const res = await fetch(`/api/voices/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVoices(voices.filter((v) => v.id !== id));
    }
  };

  const isImported = (id: string) =>
    voices.some((v) => v.voiceId === id && v.provider === importingFrom);

  return (
    <section className="admin-section">
      <div className="section-header">
        <h2>Voices</h2>
        <div className="section-actions">
          <button
            className="btn btn-primary"
            onClick={() => fetchVoices("elevenlabs")}
            disabled={loading}
          >
            {loading && importingFrom === "elevenlabs"
              ? "Loading..."
              : "Import ElevenLabs"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => fetchVoices("cartesia")}
            disabled={loading}
          >
            {loading && importingFrom === "cartesia"
              ? "Loading..."
              : "Import Cartesia"}
          </button>
        </div>
      </div>

      {importingFrom && providerVoices.length > 0 && (
        <div className="import-panel">
          <div className="import-header">
            <span>
              {providerVoices.length} voices from {importingFrom}
            </span>
            <button className="btn-text" onClick={() => setImportingFrom(null)}>
              Close
            </button>
          </div>
          <div className="import-grid">
            {providerVoices.map((v) => (
              <div
                key={v.id}
                className={`import-card ${isImported(v.id) ? "imported" : ""}`}
              >
                <div className="import-info">
                  <strong>{v.name}</strong>
                  <small>{v.category || v.description || ""}</small>
                </div>
                <button
                  className="btn btn-small"
                  onClick={() => importVoice(v)}
                  disabled={isImported(v.id)}
                >
                  {isImported(v.id) ? "✓" : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {voices.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty-state">
                No voices yet
              </td>
            </tr>
          ) : (
            voices.map((v) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>
                  <span
                    className={`badge ${
                      v.provider === "cartesia"
                        ? "badge-cartesia"
                        : "badge-elevenlabs"
                    }`}
                  >
                    {v.provider === "cartesia" ? "Cartesia" : "11Labs"}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${v.isActive ? "badge-success" : ""}`}
                  >
                    {v.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn-text"
                    onClick={() => toggleActive(v.id, v.isActive)}
                  >
                    {v.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="btn-text danger"
                    onClick={() => deleteVoice(v.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
