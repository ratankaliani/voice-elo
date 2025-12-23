"use client";

import { useState } from "react";

interface Script {
  id: string;
  title: string;
  content: string;
  category?: string | null;
}

interface ScriptManagerProps {
  scripts: Script[];
}

const SCRIPT_CATEGORIES = [
  { value: "greeting", label: "Greeting / Opening" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "billing", label: "Billing / Payments" },
  { value: "empathy", label: "Empathy / Apology" },
  { value: "hold_transfer", label: "Hold / Transfer" },
  { value: "closing", label: "Closing / Wrap-up" },
  { value: "confirmation", label: "Confirmation" },
  { value: "escalation", label: "Escalation" },
];

export default function ScriptManager({ scripts: initialScripts }: ScriptManagerProps) {
  const [scripts, setScripts] = useState(initialScripts);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCategory, setGenerateCategory] = useState("greeting");
  const [generateTopic, setGenerateTopic] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  });

  const handleGenerate = async () => {
    setGeneratingScript(true);
    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: generateCategory,
          topic: generateTopic || undefined,
          saveToDb: true,
        }),
      });

      if (response.ok) {
        const newScript = await response.json();
        setScripts([newScript, ...scripts]);
        setGenerateTopic("");
        setIsGenerating(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate script. Check your OpenAI API key.");
      }
    } catch (error) {
      console.error("Error generating script:", error);
      alert("Error generating script");
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newScript = await response.json();
        setScripts([newScript, ...scripts]);
        setFormData({ title: "", content: "", category: "" });
        setIsAdding(false);
      } else {
        alert("Failed to create script");
      }
    } catch (error) {
      console.error("Error creating script:", error);
      alert("Error creating script");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this script?")) return;

    try {
      const response = await fetch(`/api/scripts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setScripts(scripts.filter((s) => s.id !== id));
      } else {
        alert("Failed to delete script");
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      alert("Error deleting script");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Scripts</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsGenerating(!isGenerating);
                setIsAdding(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {isGenerating ? "Cancel" : "Generate with AI"}
            </button>
            <button
              onClick={() => {
                setIsAdding(!isAdding);
                setIsGenerating(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isAdding ? "Cancel" : "Add Manually"}
            </button>
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="p-6 border-b bg-green-50">
          <h4 className="font-medium text-green-900 mb-4">Generate Script with AI</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={generateCategory}
                onChange={(e) => setGenerateCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {SCRIPT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic (optional)
              </label>
              <input
                type="text"
                value={generateTopic}
                onChange={(e) => setGenerateTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., weather forecast, product demo"
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generatingScript}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {generatingScript ? "Generating..." : "Generate Script"}
          </button>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 border-b bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Customer Service Call"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., conversational, narrative"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={6}
                placeholder="Enter the script text here..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Script
          </button>
        </form>
      )}

      <div className="divide-y divide-gray-200">
        {scripts.map((script) => (
          <div key={script.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  {script.title}
                </h4>
                {script.category && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                    {script.category}
                  </span>
                )}
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                  {script.content}
                </p>
              </div>
              <button
                onClick={() => handleDelete(script.id)}
                className="ml-4 text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
