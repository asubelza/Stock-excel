# Skill Registry — stock-excel

**Generated**: 2026-09-26  
**Project**: stock-excel  
**Registry Path**: `.atl/skill-registry.md`

---

## Registry Contract

This registry is an **index**, not a summary. `SKILL.md` remains the source of truth.  
Subagents receive exact paths and read the full skill source.

- **Scan Order**: User-level skills → Project-level skills
- **Deduplication**: By skill name, preferring project-level over user-level
- **Skipped**: `sdd-*`, `_shared`, `skill-registry` (handled separately)

---

## User-Level Skills (Indexed)

| Skill | Trigger / Description | Scope | SKILL.md Path |
|-------|----------------------|-------|---------------|
| branch-pr | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review. | user | `C:\Users\asubelza\.config\opencode\skills\branch-pr\SKILL.md` |
| chained-pr | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus. | user | `C:\Users\asubelza\.config\opencode\skills\chained-pr\SKILL.md` |
| cognitive-doc-design | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs. | user | `C:\Users\asubelza\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| comment-writer | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments. | user | `C:\Users\asubelza\.config\opencode\skills\comment-writer\SKILL.md` |
| go-testing | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns. | user | `C:\Users\asubelza\.config\opencode\skills\go-testing\SKILL.md` |
| issue-creation | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests. | user | `C:\Users\asubelza\.config\opencode\skills\issue-creation\SKILL.md` |
| judgment-day | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge. | user | `C:\Users\asubelza\.config\opencode\skills\judgment-day\SKILL.md` |
| skill-creator | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter. | user | `C:\Users\asubelza\.config\opencode\skills\skill-creator\SKILL.md` |
| skill-improver | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills. | user | `C:\Users\asubelza\.config\opencode\skills\skill-improver\SKILL.md` |

---

## Project-Level Skills

*None found in project directories.*

---

## Convention Files

*None found (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`).*

---

## SDD Skills (Referenced Separately)

The following SDD skills are available in the user skill directory but are managed by the SDD orchestrator, not indexed here:

- sdd-apply
- sdd-archive
- sdd-design
- sdd-explore
- sdd-init
- sdd-onboard
- sdd-propose
- sdd-spec
- sdd-tasks
- sdd-verify
- skill-registry
- _shared (references)