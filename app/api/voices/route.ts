import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const voices = await prisma.voice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        eloScores: true,
      },
    });

    return NextResponse.json(voices);
  } catch (error: any) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch voices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, voiceId, description, isActive, provider } = body;

    if (!name || !voiceId) {
      return NextResponse.json(
        { error: "name and voiceId are required" },
        { status: 400 }
      );
    }

    const voice = await prisma.voice.create({
      data: {
        name,
        voiceId,
        provider: provider || "elevenlabs",
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

    // Check for unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A voice with this ID and provider already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create voice" },
      { status: 500 }
    );
  }
}
