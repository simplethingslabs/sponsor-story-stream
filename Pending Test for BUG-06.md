# Pending Test — BUG-06: Random / Hardcoded Data in ChildProgress

## Summary
`ChildProgress.tsx` used `Math.random()` to generate fake attendance,
participation, and academic percentages per quarter, and had a completely
hardcoded `skillsData` radar chart with identical values for every child.
A fabricated generic bio ("bright and enthusiastic student…") was also
hardcoded for every child regardless of who they are.

**Fix applied — commit `5c01e90`:**
- Removed `generateProgressData()` (random data), `skillsData` (hardcoded),
  and the entire `recharts` import block
- Replaced both chart cards with a **"Latest Report Highlight"** card showing
  real `growth_narrative` and `activities` from the most recent published report
- "Meet the Child" now shows factual enrollment date + published report count
  instead of fabricated bio text

---

## Pre-conditions
1. Latest frontend deployed to Vercel (`git push origin main` → Vercel auto-deploys).
2. Backend running on Render.
3. Seed data:
   - At least **1 sponsor** user with an active sponsorship
   - At least **1 published progress report** for that sponsor's child
   (Without a report, the highlight card won't render — Test B covers this.)

---

## Test A — Child with published reports shows real narrative

**Login as:** sponsor  
**Navigate to:** My Children → click on a child who has at least 1 published report

**Expected ✅**
- "Meet {child.first_name}" card shows:
  - Enrollment date (e.g. "Enrolled January 2023")
  - Report count (e.g. "4 progress reports published")
  - **No** generic bio text ("bright and enthusiastic student…")
  - **No** "Dreams & Goals" section
- "Latest Report Highlight" card is visible and shows:
  - Quarter + year label (e.g. "Q1 2025 — from Aarav's teacher")
  - Real `growth_narrative` text written by the teacher
  - Real `activities` text (if present)
  - "Read Full Report" button → clicking it navigates to the report detail page
- **No** "Progress Over Time" line chart with random percentages
- **No** "Skills Overview" radar chart with hardcoded scores

**Failure ❌**
- Random numbers (e.g. "Attendance: 93%", "Academic: 87%") still visible
- Radar chart still visible with Reading/Writing/Math scores
- Generic bio text still visible for every child
- "Latest Report Highlight" card missing despite published reports existing

---

## Test B — Child with no reports shows placeholder

**Login as:** sponsor  
**Navigate to:** a child who has zero published reports

**Expected ✅**
- "Meet {child.first_name}" card shows enrollment date + "0 progress reports published"
- Italicised placeholder: *"Quarterly progress reports from [name]'s teacher will appear here."*
- "Latest Report Highlight" card is **not shown** (not an empty card — just absent)
- Progress Timeline section shows the "No reports yet" empty state

**Failure ❌**
- Page crashes / blank screen with no reports
- Empty "Latest Report Highlight" card renders with no content

---

## Test C — "Read Full Report" button navigates correctly

**Login as:** sponsor  
**Navigate to:** a child with published reports

**Steps:**
1. Find the "Latest Report Highlight" card
2. Click **Read Full Report**

**Expected ✅**
- Navigates to `/sponsor/reports/<report_id>` for the correct latest report

**Failure ❌**
- 404 page or navigates to wrong report

---

## Status
- [x] Code fix applied (commit `5c01e90`)
- [x] TypeScript passes (zero errors)
- [ ] Test A — Real narrative visible; no random numbers or radar chart
- [ ] Test B — No-report placeholder renders correctly; no crash
- [ ] Test C — "Read Full Report" button navigates correctly
