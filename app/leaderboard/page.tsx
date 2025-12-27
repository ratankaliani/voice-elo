import { prisma } from "@/lib/prisma";
import { VoiceRow } from "./VoiceRow";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const eloScores = await prisma.eloScore.findMany({
    include: {
      voice: true,
    },
    orderBy: {
      score: "desc",
    },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">
          Voice rankings based on head-to-head battles
          <span style={{ display: "block", fontSize: "0.75rem", marginTop: "4px", opacity: 0.7 }}>
            Click a voice to hear a sample
          </span>
        </p>
      </div>

      <style>{`
        .voice-row {
          transition: background 0.2s ease;
        }
        .voice-row:hover {
          background: var(--bg-tertiary) !important;
        }
        .voice-row.playing {
          background: color-mix(in srgb, var(--accent) 10%, transparent) !important;
        }
        .voice-row.loading {
          opacity: 0.7;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>

      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Voice</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>ELO</th>
          </tr>
        </thead>
        <tbody>
          {eloScores.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 20px" }}>
                No battles yet. Start comparing voices to see rankings!
              </td>
            </tr>
          ) : (
            eloScores.map((score, index) => (
              <VoiceRow
                key={score.id}
                rank={index + 1}
                voiceId={score.voice.voiceId}
                name={score.voice.name}
                isActive={score.voice.isActive}
                score={score.score}
                provider={score.voice.provider}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
