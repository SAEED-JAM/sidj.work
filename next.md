# Ask-back review: a speculative prototype by Sid Jameson

> A speculative prototype by Sid Jameson: when a coding agent finishes a pull request, it asks the reviewer two or three questions instead of writing a report, and the merge waits for the answers.

Page: https://sidj.work/next/
Author: Sid Jameson (https://sidj.work/)

[Sid Jameson](https://sidj.work/)

Speculative prototype · November 2026

# Ask-back review

**Agent output should arrive as questions, not reports.** A finished task is mostly settled work plus a few guesses, and a long summary hides the guesses in the middle. Questions put them first: the two or three choices only a person can make, each tied to the code it touches. Answering them is the review. The answers become a record of why the code is the way it is, and the merge waits for them.

Prompted by Maggie Appleton’s talk “Fortune Telling and Speculative Design” at Design Engineering Night 10, Granola.

## Where the theory comes from

At Huma, the [Design Desk](https://sidj.work/ai-design-workflow/) I built already works this way for design. Agents read the requirements, draw from the design system and check the work. When something isn’t decided, they bring a researched question with options and a recommendation, not a report. Two designers and one product owner, Q3 and Q4 2026.

- **7 in 10:** open questions settled before they reached the product owner
- **5.5 h:** median from a story’s record to the designer’s sign-off
- **235:** issues the checker caught before a person reviewed
- **266:** numbered decisions in one quarter that every drawn state had to trace back to

The next step is the same idea for code review, below. Names and anything clinical stay private; the [case study](https://sidj.work/ai-design-workflow/) has the rest.

## Prototype: a pull request where the agent asks the reviewer

tidewater / **ledger** Fictional repo

### Retry failed webhook deliveries with backoff #482

Open **relay** wants to merge 4 commits into main from relay/webhook-retries

Everything in the prototype is made up: the repo, the people, the agent. Plain HTML, CSS and JavaScript, no framework, no backend.

[sidj.work](https://sidj.work/)
