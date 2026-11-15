# The Design Desk: a case study by Sid Jameson

> How Sid Jameson built the Design Desk at Huma: AI agents read the requirements, draw from the design system and check the work. People decide and approve.

Page: https://sidj.work/ai-design-workflow/
Author: Sid Jameson (https://sidj.work/)

Huma · UK Primary Care · 2026

# The Design Desk

Two designers, one product owner and about a hundred stories a quarter, for software used inside NHS GP practices. I built a desk of AI agents that reads the requirements, draws from the design system and checks the work. People answer the questions and approve.

- **Role:** AI Design Engineer. I led the design track of version one and designed and built version two end to end.
- **Who uses it:** Two designers draw through it, a product owner approves, engineers build from its handoffs
- **Timeline:** Version one in Q3 2026, inside git. Version two from 6 October 2026, on Claude artifacts.
- **Built with:** Claude Code, Claude artifacts, GitHub, Jira, the NHS design system, a Material 3 kit
- **3 days** The pilot set, from first read to promoted
- **5.5 h** Median from a story’s record to the designer’s sign-off
- **7 in 10** Open questions settled before they reached the product owner
- **235** Issues the checker caught before a person reviewed

Names, links, ticket numbers and anything clinical are removed or changed. The screens are real captures from the canvases, the board and the repo, with demo data.

The challenge

## A hundred stories a quarter, and no room to guess

Huma builds UK Primary Care, software for NHS GP practices: the inbox where patient requests land, triage, messaging and appointments. In Q3 the product team wrote 33 PRDs with 266 numbered decisions and asked for 90 design tasks. Q4 added 18 more PRDs and 98 stories. Two designers drew all of it.

Speed was only half of it. In healthcare, a wireframe that invents behaviour can ship a rule nobody decided. It happened once in Q3: a control that could write to a patient’s consent record made it into a design, and was caught only because a developer asked what to store.

One early brief came back with fourteen invented states where six honest ones were needed. The team’s own write-up put it plainly: the cause wasn’t carelessness, it was the format.

The other half was attention. Every open question either waited for the product owner or got answered quietly in a wireframe, where nobody would notice until it shipped.

### Every state needs a source

A PRD line, a numbered decision or an acceptance criterion. A brief can rule something out. It can’t put something on screen.

### Two design systems

Patient screens on the NHS design system, 390px first, WCAG 2.2 AA. Staff screens on a Material 3 kit at 1440px.

### One person approves

The product owner’s attention is the bottleneck, so a question has to arrive researched, with options and a recommendation.

Private · the full case

## The rest of this case is private

What you’ve read is the outline. The full case is internal work at Huma, so I share it on request: the 75-second film, both versions of the desk, the decisions that changed it, one real story from brief to approval, and the numbers.

What the full case covers:

- The film
- Version one
- What broke
- Decisions
- Version two
- The desk at work
- Impact
- Reflection

No password? [Ask me for access](mailto:msaeedjg@gmail.com?subject=Access%20to%20The%20Design%20Desk%20case%20study)

_Part of this case study is private and is not in this copy. The public part is complete as written; the rest is available from the author on request (msaeedjg@gmail.com)._
