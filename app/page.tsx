"use client";

import { FormEvent, useEffect, useState } from "react";

type Result = {
  market: string;
  headline: string;
  pitch: string;
  channels: string[];
  reason: string;
  confidence: number;
  live: boolean;
  missionId?: string;
  execution?: { occurredAt: string; model: string | null; status: string; latencyMs: number; detail: string };
};

const demo: Result = {
  market: "United States · Independent wellness retailers",
  headline: "A calmer ritual, bottled in Seoul.",
  pitch:
    "Small-batch yuja tea concentrate made with whole Korean citrus. Shelf-ready, giftable, and built for the growing alcohol-free ritual category.",
  channels: ["Faire outreach", "LinkedIn buyer list", "Email sequence"],
  reason:
    "High category growth, simple English positioning, and low localization risk make this the fastest market to validate.",
  confidence: 87,
  live: false,
};

export default function Home() {
  const [product, setProduct] = useState("Premium Korean yuja tea concentrate");
  const [goal, setGoal] = useState("Find 10 independent retail buyers");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [approved, setApproved] = useState(false);
  const [actorId, setActorId] = useState("anonymous");
  const [metrics, setMetrics] = useState({ users: 0, analyses: 0, geminiCalls: 0, approvals: 0, feedback: 0, logs: [] as Array<Record<string, string | number | null>> });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let id = window.localStorage.getItem("morrow_actor");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("morrow_actor", id);
    }
    setActorId(id);
    refreshMetrics();
  }, []);

  async function refreshMetrics() {
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (response.ok) setMetrics(await response.json());
    } catch { /* database is attached after deployment */ }
  }

  async function runAgent(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setApproved(false);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, goal, actorId }),
      });
      setResult(await response.json());
      refreshMetrics();
    } catch {
      setResult(demo);
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!result?.missionId) return;
    const response = await fetch("/api/approve", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ missionId: result.missionId, actorId }),
    });
    if (response.ok) {
      setApproved(true);
      refreshMetrics();
    }
  }

  async function sendFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/feedback", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actorId, name: data.get("name"), email: data.get("email"),
        company: data.get("company"), note: data.get("note"), pilot: data.get("pilot") === "on",
      }),
    });
    if (response.ok) { setSent(true); refreshMetrics(); }
  }

  return (
    <main>
      <nav>
        <a className="brand" href="#">Morrow<span>AI</span></a>
        <div className="nav-right">
          <span className="status"><i /> {result?.live ? "Gemini live" : "Demo ready"}</span>
          <a href="#workspace">Workspace</a>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">AI export operator for small businesses</div>
        <h1>Turn a local product into a <em>global sales motion.</em></h1>
        <p className="lede">
          Morrow researches markets, localizes your offer, and prepares buyer
          outreach—while you keep final approval.
        </p>
        <div className="hero-proof">
          <div><strong>6 min</strong><span>to market brief</span></div>
          <div><strong>24/7</strong><span>agent operations</span></div>
          <div><strong>100%</strong><span>decisions logged</span></div>
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="panel input-panel">
          <div className="panel-title"><span>01</span> Launch a market mission</div>
          <form onSubmit={runAgent}>
            <label>What are you selling?</label>
            <textarea value={product} onChange={(e) => setProduct(e.target.value)} />
            <label>Mission goal</label>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} />
            <div className="chips">
              <button type="button" onClick={() => setGoal("Find 10 independent retail buyers")}>Retail buyers</button>
              <button type="button" onClick={() => setGoal("Create a localized launch campaign")}>Launch campaign</button>
            </div>
            <button className="primary" disabled={busy || !product.trim()}>
              {busy ? "Agent team is working…" : "Run market mission →"}
            </button>
          </form>
          <p className="privacy">Your data is used only for this mission.</p>
        </div>

        <div className={`panel output-panel ${result ? "has-result" : ""}`}>
          <div className="panel-title"><span>02</span> Agent decision room</div>
          {!result && !busy && (
            <div className="empty">
              <div className="orbit"><b>M</b><i /><i /><i /></div>
              <h2>Ready when you are.</h2>
              <p>Three specialist agents will research, position, and quality-check your launch.</p>
            </div>
          )}
          {busy && (
            <div className="working">
              {["Market scout is comparing demand signals", "Localization lead is shaping the offer", "Risk reviewer is checking claims"].map((text, i) => (
                <div key={text} style={{ animationDelay: `${i * 220}ms` }}><i />{text}</div>
              ))}
            </div>
          )}
          {result && !busy && (
            <div className="result">
              <div className="result-top">
                <span className="recommend">RECOMMENDED MARKET</span>
                <span className="confidence">{result.confidence}% confidence</span>
              </div>
              <h2>{result.market}</h2>
              <div className="reason">{result.reason}</div>
              <div className="asset">
                <small>LOCALIZED BUYER PITCH</small>
                <h3>{result.headline}</h3>
                <p>{result.pitch}</p>
              </div>
              <div className="channels">
                {result.channels.map((channel) => <span key={channel}>{channel}</span>)}
              </div>
              <div className="actions">
                <button className="primary" onClick={approve}>
                  {approved ? "Approved · logged ✓" : "Approve campaign"}
                </button>
                <button className="secondary" onClick={() => setResult(null)}>Revise</button>
              </div>
              <div className="engine">
                <i /> {result.live ? "LIVE GEMINI" : "DEMO FALLBACK"} · {result.execution?.model ?? "no model"} · {result.execution?.latencyMs ?? 0}ms · {result.execution?.status ?? "demo"}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="admin">
        <div className="section-head">
          <div><small>OPERATIONS EVIDENCE</small><h2>Live control room</h2></div>
          <button className="secondary" onClick={refreshMetrics}>Refresh data</button>
        </div>
        <div className="metrics">
          <div><strong>{metrics.users}</strong><span>Users</span></div>
          <div><strong>{metrics.analyses}</strong><span>Analyses</span></div>
          <div><strong>{metrics.geminiCalls}</strong><span>Gemini calls</span></div>
          <div><strong>{metrics.approvals}</strong><span>Human approvals</span></div>
        </div>
        <div className="log-table">
          <div className="log-row log-head"><span>Time</span><span>Actor</span><span>Stage</span><span>Model / status</span></div>
          {metrics.logs.length === 0 && <p className="no-logs">Run a mission to create the first production audit event.</p>}
          {metrics.logs.map((log, index) => (
            <div className="log-row" key={index}>
              <span>{String(log.occurred_at ?? "").slice(11, 19)}</span>
              <span className={log.actor_type === "human" ? "human-tag" : "ai-tag"}>{log.actor_type === "human" ? "HUMAN" : "AI AUTO"}</span>
              <span>{String(log.stage ?? "").replace("_", " ")}</span>
              <span>{String(log.model ?? "—")} · {String(log.status ?? "")} · {Number(log.latency_ms ?? 0)}ms</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pilot">
        <div>
          <small>FOUNDING CUSTOMER PROGRAM</small>
          <h2>Bring one product.<br />Leave with a market test.</h2>
          <p>We are accepting five paid pilots for Korean small businesses preparing their first international buyer campaign.</p>
        </div>
        {sent ? <div className="thanks"><b>Application received.</b><p>We’ll reply with pilot fit and next steps.</p></div> : (
          <form onSubmit={sendFeedback}>
            <div className="form-grid">
              <input name="name" required placeholder="Your name" />
              <input name="email" required type="email" placeholder="Work email" />
            </div>
            <input name="company" placeholder="Company / product" />
            <textarea name="note" placeholder="What market are you trying to enter?" />
            <label className="check"><input name="pilot" type="checkbox" /> I’m interested in a paid pilot.</label>
            <button className="primary">Request pilot review →</button>
          </form>
        )}
      </section>

      <section className="timeline">
        <div>
          <span>09:42:01</span><b>Market Scout</b><p>Ranked 14 markets against demand, margin, and localization effort.</p>
        </div>
        <div>
          <span>09:42:18</span><b>Localization Lead</b><p>Created buyer-safe positioning with traceable product claims.</p>
        </div>
        <div>
          <span>09:42:31</span><b>Risk Reviewer</b><p>Passed policy and claim review. Human approval required before outreach.</p>
        </div>
      </section>

      <footer>
        <a className="brand" href="#">Morrow<span>AI</span></a>
        <p>Built with Gemini · Every agent decision stays explainable.</p>
      </footer>
    </main>
  );
}
