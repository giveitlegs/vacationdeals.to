"use client";

import { useState } from "react";

type Stage = "intake" | "notice" | "settled";

function calculateDebt(salary: number, daysExpired: number): number {
  // Vacation Debt Formula (tongue-in-cheek):
  //   dailyRate = salary / 260 working days
  //   emotionalInterest = 25% accrued per year expired (compounded)
  //   Vacation Debt = dailyRate × daysExpired × (1 + 0.25 × yearsSince)
  //
  // We assume the daysExpired accumulated over the past 2 years for a
  // satisfyingly-high debt total.
  const dailyRate = salary / 260;
  const emotionalInterest = 1 + 0.25 * 2;
  return Math.round(dailyRate * daysExpired * emotionalInterest);
}

export function PTODebtClient() {
  const [stage, setStage] = useState<Stage>("intake");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [daysExpired, setDaysExpired] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [debt, setDebt] = useState(0);

  const canCalculate = salary && daysExpired && +salary > 0 && +daysExpired > 0;

  const calculate = () => {
    if (!canCalculate) return;
    setDebt(calculateDebt(+salary, +daysExpired));
    setStage("notice");
  };

  const settle = async () => {
    if (!name || !email || !consent) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "pto_debt_collections",
          tcpaConsent: true,
          termsConsent: true,
          consentText: "I agree to the Terms and consent to promotional emails from VacationDeals.to.",
          metadata: {
            name,
            jobTitle,
            salary: +salary,
            daysExpired: +daysExpired,
            calculatedDebt: debt,
          },
        }),
      });
      setStage("settled");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "intake") {
    return (
      <>
        <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-50 p-6 shadow-md">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">Notice of Outstanding Obligation</p>
          <h1 className="mt-2 text-3xl font-black text-red-700 sm:text-4xl">
            Overdue PTO Collections Agency
          </h1>
          <p className="mt-3 text-sm text-red-900">
            This office has been retained to determine your outstanding Vacation Debt. Please complete the intake
            form below to calculate what you owe yourself.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Intake Form — Case #{Math.floor(Math.random() * 900000 + 100000)}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-semibold text-gray-700">Job Title</span>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Product Manager"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-gray-700">Annual Salary (USD)</span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g., 95000"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="block font-semibold text-gray-700">
                PTO Days Let Expire (last 2 years)
              </span>
              <input
                type="number"
                value={daysExpired}
                onChange={(e) => setDaysExpired(e.target.value)}
                placeholder="e.g., 7"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Include only unused days that expired. &quot;Rolled over&quot; days don&apos;t count.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={calculate}
            disabled={!canCalculate}
            className="mt-5 w-full rounded-lg bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Calculate My Vacation Debt →
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">No judgment. This calculation is for your use.</p>
        </div>
      </>
    );
  }

  if (stage === "notice") {
    const caseNum = Math.floor(Math.random() * 900000 + 100000);
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    return (
      <>
        {/* Served Notice — designed to look like a legal document */}
        <div className="mx-auto max-w-2xl rounded-lg border-4 border-red-800 bg-amber-50 p-8 shadow-2xl" style={{ fontFamily: "'Times New Roman', serif" }}>
          <div className="mb-6 text-center">
            <div className="inline-block rotate-[-8deg] rounded border-4 border-red-800 px-6 py-2">
              <p className="text-2xl font-black uppercase tracking-widest text-red-800">Served</p>
            </div>
          </div>

          <p className="text-center text-xs uppercase tracking-widest text-gray-600">Overdue PTO Collections Agency</p>
          <p className="text-center text-xs text-gray-500">Case #{caseNum} · Dated {today}</p>

          <hr className="my-5 border-t-2 border-red-800" />

          <p className="text-sm">
            To: <strong className="uppercase">{name || "_____________________"}</strong>
          </p>
          <p className="mt-1 text-sm">
            Re: Unclaimed Paid Time Off — <strong>{daysExpired} days</strong>
          </p>

          <p className="mt-5 text-sm leading-relaxed">
            You are hereby notified that an outstanding Vacation Debt exists in the amount of:
          </p>

          <p className="my-6 text-center text-5xl font-black text-red-800">${debt.toLocaleString()}</p>

          <p className="text-sm leading-relaxed">
            This debt accrued as a direct result of your willful forfeiture of {daysExpired} days of paid time off over
            the past 24 months. Interest continues to accrue at the statutory rate of <strong>25% per annum</strong>,
            measured in regret, burnout, and lost family memories.
          </p>

          <p className="mt-4 text-sm leading-relaxed">
            The undersigned demands immediate settlement. Settlement options:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1 text-sm">
            <li>Payment in vacation days (not legally enforceable).</li>
            <li>
              <strong>Monthly Grand Prize Drawing</strong>: full debt forgiveness via one (1) real vacation package
              to Orlando, Vegas, Gatlinburg, or Cancun.
            </li>
          </ul>

          <p className="mt-4 text-xs italic text-gray-600">
            This is a satirical notice from VacationDeals.to. No legal action is threatened or implied. Participation
            is voluntary. The &quot;debt&quot; is emotional, not financial.
          </p>

          <hr className="my-5 border-t-2 border-red-800" />

          <p className="text-xs text-gray-700">
            By the authority vested in workplace burnout,
            <br />
            <strong>The VacationDeals.to Editorial Board</strong>
          </p>
        </div>

        {/* Settlement CTA */}
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-lg">
          <h3 className="mb-3 text-xl font-bold text-gray-900">File a Payment Plan</h3>
          <p className="mb-4 text-sm text-gray-600">
            Enter the monthly vacation-debt-forgiveness drawing. Winners get a real vacpack to their destination of
            choice. Runner-ups get a 10% discount code.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-medium text-gray-700">Your Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="block font-medium text-gray-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener" className="text-blue-600 underline">Terms</a>{" "}
              &amp; <a href="/privacy" target="_blank" rel="noopener" className="text-blue-600 underline">Privacy Policy</a>,
              and consent to receive promotional emails. Unsubscribe anytime.
            </span>
          </label>

          <button
            type="button"
            onClick={settle}
            disabled={!name || !email || !consent || submitting}
            className="mt-4 w-full rounded-lg bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processing..." : "File My Payment Plan"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Or forward this notice to the boss who made you skip vacation last year.
          </p>
        </div>
      </>
    );
  }

  // Settled
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-center text-white shadow-2xl">
      <p className="text-6xl">📫</p>
      <h2 className="mt-3 text-3xl font-black">Filed. Notice served.</h2>
      <p className="mx-auto mt-4 max-w-md">
        We&apos;ve entered your case in the monthly vacation-debt-forgiveness drawing. Winners are notified on the 1st.
        Meanwhile, check your inbox for your 10% consolation discount code.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=I%20just%20got%20served%20a%20%24${debt.toLocaleString()}%20Vacation%20Debt%20notice%20from%20the%20Overdue%20PTO%20Collections%20Agency%20%F0%9F%AB%A0&url=https%3A%2F%2Fvacationdeals.to%2Fvacation-carnival%2Fpto-debt`}
          target="_blank"
          rel="noopener"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-gray-100"
        >
          Post &quot;I&apos;ve been served&quot; 📤
        </a>
        <a
          href="/deals"
          className="rounded-lg border-2 border-white px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Browse real deals →
        </a>
      </div>
    </div>
  );
}
