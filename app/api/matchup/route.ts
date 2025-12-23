import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all active voices
    const voices = await prisma.voice.findMany({
      where: { isActive: true },
      include: {
        eloScores: true,
      },
    });

    if (voices.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 active voices" },
        { status: 400 }
      );
    }

    // Get all scripts
    const scripts = await prisma.script.findMany();

    if (scripts.length === 0) {
      return NextResponse.json(
        { error: "No scripts available" },
        { status: 400 }
      );
    }

    // Pick 2 random different voices
    const shuffledVoices = voices.sort(() => Math.random() - 0.5);
    const voice1 = shuffledVoices[0];
    const voice2 = shuffledVoices[1];

    // Pick a random script
    const script = scripts[Math.floor(Math.random() * scripts.length)];

    // Randomly assign left/right to avoid position bias
    const swapped = Math.random() > 0.5;

    return NextResponse.json({
      voiceA: {
        id: swapped ? voice2.id : voice1.id,
        voiceId: swapped ? voice2.voiceId : voice1.voiceId,
        name: swapped ? voice2.name : voice1.name,
        elo: swapped ? voice2.eloScores[0]?.score : voice1.eloScores[0]?.score,
      },
      voiceB: {
        id: swapped ? voice1.id : voice2.id,
        voiceId: swapped ? voice1.voiceId : voice2.voiceId,
        name: swapped ? voice1.name : voice2.name,
        elo: swapped ? voice1.eloScores[0]?.score : voice2.eloScores[0]?.score,
      },
      script: {
        id: script.id,
        title: script.title,
        content: script.content,
        category: script.category,
      },
    });
  } catch (error: any) {
    console.error("Error getting matchup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get matchup" },
      { status: 500 }
    );
  }
}

