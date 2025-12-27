import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateElo } from "@/lib/elo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voice1Id, voice2Id, scriptId, winnerId } = body;

    if (!voice1Id || !voice2Id || !scriptId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create comparison record
    const comparison = await prisma.comparison.create({
      data: {
        voice1Id,
        voice2Id,
        scriptId,
        winnerId: winnerId === "tie" ? null : winnerId || null,
      },
    });

    // Update ELO scores if there's a winner
    if (winnerId && winnerId !== "tie") {
      const elo1 = await prisma.eloScore.findUnique({
        where: { voiceId: voice1Id },
      });
      const elo2 = await prisma.eloScore.findUnique({
        where: { voiceId: voice2Id },
      });

      if (elo1 && elo2) {
        const score1 =
          winnerId === voice1Id ? 1 : winnerId === voice2Id ? 0 : 0.5;
        const { newRating1, newRating2 } = calculateElo(
          elo1.score,
          elo2.score,
          score1
        );

        await prisma.eloScore.update({
          where: { voiceId: voice1Id },
          data: { score: newRating1 },
        });

        await prisma.eloScore.update({
          where: { voiceId: voice2Id },
          data: { score: newRating2 },
        });
      }
    }

    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error("Error creating comparison:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create comparison" },
      { status: 500 }
    );
  }
}
