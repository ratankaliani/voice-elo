import { prisma } from "@/lib/prisma";
import VoiceManager from "@/components/VoiceManager";
import ScriptManager from "@/components/ScriptManager";

export default async function AdminPage() {
  const voices = await prisma.voice.findMany({
    orderBy: { createdAt: "desc" },
  });

  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage voices and scripts for evaluation.
        </p>
      </div>
      
      <div className="space-y-8">
        <VoiceManager voices={voices} />
        <ScriptManager scripts={scripts} />
      </div>
    </main>
  );
}
