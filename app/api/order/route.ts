import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return proxyToN8n(request, process.env.N8N_ORDER_WEBHOOK_URL, "N8N_ORDER_WEBHOOK_URL");
}

async function proxyToN8n(request: Request, url: string | undefined, envName: string) {
  if (!url) {
    return NextResponse.json({ ok: false, error: `${envName} is not configured.` }, { status: 500 });
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
