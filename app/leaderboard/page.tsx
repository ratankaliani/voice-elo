import { prisma } from "@/lib/prisma";

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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Voice rankings based on head-to-head battles</p>
      </div>

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
              <tr key={score.id}>
                <td style={{ fontWeight: 700, fontSize: index < 3 ? "1.25rem" : "0.875rem" }}>
                  {getRankIcon(index + 1)}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{score.voice.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {score.voice.voiceId}
                  </div>
                </td>
                <td>
                  <span className={score.voice.isActive ? "badge badge-success" : "badge"}>
                    {score.voice.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1.125rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {score.score.toFixed(0)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
