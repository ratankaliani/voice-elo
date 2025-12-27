import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const voice = await prisma.voice.findUnique({
      where: { id: params.id },
      include: {
        eloScores: true,
      },
    });

    if (!voice) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    return NextResponse.json(voice);
  } catch (error: any) {
    console.error("Error fetching voice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch voice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, voiceId, description, isActive } = body;

    // Build update data dynamically
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (voiceId !== undefined) updateData.voiceId = voiceId;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const voice = await prisma.voice.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(voice);
  } catch (error: any) {
    console.error("Error updating voice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update voice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete related records first
    await prisma.comparison.deleteMany({
      where: {
        OR: [{ voice1Id: params.id }, { voice2Id: params.id }],
      },
    });

    await prisma.eloScore.deleteMany({
      where: { voiceId: params.id },
    });

    await prisma.voice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting voice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete voice" },
      { status: 500 }
    );
  }
}
