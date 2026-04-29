import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          CookUp
        </Link>
      </nav>
      <section className="card center-card">
        <p className="kicker">Order confirmed</p>
        <h2>Your CookUp order is now official.</h2>
        <p className="muted">The chef and operations workflow have been notified by n8n. You will receive updates from CookUp.</p>
        <div className="actions">
          <Link className="button" href="/">Create another order</Link>
        </div>
      </section>
    </main>
  );
}
