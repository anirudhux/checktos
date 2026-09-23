# CheckTOS

Plain-language breakdowns of terms of service, with no judgment of the company. CheckTOS quotes the document and translates it, and you draw your own conclusions. It never calls a company shady or unfair; it states what a clause says, quotes it, and flags its structure.

Live at [checktos.com](https://checktos.com).

## Two ways to use it

The main thing is the downloadable skill. Get it from [checktos.com](https://checktos.com) and drop it into your own Claude, so it runs on your tokens. Point it at any terms of service and it reads the whole binding document set, not just the front page: the privacy policy, the acceptable use policy, the SMS terms, the data processing addendum, and any additional terms, where you find the clauses that cost you most. When more than one agreement governs a product, it breaks down each one; a website Terms of Use and a separate product agreement become two reads behind a switcher. It pulls the contact routes from the documents (privacy, support, legal notice, arbitration opt-out) so you know who to reach; it lists them and will draft a message on request, and it never contacts anyone for you. It returns a ready-to-show plain-Markdown breakdown that an agent can pass straight to its own users, and it writes the extraction and the analysis as downloadable files.

The other way is to read the curated breakdowns on the site: Instinct, Lovable, and Jev today, each one from the same skill.

## What a breakdown contains

A one-line headline and a ranked list of what matters most. A Clarity Meter that reads how hard the document is to get through; it measures the writing and does not judge the company. Four journeys, Product, Usage, Feedback and Improvement, and Legal Ramifications, each a plain summary with verbatim quotes, each with its source and section. A structure summary that counts and names contradictions, undefined terms, one-sided provisions, absolute statements, scope limits, and gaps; it quotes and locates every item, and none of it totals into a score. A "how to reach them" section with the contact routes the documents give. Caveats that name every source and date and say plainly what the analysis is not.

## The principles it holds to

It stays faithful: every quote is word-for-word from its source. It passes no judgment: it states the clause, quotes it, and flags its structure, and it never reaches a moral verdict on the company. It takes no action: it surfaces contacts and will draft a message, and sending it is your own action, because CheckTOS does not email, message, or file anything on anyone's behalf. It aims for full scope: it goes partial only when a binding document is genuinely gated or unpublished, and then it says so, and it never fabricates.

## How the repo is laid out

`index.html`, `instinct.html`, `lovable.html`, and `jev.html` are the static site, with no build step. `checktos-skill/` holds the skill source: `SKILL.md` for the pipeline, `output-schema.md` for the manifest contract, and `guidelines/` for the extraction and analysis rules; it bundles to `downloads/checktos-skill.zip` at deploy time. `downloads/` holds the served skill zip and the per-product extraction and analysis files. `case-study-mockups/` holds the device mockups on the breakdown pages. `deploy.sh` rebuilds the zip and the per-product downloads, then ships to Vercel.

## How to deploy

The site is static HTML on Vercel. `./deploy.sh` rebuilds `downloads/` and runs `vercel deploy --prod`.

---

Built by [@anirudhux](https://x.com/anirudhux).
