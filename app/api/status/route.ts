import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = process.env.N8N_STATUS_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "N8N_STATUS_WEBHOOK_URL is not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");

  if (!proposalId) {
    return NextResponse.json({ ok: false, error: "Missing proposalId." }, { status: 400 });
  }

  const n8nUrl = new URL(url);
  n8nUrl.searchParams.set("proposal_id", proposalId);

  const response = await fetch(n8nUrl, { cache: "no-store" });
  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, error: text || "n8n returned a non-JSON response." };
  }

  return NextResponse.json(data, { status: response.status });
}
