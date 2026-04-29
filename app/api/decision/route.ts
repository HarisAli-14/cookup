import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.N8N_DECISION_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "N8N_DECISION_WEBHOOK_URL is not configured." }, { status: 500 });
  }

  const body = await request.json();

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, error: text || "n8n returned a non-JSON response." };
  }

  return NextResponse.json(data, { status: response.status });
}
