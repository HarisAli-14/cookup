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
        <h2>Your meal is in motion.</h2>
        <p className="muted">The chef and operations team have been notified. CookUp will follow up with updates as the order progresses.</p>
        <div className="actions">
          <Link className="button" href="/">Create another order</Link>
        </div>
      </section>
    </main>
  );
}
