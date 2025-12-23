import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category } = body;

    const script = await prisma.script.create({
      data: {
        title,
        content,
        category: category || null,
      },
    });

    return NextResponse.json(script);
  } catch (error: any) {
    console.error("Error creating script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create script" },
      { status: 500 }
    );
  }
}
