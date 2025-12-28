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

  // Custom import state
  const [showCustomImport, setShowCustomImport] = useState(false);
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [customProvider, setCustomProvider] = useState<
    "elevenlabs" | "cartesia"
  >("elevenlabs");
  const [customImportLoading, setCustomImportLoading] = useState(false);
  const [customImportError, setCustomImportError] = useState<string | null>(
    null
  );
  const [fetchedVoice, setFetchedVoice] = useState<ProviderVoice | null>(null);

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

  const lookupVoice = async () => {
    if (!customVoiceId.trim()) {
      setCustomImportError("Please enter a voice ID");
      return;
    }

    setCustomImportLoading(true);
    setCustomImportError(null);
    setFetchedVoice(null);

    try {
      const res = await fetch(
        `/api/${customProvider}/voices/${customVoiceId.trim()}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Voice not found. Check the ID and try again.");
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch voice");
      }

      const data = await res.json();

      // Normalize the response
      const normalized: ProviderVoice =
        customProvider === "elevenlabs"
          ? {
              id: data.voice_id,
              name: data.name,
              category: data.category,
              description: data.description,
              preview_url: data.preview_url,
            }
          : {
              id: data.id,
              name: data.name,
              description: data.description,
            };

      setFetchedVoice(normalized);
    } catch (err: any) {
      setCustomImportError(err.message || "Failed to lookup voice");
    } finally {
      setCustomImportLoading(false);
    }
  };

  const importCustomVoice = async () => {
    if (!fetchedVoice) return;

    if (
      voices.some(
        (v) => v.voiceId === fetchedVoice.id && v.provider === customProvider
      )
    ) {
      setCustomImportError("This voice is already imported");
      return;
    }

    setCustomImportLoading(true);

    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fetchedVoice.name,
          voiceId: fetchedVoice.id,
          provider: customProvider,
          description: fetchedVoice.description || fetchedVoice.category || "",
        }),
      });

      if (res.ok) {
        const newVoice = await res.json();
        setVoices([newVoice, ...voices]);
        // Reset custom import state
        setShowCustomImport(false);
        setCustomVoiceId("");
        setFetchedVoice(null);
        setCustomImportError(null);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to import voice");
      }
    } catch (err: any) {
      setCustomImportError(err.message || "Failed to import voice");
    } finally {
      setCustomImportLoading(false);
    }
  };

  const closeCustomImport = () => {
    setShowCustomImport(false);
    setCustomVoiceId("");
    setFetchedVoice(null);
    setCustomImportError(null);
  };

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
          <button
            className="btn btn-secondary"
            onClick={() => setShowCustomImport(true)}
            disabled={loading}
          >
            + Custom ID
          </button>
        </div>
      </div>

      {showCustomImport && (
        <div className="custom-import-panel">
          <div className="import-header">
            <span>Import Voice by ID</span>
            <button className="btn-text" onClick={closeCustomImport}>
              Close
            </button>
          </div>

          <div className="custom-import-form">
            <div className="custom-import-row">
              <select
                className="form-select custom-provider-select"
                value={customProvider}
                onChange={(e) => {
                  setCustomProvider(
                    e.target.value as "elevenlabs" | "cartesia"
                  );
                  setFetchedVoice(null);
                  setCustomImportError(null);
                }}
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="cartesia">Cartesia</option>
              </select>
              <input
                type="text"
                className="form-input custom-voice-input"
                placeholder="Enter voice ID..."
                value={customVoiceId}
                onChange={(e) => {
                  setCustomVoiceId(e.target.value);
                  setFetchedVoice(null);
                  setCustomImportError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookupVoice();
                }}
              />
              <button
                className="btn btn-primary"
                onClick={lookupVoice}
                disabled={customImportLoading || !customVoiceId.trim()}
              >
                {customImportLoading ? "Looking up..." : "Lookup"}
              </button>
            </div>

            {customImportError && (
              <div className="custom-import-error">{customImportError}</div>
            )}

            {fetchedVoice && (
              <div className="custom-import-result">
                <div className="import-card">
                  <div className="import-info">
                    <strong>{fetchedVoice.name}</strong>
                    <small>
                      {fetchedVoice.description ||
                        fetchedVoice.category ||
                        fetchedVoice.id}
                    </small>
                  </div>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={importCustomVoice}
                    disabled={
                      customImportLoading ||
                      voices.some(
                        (v) =>
                          v.voiceId === fetchedVoice.id &&
                          v.provider === customProvider
                      )
                    }
                  >
                    {voices.some(
                      (v) =>
                        v.voiceId === fetchedVoice.id &&
                        v.provider === customProvider
                    )
                      ? "✓ Imported"
                      : customImportLoading
                      ? "Importing..."
                      : "Import"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
