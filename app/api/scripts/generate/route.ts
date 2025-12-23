import { NextRequest, NextResponse } from "next/server";
import { generateScript, type ScriptCategory } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, topic, saveToDb } = body;

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }

    const validCategories: ScriptCategory[] = [
      "greeting",
      "troubleshooting",
      "billing",
      "empathy",
      "hold_transfer",
      "closing",
      "confirmation",
      "escalation",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const generated = await generateScript(category, topic);

    // Optionally save to database
    if (saveToDb) {
      const script = await prisma.script.create({
        data: {
          title: generated.title,
          content: generated.content,
          category,
        },
      });
      return NextResponse.json(script);
    }

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate script" },
      { status: 500 }
    );
  }
}
