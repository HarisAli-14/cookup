"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type StatusResponse = {
  ok: boolean;
  status?: string;
  order_id?: string;
  proposal_id?: string | number;
  proposal_summary?: string;
  delivery_time?: string;
  chef_name?: string;
  error?: string;
};

export default function OrderReceivedPage() {
  return (
    <Suspense fallback={<OrderReceivedFallback />}>
      <OrderReceivedContent />
    </Suspense>
  );
}

function OrderReceivedFallback() {
  return (
    <main className="shell">
      <section className="card center-card">
        <div className="spinner" aria-label="Loading" />
      </section>
    </main>
  );
}

function OrderReceivedContent() {
  const search = useSearchParams();
  const proposalId = search.get("proposalId") || "";
  const orderId = search.get("orderId") || "";
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!proposalId) {
      setError("Missing proposal id.");
      return;
    }

    const storedOrder = window.sessionStorage.getItem(`cookup-order-${proposalId}`);
    if (storedOrder) {
      try {
        setStatus(JSON.parse(storedOrder) as StatusResponse);
      } catch {
        window.sessionStorage.removeItem(`cookup-order-${proposalId}`);
      }
    }

    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch(`/api/status?proposalId=${encodeURIComponent(proposalId)}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as StatusResponse;
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Status is not available yet.");
        }
        if (!cancelled) {
          setStatus((current) => ({ ...current, ...data }));
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Status is not available yet.");
        }
      }
    }

    loadStatus();
    const timer = window.setInterval(loadStatus, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [proposalId]);

  const approved = status?.status === "chef_approved";
  const rejected = status?.status === "rejected";
  const waitingForChef = !approved && !rejected;
  const displayOrderId = status?.order_id || orderId || proposalId;

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          CookUp
        </Link>
        <span className="pill">Order {displayOrderId}</span>
      </nav>

      <section className="card center-card">
        <p className="kicker">Order received</p>
        <h2>{approved ? "Your chef approved the proposal." : rejected ? "The chef rejected this proposal." : "Your order details are ready."}</h2>
        <p className="muted">
          {approved
            ? "Review the meal proposal and confirm if you want CookUp to create the final order."
            : rejected
              ? "This proposal cannot be fulfilled. Please submit a new request with different requirements."
              : "We received your request and created the proposal below. Keep this page open; it will update when the chef responds."}
        </p>

        {waitingForChef ? <div className="spinner" aria-label="Waiting for chef review" /> : null}
        {error ? <div className="error">{error}</div> : null}

        {status ? (
          <div className="summary">
            <div className="summary-row">
              <strong>Order ID</strong>
              <span>{displayOrderId}</span>
            </div>
            <div className="summary-row">
              <strong>Proposal ID</strong>
              <span>{status.proposal_id || proposalId}</span>
            </div>
            <div className="summary-row">
              <strong>Status</strong>
              <span>{status.status || "pending"}</span>
            </div>
            {status.proposal_summary ? (
              <div className="summary-row">
                <strong>Meal</strong>
                <span>{status.proposal_summary}</span>
              </div>
            ) : null}
            {status.delivery_time ? (
              <div className="summary-row">
                <strong>Delivery</strong>
                <span>{status.delivery_time}</span>
              </div>
            ) : null}
            {status.chef_name ? (
              <div className="summary-row">
                <strong>Chef</strong>
                <span>{status.chef_name}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="actions">
          {approved ? <Link className="button" href={`/order/confirm?proposalId=${encodeURIComponent(proposalId)}`}>Review and confirm</Link> : null}
          {rejected ? <Link className="button" href="/">Create a new request</Link> : null}
        </div>
      </section>
    </main>
  );
}
