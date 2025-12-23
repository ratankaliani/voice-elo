import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, voiceId, description, isActive } = body;

    const voice = await prisma.voice.create({
      data: {
        name,
        voiceId,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Initialize ELO score for new voice
    await prisma.eloScore.create({
      data: {
        voiceId: voice.id,
        score: 1500.0,
      },
    });

    return NextResponse.json(voice);
  } catch (error: any) {
    console.error("Error creating voice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voice" },
      { status: 500 }
    );
  }
}
