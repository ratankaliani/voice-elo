import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete related comparisons first
    await prisma.comparison.deleteMany({
      where: { scriptId: params.id },
    });

    await prisma.script.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete script" },
      { status: 500 }
    );
  }
}
