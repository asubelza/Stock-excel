# A11y Baseline Update Process (AG-06)

## Overview

This document describes the process for updating the accessibility baseline (`tests/a11y/__baselines__/a11y-baseline.json`) when intentional changes introduce new violations.

## When to Update Baseline

Update the baseline when:

1. **New feature implementation** introduces known, acceptable violations that will be fixed later
2. **Design system updates** change component markup/structure
3. **Third-party library updates** affect accessibility
4. **Intentional trade-offs** documented with expiration dates
5. **Legacy page migration** completes and new violations are discovered

## Update Process

### 1. Local Development

```bash
# Start Flask app
DESIGN_SYSTEM_ENABLED=true python web_app.py

# Update baseline (run all 6 viewport/browser combos)
UPDATE_BASELINE=true pnpm a11y:baseline

# Or run single configuration
UPDATE_BASELINE=true pnpm exec playwright test tests/a11y/a11y-baseline.spec.ts --project=a11y-chromium-desktop
```

### 2. Review Changes

```bash
# View baseline diff
git diff tests/a11y/__baselines__/a11y-baseline.json

# View summary
cat tests/a11y/__baselines__/a11y-baseline-summary.json | jq .
```

### 3. Document Changes

For each new violation added to baseline, add a **suppression rule** in `tests/config/new-design-pages.json`:

```json
{
  "suppressionRules": [
    {
      "rule": "color-contrast",
      "pages": ["new-page-name"],
      "reason": "New chart component uses brand colors that don't meet 4.5:1 ratio",
      "impact": "serious",
      "expires": "2026-12-31",
      "ticket": "GH-1234"
    }
  ]
}
```

**Required fields:**
- `rule`: axe-core rule ID (e.g., `color-contrast`, `label`, `button-name`)
- `pages`: Array of page names from config, or `["*"]` for all
- `reason`: Technical justification
- `impact`: `critical`, `serious`, `moderate`, or `minor`
- `expires`: ISO date (YYYY-MM-DD) when this suppression must be reviewed
- `ticket`: Optional GitHub issue/PR number tracking the fix

### 4. Commit Together

```bash
git add tests/a11y/__baselines__/a11y-baseline.json
git add tests/a11y/__baselines__/a11y-baseline-summary.json
git add tests/config/new-design-pages.json
git commit -m "chore(a11y): update baseline for [feature]

- Added suppression for color-contrast on charts (expires 2026-12-31)
- Ticket: GH-1234"
```

## Suppression Rule Guidelines

### Acceptable Suppressions

| Impact | Max Duration | Requirements |
|--------|--------------|--------------|
| Critical | 30 days | Must have ticket with fix plan |
| Serious | 60 days | Must have ticket with fix plan |
| Moderate | 90 days | Should have ticket |
| Minor | 180 days | Documented rationale |

### Unacceptable Suppressions

- ❌ No expiration date
- ❌ No reason/ticket
- ❌ Critical violations without immediate fix plan
- ❌ Suppressing to "make CI pass" without remediation plan

## CI Baseline Update (Manual)

### Via Workflow Dispatch

1. Go to Actions → A11y Gate → Run workflow
2. Set `update_baseline: true`
3. Select PR branch
4. Run workflow

### Via PR Comment

Comment on PR:
```
/a11y-update-baseline
```

This triggers the baseline update workflow which:
1. Runs full scan with `UPDATE_BASELINE=true`
2. Commits new baseline to PR branch
3. Comments with summary

## Baseline File Structure

```
tests/a11y/__baselines__/
├── a11y-baseline.json          # Full baseline data
└── a11y-baseline-summary.json  # Aggregated summary
```

### a11y-baseline.json Format

```json
{
  "page-name-browser-viewport": {
    "page": "stock-list",
    "path": "/stock/",
    "browser": "chromium",
    "viewport": "desktop",
    "timestamp": "2026-10-09T10:30:00.000Z",
    "url": "http://localhost:5000/stock/?design=new",
    "violations": {
      "critical": 0,
      "serious": 0,
      "moderate": 2,
      "minor": 5,
      "total": 7,
      "passed": 45,
      "incomplete": 3,
      "inapplicable": 120,
      "details": [
        {
          "id": "color-contrast",
          "impact": "moderate",
          "description": "Elements must have sufficient color contrast ratio",
          "help": "Fix color contrast...",
          "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
          "tags": ["wcag2aa", "wcag143"],
          "nodes": [...]
        }
      ]
    }
  }
}
```

## Review Checklist

Before committing baseline updates:

- [ ] All new violations have suppression rules with expiration dates
- [ ] Suppression rules reference tickets/issues
- [ ] No critical violations without immediate fix (≤30 days)
- [ ] Summary shows expected violation counts
- [ ] HTML reports generated for manual review
- [ ] Config `lastUpdated` timestamp updated
- [ ] Commit message explains the changes

## Automated Expiration Checks

The CI workflow will warn about expired suppressions:

```yaml
# In a11y.yml - add to summary job
- name: Check suppression expiration
  run: |
    python scripts/check_a11y_suppressions.py
```

Create `scripts/check_a11y_suppressions.py`:

```python
#!/usr/bin/env python3
import json
from datetime import datetime

with open('tests/config/new-design-pages.json') as f:
    config = json.load(f)

today = datetime.now().date()
expired = []
expiring_soon = []

for rule in config.get('suppressionRules', []):
    expires = datetime.fromisoformat(rule['expires']).date()
    days_left = (expires - today).days
    
    if days_left < 0:
        expired.append(f"{rule['rule']} on {rule['pages']} (expired {abs(days_left)} days ago)")
    elif days_left <= 14:
        expiring_soon.append(f"{rule['rule']} on {rule['pages']} (expires in {days_left} days)")

if expired:
    print("❌ EXPIRED SUPPRESSIONS:")
    for e in expired:
        print(f"  - {e}")
    exit(1)

if expiring_soon:
    print("⚠️  EXPIRING SOON:")
    for e in expiring_soon:
        print(f"  - {e}")

print("✅ All suppressions valid")
```

## Rollback Procedure

If baseline update introduces issues:

```bash
# Revert baseline files
git checkout HEAD~1 -- tests/a11y/__baselines__/a11y-baseline.json
git checkout HEAD~1 -- tests/a11y/__baselines__/a11y-baseline-summary.json
git checkout HEAD~1 -- tests/config/new-design-pages.json

# Commit rollback
git commit -m "revert(a11y): rollback baseline update due to [reason]"
```

## Best Practices

1. **Update baseline in same PR** as the code changes causing violations
2. **Never suppress critical** without a fix branch already open
3. **Use specific page names** not wildcards when possible
4. **Set realistic expiration dates** (not "end of year" for everything)
5. **Review suppressions quarterly** during sprint planning
6. **Track suppression debt** in project board

## Related Files

| File | Purpose |
|------|---------|
| `tests/a11y/a11y-scan.spec.ts` | CI scan test (fails on critical/serious) |
| `tests/a11y/a11y-baseline.spec.ts` | Baseline generation test |
| `tests/config/new-design-pages.json` | Page list + suppression rules |
| `.github/workflows/a11y.yml` | CI workflow |
| `docs/a11y-baseline-process.md` | This document |