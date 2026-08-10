
"use client";

import { FormEvent, useEffect, useState } from "react";

type PaymentResult = {
  paymentId: string;
  decision: { shouldPay: boolean; confidence: number; reason: string; evidenceSatisfied: boolean };
  gemini: { live: boolean; model: string | null; httpStatus: number };
  policy: { passed: boolean; checks: Record<string, boolean>; maxAutonomousUsdc: number; approvalRule: string };
  payment: { mode: string; httpStatus: number; state: string; transactionId: string | null; transactionHash: string | null };
  status: string;
  latencyMs: number;
};

type Metrics = {
  users: number; analyses: number; geminiCalls: number; approvals: number; payments: number;
  logs: Array<Record<string, string | number | null>>;
};

const steps = [
  ["01", "Gemini decision", "Reads task evidence and decides whether payment is warranted."],
  ["02", "Policy gate", "Checks recipient allowlist, 25 USDC cap, and testnet-only rule."],
  ["03", "Agent execution", "Initiates payment without a human click when every rule passes."],
  ["04", "Audit seal", "Stores the decision, policy result, provider status, and transaction reference."],
];

export default function Home() {
  const [actorId, setActorId] = useState("anonymous");
  const [task, setTask] = useState("Validate and translate 20 qualified US retail buyer leads");
  const [evidence, setEvidence] = useState("Delivered 20 verified leads with source URLs and English buyer notes.");
  const [vendor, setVendor] = useState("verified-localizer");
  const [amount, setAmount] = useState(12);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ users: 0, analyses: 0, geminiCalls: 0, approvals: 0, payments: 0, logs: [] });

  useEffect(() => {
    let stored = window.localStorage.getItem("morrow_actor");
    if (!stored) {
      stored = crypto.randomUUID();
      window.localStorage.setItem("morrow_actor", stored);
    }
    setActorId(stored);
    refreshMetrics();
  }, []);

  async function refreshMetrics() {
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (response.ok) setMetrics(await response.json());
    } catch { /* Production storage may still be connecting. */ }
  }

  async function runPayment(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/payments/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actorId, task, evidence, vendor, amount }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Agent run failed");
      setResult(payload);
      await refreshMetrics();
    } finally {
      setBusy(false);
    }
  }

  function loadBlockedScenario() {
    setTask("Pay rush fee for an unverified lead list");
    setEvidence("Vendor requested payment but supplied no delivery evidence.");
    setVendor("unverified-vendor");
    setAmount(40);
    setResult(null);
  }

  return (
    <main>
      <nav>
        <a className="brand" href="#">Morrow<span>AI</span></a>
        <div className="nav-right"><span className="status live"><i />Agentic payments lab</span><a href="#evidence">Audit evidence</a></div>
      </nav>

      <section className="hero">
        <div className="eyebrow">Circle Agentic Economy Prize · Testnet demo</div>
        <h1>An AI agent that knows <em>when to pay.</em></h1>
        <p className="lede">Gemini evaluates completed work. Deterministic controls enforce the budget. The agent executes a test payment only when every rule passes—then records the entire chain of custody.</p>
        <div className="scope-disclosure">
          <strong>Morrow AI is a technology demonstration of autonomous AI payments using Circle Testnet.</strong>
          <span>This demonstration does not represent a production payment system or real customer transactions.</span>
        </div>
        <div className="hero-proof"><div><strong>25 USDC</strong><span>autonomous cap</span></div><div><strong>0 clicks</strong><span>after agent starts</span></div><div><strong>100%</strong><span>decisions logged</span></div></div>
      </section>

      <section className="flow">
        {steps.map(([number, title, detail]) => <div key={number}><span>{number}</span><b>{title}</b><p>{detail}</p></div>)}
      </section>

      <section className="workspace">
        <div className="panel input-panel">
          <div className="panel-title"><span>RUN</span> Autonomous payment mission</div>
          <form onSubmit={runPayment}>
            <label htmlFor="task">Completed work</label>
            <textarea id="task" value={task} onChange={(event) => setTask(event.target.value)} />
            <label htmlFor="evidence">Delivery evidence</label>
            <textarea id="evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
            <div className="form-grid">
              <div><label htmlFor="vendor">Recipient</label><select id="vendor" value={vendor} onChange={(event) => setVendor(event.target.value)}><option value="verified-localizer">Verified localizer</option><option value="market-research-partner">Market research partner</option><option value="unverified-vendor">Unverified vendor</option></select></div>
              <div><label htmlFor="amount">Amount (test USDC)</label><input id="amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
            </div>
            <button className="primary" disabled={busy}>{busy ? "Agent is reasoning and executing…" : "Start autonomous run →"}</button>
            <button className="secondary" type="button" onClick={loadBlockedScenario}>Load policy-block scenario</button>
          </form>
          <p className="privacy">Test environment only. No real funds, card, or production wallet is used.</p>
        </div>

        <div className={`panel output-panel ${result ? "has-result" : ""}`}>
          <div className="panel-title"><span>TRACE</span> Decision and execution</div>
          {!result && !busy && <div className="empty"><div className="orbit"><b>$</b><i /><i /><i /></div><h2>Waiting for a mission.</h2><p>Start the approved scenario or load the blocked scenario to show fail-closed controls.</p></div>}
          {busy && <div className="working">{["Gemini is evaluating delivery evidence", "Policy engine is checking limits", "Payment agent is preparing execution"].map((text, index) => <div key={text} style={{ animationDelay: `${index * 220}ms` }}><i />{text}</div>)}</div>}
          {result && !busy && (
            <div className="result">
              <div className="result-top"><span className={result.status === "executed" ? "pass-badge" : "block-badge"}>{result.status === "executed" ? "AUTONOMOUSLY EXECUTED" : "SAFELY BLOCKED"}</span><span className="confidence">{result.decision.confidence}% confidence</span></div>
              <h2>{result.decision.shouldPay ? "Payment is warranted." : "Payment is not warranted."}</h2>
              <p className="reason">{result.decision.reason}</p>
              <div className="checklist">{Object.entries(result.policy.checks).map(([check, passed]) => <div key={check} className={passed ? "check-pass" : "check-fail"}><span>{passed ? "✓" : "×"}</span>{check.replaceAll(/([A-Z])/g, " $1")}</div>)}</div>
              <div className="receipt"><small>PAYMENT RECEIPT</small><dl><div><dt>Environment</dt><dd>{result.payment.mode.replaceAll("_", " ")}</dd></div><div><dt>Provider HTTP</dt><dd>{result.payment.httpStatus || "not called"}</dd></div><div><dt>State</dt><dd>{result.payment.state}</dd></div><div><dt>Transaction</dt><dd>{result.payment.transactionId ?? "blocked before execution"}</dd></div></dl></div>
              <div className={`engine ${result.gemini.live ? "live-engine" : "demo-engine"}`}><i />{result.gemini.live ? "LIVE GEMINI" : "DEMO EVALUATOR"} · {result.gemini.model ?? "no model"} · HTTP {result.gemini.httpStatus || "n/a"} · {result.latencyMs}ms</div>
            </div>
          )}
        </div>
      </section>

      <section className="policy">
        <div><small>APPROVAL POLICY v1.0</small><h2>Autonomy inside hard boundaries.</h2><p>The human approves the policy once. The AI agent can then execute individual test payments without further intervention.</p></div>
        <ul><li><b>Evidence</b><span>Gemini must confirm completed delivery.</span></li><li><b>Recipient</b><span>Only pre-approved vendors can receive funds.</span></li><li><b>Limit</b><span>Maximum 25 USDC per autonomous transaction.</span></li><li><b>Network</b><span>Testnet or sandbox execution only.</span></li><li><b>Failure</b><span>Any uncertainty fails closed before payment.</span></li></ul>
      </section>

      <section className="admin" id="evidence">
        <div className="section-head"><div><small>PRODUCTION EVIDENCE</small><h2>Agent operations ledger</h2></div><button className="secondary" onClick={refreshMetrics}>Refresh evidence</button></div>
        <div className="metrics"><div><strong>{metrics.geminiCalls}</strong><span>Gemini decisions</span></div><div><strong>{metrics.payments}</strong><span>Agent payments</span></div><div><strong>{metrics.analyses}</strong><span>Market missions</span></div><div><strong>{metrics.approvals}</strong><span>Human approvals</span></div></div>
        <div className="log-table">
          <div className="log-row log-head"><span>Time</span><span>Authority</span><span>Stage</span><span>Status / evidence</span></div>
          {metrics.logs.length === 0 && <p className="no-logs">Run the agent to create the first audit sequence.</p>}
          {metrics.logs.map((log, index) => <div className="log-row" key={`${log.occurred_at}-${index}`}><span>{String(log.occurred_at ?? "").slice(11, 19)}</span><span className={`actor-tag actor-${String(log.actor_type)}`}>{String(log.actor_type ?? "system").toUpperCase()}</span><span>{String(log.stage ?? "").replaceAll("_", " ")}</span><span>{String(log.status ?? "")} · {String(log.model ?? "policy/system")} · {Number(log.latency_ms ?? 0)}ms</span></div>)}
        </div>
      </section>

      <section className="demo-script">
        <small>3-MINUTE DEMO PATH</small><h2>One approved run. One blocked run. One undeniable audit trail.</h2>
        <ol><li><b>0:00–0:15</b><span>Show the technology-demo and non-production disclosure verbatim.</span></li><li><b>0:15–0:40</b><span>Show the task, delivery evidence, payment cap, and approved recipient.</span></li><li><b>0:40–1:30</b><span>Start the run. Gemini approves the work; policy passes; the agent executes a test payment automatically.</span></li><li><b>1:30–2:10</b><span>Load the 40 USDC unverified-vendor scenario and show it blocked before provider execution.</span></li><li><b>2:10–3:00</b><span>Show the Circle testnet record and the four-part audit trail with timestamps.</span></li></ol>
      </section>

      <footer><a className="brand" href="#">Morrow<span>AI</span></a><p>Built with Gemini · Designed for Circle testnet · Every decision auditable.</p></footer>
    </main>
  );
}
