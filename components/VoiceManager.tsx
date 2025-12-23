"use client";

import { useState } from "react";

interface Voice {
  id: string;
  name: string;
  voiceId: string;
  description?: string | null;
  isActive: boolean;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string | null;
  labels: Record<string, string>;
  preview_url: string;
}

interface VoiceManagerProps {
  voices: Voice[];
}

export default function VoiceManager({ voices: initialVoices }: VoiceManagerProps) {
  const [voices, setVoices] = useState(initialVoices);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    voiceId: "",
    description: "",
    isActive: true,
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    voiceId: "",
    description: "",
  });

  const fetchElevenLabsVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch("/api/elevenlabs/voices");
      if (response.ok) {
        const data = await response.json();
        setElevenLabsVoices(data);
        setIsImporting(true);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to fetch 11Labs voices. Check your API key.");
      }
    } catch (error) {
      console.error("Error fetching 11Labs voices:", error);
      alert("Error fetching 11Labs voices");
    } finally {
      setLoadingVoices(false);
    }
  };

  const importVoice = async (elevenLabsVoice: ElevenLabsVoice) => {
    // Check if already imported
    if (voices.some((v) => v.voiceId === elevenLabsVoice.voice_id)) {
      alert("This voice has already been imported");
      return;
    }

    try {
      const response = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: elevenLabsVoice.name,
          voiceId: elevenLabsVoice.voice_id,
          description: elevenLabsVoice.description || `${elevenLabsVoice.category} voice`,
          isActive: true,
        }),
      });

      if (response.ok) {
        const newVoice = await response.json();
        setVoices([newVoice, ...voices]);
      } else {
        alert("Failed to import voice");
      }
    } catch (error) {
      console.error("Error importing voice:", error);
      alert("Error importing voice");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newVoice = await response.json();
        setVoices([...voices, newVoice]);
        setFormData({ name: "", voiceId: "", description: "", isActive: true });
        setIsAdding(false);
      } else {
        alert("Failed to create voice");
      }
    } catch (error) {
      console.error("Error creating voice:", error);
      alert("Error creating voice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voice?")) return;

    try {
      const response = await fetch(`/api/voices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVoices(voices.filter((v) => v.id !== id));
      } else {
        alert("Failed to delete voice");
      }
    } catch (error) {
      console.error("Error deleting voice:", error);
      alert("Error deleting voice");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/voices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setVoices(
          voices.map((v) =>
            v.id === id ? { ...v, isActive: !currentStatus } : v
          )
        );
      } else {
        alert("Failed to update voice");
      }
    } catch (error) {
      console.error("Error updating voice:", error);
      alert("Error updating voice");
    }
  };

  const startEditing = (voice: Voice) => {
    setEditingVoice(voice);
    setEditFormData({
      name: voice.name,
      voiceId: voice.voiceId,
      description: voice.description || "",
    });
    setIsAdding(false);
    setIsImporting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoice) return;

    try {
      const response = await fetch(`/api/voices/${editingVoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedVoice = await response.json();
        setVoices(
          voices.map((v) =>
            v.id === editingVoice.id ? updatedVoice : v
          )
        );
        setEditingVoice(null);
      } else {
        alert("Failed to update voice");
      }
    } catch (error) {
      console.error("Error updating voice:", error);
      alert("Error updating voice");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Voices</h3>
          <div className="flex gap-2">
            <button
              onClick={fetchElevenLabsVoices}
              disabled={loadingVoices}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loadingVoices ? "Loading..." : "Import from 11Labs"}
            </button>
            <button
              onClick={() => {
                setIsAdding(!isAdding);
                setIsImporting(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isAdding ? "Cancel" : "Add Manually"}
            </button>
          </div>
        </div>
      </div>

      {isImporting && elevenLabsVoices.length > 0 && (
        <div className="p-6 border-b bg-purple-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-purple-900">
              Available 11Labs Voices ({elevenLabsVoices.length})
            </h4>
            <button
              onClick={() => setIsImporting(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {elevenLabsVoices.map((voice) => {
              const isImported = voices.some((v) => v.voiceId === voice.voice_id);
              return (
                <div
                  key={voice.voice_id}
                  className={`p-3 rounded-md border ${
                    isImported ? "bg-gray-100 border-gray-300" : "bg-white border-purple-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{voice.name}</p>
                      <p className="text-xs text-gray-500">{voice.category}</p>
                      {voice.preview_url && (
                        <audio
                          src={voice.preview_url}
                          controls
                          className="mt-2 h-8 w-full"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => importVoice(voice)}
                      disabled={isImported}
                      className={`px-2 py-1 text-xs rounded ${
                        isImported
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {isImported ? "Imported" : "Import"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Professional Male"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                11labs Voice ID
              </label>
              <input
                type="text"
                required
                value={formData.voiceId}
                onChange={(e) =>
                  setFormData({ ...formData, voiceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 21m00Tcm4TlvDq8ikWAM"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Brief description of the voice..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Voice
          </button>
        </form>
      )}

      {editingVoice && (
        <form onSubmit={handleEditSubmit} className="p-6 border-b bg-yellow-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-yellow-900">
              Editing: {editingVoice.name}
            </h4>
            <button
              type="button"
              onClick={() => setEditingVoice(null)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                11labs Voice ID
              </label>
              <input
                type="text"
                required
                value={editFormData.voiceId}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, voiceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Save Changes
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {voices.map((voice) => (
              <tr key={voice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {voice.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {voice.voiceId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voice.description || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      voice.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {voice.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => startEditing(voice)}
                    className="text-yellow-600 hover:text-yellow-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(voice.id, voice.isActive)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    {voice.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(voice.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
