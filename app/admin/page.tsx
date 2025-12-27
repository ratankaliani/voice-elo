import { prisma } from "@/lib/prisma";
import VoiceManager from "@/components/VoiceManager";
import ScriptManager from "@/components/ScriptManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const voices = await prisma.voice.findMany({
    orderBy: { createdAt: "desc" },
  });

  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalComparisons = await prisma.comparison.count();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">
          Manage voices and scripts for evaluation.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Voices</span>
          <span className="stat-value">{voices.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Voices</span>
          <span className="stat-value accent">
            {voices.filter((v) => v.isActive).length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Comparisons</span>
          <span className="stat-value">{totalComparisons}</span>
        </div>
      </div>

      <div className="admin-sections">
        <VoiceManager voices={voices} />
        <ScriptManager scripts={scripts} />
      </div>
    </div>
  );
}
