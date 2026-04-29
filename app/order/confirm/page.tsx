"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Proposal = {
  ok: boolean;
  status?: string;
  proposal_id?: string | number;
  proposal_summary?: string;
  delivery_time?: string;
  chef_name?: string;
  error?: string;
};

export default function ConfirmOrderPage() {
  return (
    <Suspense fallback={<ConfirmOrderFallback />}>
      <ConfirmOrderContent />
    </Suspense>
  );
}

function ConfirmOrderFallback() {
  return (
    <main className="shell">
      <section className="card center-card">
        <div className="spinner" aria-label="Loading" />
      </section>
    </main>
  );
}

function ConfirmOrderContent() {
  const router = useRouter();
  const search = useSearchParams();
  const proposalId = search.get("proposalId") || "";
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!proposalId) {
      setError("Missing proposal id.");
      return;
    }

    async function loadProposal() {
      try {
        const response = await fetch(`/api/status?proposalId=${encodeURIComponent(proposalId)}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as Proposal;
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Proposal is not available.");
        }
        setProposal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Proposal is not available.");
      }
    }

    loadProposal();
  }, [proposalId]);

  async function submitDecision(decision: "CONFIRM" | "CANCEL") {
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId, decision })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Decision could not be submitted.");
      }
      router.push(decision === "CONFIRM" ? "/order/confirmed" : "/order/cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          CookUp
        </Link>
        <span className="pill">Customer decision</span>
      </nav>

      <section className="card center-card">
        <p className="kicker">Confirm your meal</p>
        <h2>Approve the chef-backed proposal.</h2>
        <p className="muted">
          Choose confirm to create the official order, notify the chef, append the ops sheet, and email the founder from n8n.
        </p>

        {proposal ? (
          <div className="summary">
            <div className="summary-row">
              <strong>Status</strong>
              <span>{proposal.status}</span>
            </div>
            <div className="summary-row">
              <strong>Meal</strong>
              <span>{proposal.proposal_summary || "Not available"}</span>
            </div>
            <div className="summary-row">
              <strong>Delivery</strong>
              <span>{proposal.delivery_time || "Not available"}</span>
            </div>
            <div className="summary-row">
              <strong>Chef</strong>
              <span>{proposal.chef_name || "Not assigned"}</span>
            </div>
          </div>
        ) : (
          <div className="spinner" aria-label="Loading" />
        )}

        {error ? <div className="error">{error}</div> : null}

        <div className="actions">
          <button className="button" disabled={submitting || !proposal} onClick={() => submitDecision("CONFIRM")} type="button">
            Confirm Order
          </button>
          <button className="button ghost" disabled={submitting || !proposal} onClick={() => submitDecision("CANCEL")} type="button">
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}
