# CheckTOS

Plain-language, judgment-free breakdowns of terms of service. CheckTOS quotes the document and translates it; you draw your own conclusions. It never calls a company "shady" or "unfair" — it states what a clause says, quotes it, and flags its structure.

Live at **[checktos.com](https://checktos.com)**.

## Two ways to use it

**Download the skill — the main thing.** Get it from [checktos.com](https://checktos.com) and drop it into your own Claude, so it runs on your tokens, not ours. Point it at any terms of service and it:

- reads the **whole binding document set**, not just the front page — the privacy policy, acceptable use policy, SMS terms, data processing addendum, and additional terms, where the clauses that matter most usually live;
- breaks down **each agreement on its own** when a product has more than one (a website Terms of Use and a separate product / master agreement become two reads behind a switcher);
- pulls the **contact routes** from the documents (privacy, support, legal notice, arbitration opt-out) so you know who to reach — it lists them and will draft a message on request, but it never contacts anyone for you;
- returns a ready-to-show **plain-Markdown breakdown** an agent can pass straight to its own users, alongside downloadable extraction and analysis files.

**Read the curated breakdowns.** A small directory on the site (currently Instinct, Lovable, and Jev), each produced by the same skill.

## What a breakdown contains

- A one-line **headline** and a ranked **what matters most**.
- A **Clarity Meter** — a factual readability read of the document, not a verdict on the company.
- Four **journeys**: Product, Usage, Feedback & Improvement, Legal Ramifications — a plain summary each, with verbatim quotes carrying their source and section.
- A **structure summary**: contradictions, undefined terms, one-sided provisions, absolute statements, scope limits, and gaps — evidence, quoted and located, never totalled into a score.
- **How to reach them** — contact routes taken from the documents, routed by purpose.
- **Caveats** — every source and date, and a plain statement of what the analysis is not.

## Principles

- **Faithful.** Every quote is word-for-word from its source.
- **No judgment.** State the clause, quote it, flag its structure. Never a moral verdict on the company.
- **No action.** The breakdown surfaces contacts and can draft a message; sending it stays the user's own action. CheckTOS does not email, message, or file anything on anyone's behalf.
- **Full scope by default.** Partial only when a binding document is genuinely gated or unpublished, and then it says so; it never fabricates.

## Repo layout

- `index.html`, `instinct.html`, `lovable.html`, `jev.html` — the static site. No build step.
- `checktos-skill/` — the skill source: `SKILL.md` (the pipeline), `output-schema.md` (the manifest contract), and `guidelines/` (the extraction and analysis rules). Bundled to `downloads/checktos-skill.zip` at deploy time.
- `downloads/` — the served skill zip and the per-product extraction and analysis files.
- `case-study-mockups/` — device mockups used on the breakdown pages.
- `deploy.sh` — rebuilds the skill zip and per-product downloads, then ships to Vercel.

## Deploy

Static HTML on Vercel. `./deploy.sh` rebuilds `downloads/` and runs `vercel deploy --prod`.

---

Built by [@anirudhux](https://x.com/anirudhux).
