import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ScriptCategory = 
  | "greeting"
  | "troubleshooting"
  | "billing"
  | "empathy"
  | "hold_transfer"
  | "closing"
  | "confirmation"
  | "escalation";

const categoryPrompts: Record<ScriptCategory, { description: string; length: string }> = {
  greeting: {
    description: "a warm, professional greeting from a customer support rep at the start of a call. Should introduce themselves and offer to help",
    length: "1-2 sentences only",
  },
  troubleshooting: {
    description: "a support rep helping walk a customer through a fix or solution to their problem. Should be clear and reassuring",
    length: "1-2 sentences only",
  },
  billing: {
    description: "a support rep helping with a billing question, payment issue, or subscription inquiry. Should be clear about money matters",
    length: "1-2 sentences only",
  },
  empathy: {
    description: "a support rep expressing understanding and empathy when a customer is frustrated or had a bad experience. Should acknowledge their feelings and apologize sincerely",
    length: "1-2 sentences only",
  },
  hold_transfer: {
    description: "a support rep asking the customer to hold or letting them know they'll be transferred to another department. Should be polite and set expectations",
    length: "1-2 sentences only",
  },
  closing: {
    description: "a support rep wrapping up a call, confirming the issue is resolved, and asking if there's anything else they can help with",
    length: "1-2 sentences only",
  },
  confirmation: {
    description: "a support rep confirming details back to the customer - like an order, address, or action they're about to take. Should be clear and precise",
    length: "1-2 sentences only",
  },
  escalation: {
    description: "a support rep explaining they need to escalate the issue to a specialist or manager. Should reassure the customer they're in good hands",
    length: "1-2 sentences only",
  },
};

export async function generateScript(
  category: ScriptCategory,
  topic?: string
): Promise<{ title: string; content: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const topicContext = topic ? ` about "${topic}"` : "";
  const categoryInfo = categoryPrompts[category];
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a script writer creating test scripts for evaluating text-to-speech voices. 
Generate scripts that are natural and suitable for voice synthesis testing.
Follow the specified length requirement exactly.`,
      },
      {
        role: "user",
        content: `Generate ${categoryInfo.description}${topicContext}.

Length requirement: ${categoryInfo.length}

Return the response in this exact JSON format:
{
  "title": "A short descriptive title for this script",
  "content": "The actual script content to be spoken"
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  if (!response) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(response);
}
