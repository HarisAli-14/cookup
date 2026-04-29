"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type OrderResponse = {
  ok: boolean;
  order_id?: string;
  proposal_id?: string | number;
  proposal_summary?: string;
  delivery_time?: string;
  chef_name?: string;
  error?: string;
};

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as OrderResponse;

      if (!response.ok || !data.ok || !data.proposal_id) {
        throw new Error(data.error || "Order could not be submitted.");
      }

      window.sessionStorage.setItem(`cookup-order-${data.proposal_id}`, JSON.stringify(data));

      const params = new URLSearchParams({
        proposalId: String(data.proposal_id),
        orderId: data.order_id || ""
      });
      router.push(`/order/received?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">C</span>
          CookUp
        </a>
        <span className="pill">Custom meals, chef approved</span>
      </nav>

      <section className="hero">
        <div className="intro">
          <p className="kicker">Private kitchen intake</p>
          <h1>Tell us what dinner needs to do.</h1>
          <p className="lede">
            Share the people count, dietary needs, timing, and delivery address.
            CookUp will generate a proposal and ask the chef to approve it.
          </p>
          <div className="steps">
            <div className="step">
              <span>1</span>
              Submit your meal request.
            </div>
            <div className="step">
              <span>2</span>
              Chef reviews the AI proposal.
            </div>
            <div className="step">
              <span>3</span>
              Confirm or cancel from your own CookUp page.
            </div>
          </div>
        </div>

        <form className="form-card" onSubmit={submitOrder}>
          <div className="grid">
            <div className="field">
              <label htmlFor="customer_name">Your Name</label>
              <input id="customer_name" name="customer_name" required placeholder="Enter your full name" />
            </div>

            <div className="field">
              <label htmlFor="customer_phone">Phone Number</label>
              <input id="customer_phone" name="customer_phone" required placeholder="+923001234567" />
            </div>

            <div className="field full">
              <label htmlFor="customer_email">Email Address</label>
              <input id="customer_email" name="customer_email" type="email" placeholder="you@example.com" />
            </div>

            <div className="field full">
              <label htmlFor="message">What would you like to eat?</label>
              <textarea
                id="message"
                name="message"
                required
                placeholder="Example: I need dinner for 4 people, no beef, one person is gluten-free."
              />
            </div>

            <div className="field full">
              <label htmlFor="delivery_address">Delivery Address</label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                required
                placeholder="Enter your full delivery address."
              />
            </div>
          </div>

          <div className="actions">
            <button className="button" disabled={submitting} type="submit">
              {submitting ? "Creating proposal..." : "Submit Order"}
            </button>
          </div>

          {error ? <div className="error">{error}</div> : null}
        </form>
      </section>
    </main>
  );
}
