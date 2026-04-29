import Link from "next/link";

export default function CancelledPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">C</span>
          CookUp
        </Link>
      </nav>
      <section className="card center-card">
        <p className="kicker">Order cancelled</p>
        <h2>No final order was created.</h2>
        <p className="muted">Your proposal was cancelled. You can submit a new request whenever you are ready.</p>
        <div className="actions">
          <Link className="button" href="/">Start again</Link>
        </div>
      </section>
    </main>
  );
}
