Systematically audit and improve this project's UI/UX.
- Apply the Generator-Evaluator pattern. Separate implementation and evaluation into independent agents, and iterate through a feedback loop until the quality threshold is met.
- Use Subagents as needed to separate roles and parallelize execution, improving both quality and efficiency.

## Pre-flight Checklist (Required)
Verify all of the following and record the results. If any item fails, resolve it before proceeding.
- [ ] Dev server is running
- [ ] Existing test baseline recorded (run `npm test` → save the list of existing failures)
- [ ] Git working tree status (if there are pre-existing changes, distinguish them from this task's scope)
- [ ] Chrome DevTools MCP connection verified (page is reachable)

---

## Workflow

### Phase 1: Discovery (once)
Assess the current UI/UX state.
- Visually inspect every actual screen (using Chrome DevTools MCP)
- Check desktop first, and consider mobile if possible. At minimum, measure desktop screens directly
- **Interaction testing is required**: don't just check the initial entry state — actually perform the core scenarios
  - Execute clicks, inputs, and navigation via Chrome DevTools MCP's `click`, `fill`, `navigate_page`
  - Intentionally trigger empty / error / loading states to verify them
  - Perform the full flow of filling out a form → submitting → confirming the result at least once
- Find benchmark targets and explore the actual screens directly to perform gap analysis (using Chrome DevTools MCP)
- Audit code-level UI/UX anti-patterns
- Organize findings per screen: symptom / reproduction path / user impact / evidence
- Read `.claude/ux-audit/rubric.md` and **score the baseline** of the current state against the 4 criteria (record the pre-improvement scores)

### Phase 2: Proposal + Prioritization (once)
Derive and evaluate improvements.
- Derive concrete improvements (including AS-IS / TO-BE)
- Cross-evaluate from both the UX perspective and the implementation perspective
- Prioritize and group (by bundle)
- Clearly distinguish what will be implemented from what is excluded

### Phase 3: Sprint Contract (once per bundle)
Before starting implementation, agree on a "definition of done" between the Generator and the Evaluator.

**Written by the Generator**:
- The list of items to implement in this bundle
- The original AS-IS / TO-BE for each item (no abbreviation — prevents hallucination)
- The list of files to be modified

**Criteria the Evaluator will verify**:
- Testable verification conditions per item (e.g., "PageHeader renders on every page")
- The `.claude/ux-audit/rubric.md` criteria this bundle affects and their target scores
- Interaction test scenarios (which actions to perform to verify)

**Contract negotiation (one round trip)**:
1. Generator drafts the Contract
2. Evaluator (an independent agent) reviews verifiability — e.g., "this condition can't be verified in the browser", "this criterion is missing"
3. If there is feedback, the Generator revises once
4. Show the agreed final Contract to the user and get confirmation before entering Phase 4

**File-level Lock**:
- Pre-assign the files each parallel agent will modify on an exclusive basis
- Specify in the Contract that the same file must not be modified by multiple agents

### Phase 4: Generate → Evaluate feedback loop (up to 5 iterations per bundle)

```
┌─────────────────────────────────────────────┐
│  Generate (Generator Agent)                 │
│  - Implement based on the Sprint Contract    │
│  - After completion, run typecheck + tests   │
│  - Capture before/after screenshots          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Evaluate (independent Evaluator Agent)     │
│  - Start in a fresh context (Context Reset)  │
│  - Receives only the Sprint Contract + rubric│
│  - Explore the real app via Chrome DevTools  │
│  - Perform interaction tests (click, fill..) │
│  - Score against the 4 rubric criteria       │
│  - Write concrete feedback for failed items  │
└──────────────────┬──────────────────────────┘
                   ↓
            ┌──────────────┐
            │ Threshold met?│
            ├── Yes ───→ next bundle or done
            └── No ────→ feed only failed items back to Generator
                         → re-run Generate (those items only)
```

**How to run the Evaluator Agent**:
1. Read the `.claude/ux-audit/evaluator-protocol.md` file
2. Spawn an **independent Subagent** via the Agent tool (Context Reset)
3. Include the following in the prompt:
   - The full contents of evaluator-protocol.md
   - This bundle's Sprint Contract
   - The app URL
   - The previous round's scores (from round 2 onward)
4. Do **not** pass the Generator's code, implementation process, or conversation context

**Iteration rules**:
- Up to 5 iterations. If all items pass the threshold, terminate immediately (no need to fill all 5)
- If the threshold is still unmet after 5 rounds, record the remaining issues and report to the user
- Each iteration only re-fixes the **failed items from the previous round** (not a full re-implementation)
- For every iteration, the Evaluator starts in a fresh context

---

## Result Reporting Principles
- Organize results grouped per screen
- Write so that discovery / proposal / contract / implementation / evaluation are connected
- For major changed screens, present before/after screenshots together so they can be compared directly in the result document
- Record the rubric score change: from the Discovery point → to the final Evaluation point
- Separately note what was finished in this session, what remains, and any verification gaps
