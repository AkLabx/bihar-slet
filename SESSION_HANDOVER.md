# Bihar SLET 2026 Portal — Session Handover Document

> **Note for the Next AI Assistant / Developer:**  
> This file contains the complete operational context, repository details, architecture, and instructions for continuing work on this project in any subsequent chat session.

---

## 📌 1. Project Overview & Live URLs

* **Project Name:** बिहार राज्य विद्यालय पुस्तकालयाध्यक्ष पात्रता परीक्षा 2026 (Bihar SLET / LET) Study Portal
* **GitHub Repository:** [https://github.com/AkLabx/bihar-slet](https://github.com/AkLabx/bihar-slet) (`public`)
* **Live Web Portal (GitHub Pages):** [https://aklabx.github.io/bihar-slet/](https://aklabx.github.io/bihar-slet/)
* **Target Exam:** Bihar School Librarian Eligibility Test (150 Marks Total: 100 Marks LIS + 50 Marks GK/Reasoning)
* **BSEB Category Cutoffs:**
  * General / UR: 50% (75/150 marks)
  * BC: 45.5% (68.25/150 marks)
  * EBC: 42.5% (63.75/150 marks)
  * SC / ST / PwD / Women: 40% (60/150 marks)

---

## 🛠️ 2. Tech Stack & Architecture

* **Frontend:** React 18/19, TypeScript, Vite 6
* **Routing:** `HashRouter` from `react-router-dom` (Crucial for GitHub Pages to prevent 404s on deep reload)
* **State Management:** Zustand with `persist` middleware (Stores language, theme, category, bookmarks, quiz history, answers)
* **Styling:** Tailwind CSS with Dark/Light mode support
* **Icons:** `lucide-react`
* **Test Suite:** Vitest (automated schema verification for all 445 questions)
* **CI/CD:** GitHub Actions
  * `.github/workflows/ci.yml`: Runs on PRs to `main` (Vitest schema validation, typecheck, build test).
  * `.github/workflows/deploy.yml`: Runs on push to `main` (builds `dist/` and deploys to GitHub Pages).
* **Branch Protection:** Active on `main` branch:
  * Required status check: `Validate Content Schema & Build`
  * Force pushes & branch deletions: Blocked

---

## 📂 3. Directory Layout

```
d:\library study notes artifects\
├── .github/workflows/
│   ├── ci.yml                 # Pre-merge validation workflow
│   └── deploy.yml             # GitHub Pages automated build & deploy
├── src/
│   ├── App.tsx                # App shell, HashRouter, layout, routes
│   ├── main.tsx               # Entry point
│   ├── index.css              # Tailwind base & utilities
│   ├── types/index.ts         # TypeScript interfaces
│   ├── store/useQuizStore.ts  # Zustand store (state, cutoffs, persistence)
│   ├── components/
│   │   ├── Navbar.tsx         # Category selector, centralized language toggle, theme switcher
│   │   ├── LanguageSwitcher.tsx # Centralized 3-state segmented pill language switcher
│   │   └── MarkdownRenderer.tsx # Language-aware parser adapting headers, tables, callouts & notes
│   ├── pages/
│   │   ├── HomePage.tsx       # Master dashboard, 10 units grid, stats cards, language switcher
│   │   ├── StudyPage.tsx      # Comprehensive study notes viewer with sticky/floating language switcher
│   │   ├── QuizPage.tsx       # Dual-mode quiz engine (Practice + 20-min Exam) with language switcher
│   │   ├── GrandMockPage.tsx  # 150-question full simulation with 150-min timer & live language switch
│   │   └── BookmarksPage.tsx  # Saved questions revision hub with live language switch
│   ├── data/
│   │   ├── manifest.json      # Complete syllabus metadata (30 subunits with pure Hindi & pure English titles)
│   │   ├── notes/             # 30 Markdown study note files (1.1.md - 10.2.md)
│   │   └── questions/         # 30 SubUnit JSON question files + all_questions.json
│   └── test/
│       ├── questions.test.ts  # 5 Vitest tests verifying all 445 MCQs schema
│       └── language.test.ts   # 3 Vitest tests verifying centralized language state, titles & notes
├── scripts/
│   └── extract-content.mjs    # Parser script converting HTML/MD into structured JSON
├── Unit_01_... to Unit_10_... # Legacy unit directories with original MD notes and HTML quizzes
├── index.html                 # Vite entry HTML
├── legacy_index.html          # Backup of original single-file static portal
├── package.json               # Scripts & dependencies
├── tsconfig.json              # TypeScript configuration (with vite/client types)
├── vite.config.ts             # Vite config with base: '/bihar-slet/'
└── README.md                  # Comprehensive documentation with badges
```

---

## 💻 4. Development & Workflow Commands

On Windows PowerShell:
```powershell
# Run automated schema & integrity tests (5 tests)
npm.cmd test

# Run TypeScript type check
npm.cmd run typecheck

# Build production bundle (outputs to dist/)
npm.cmd run build

# Start local development server
npm.cmd run dev
```

### Git & Contributing Workflow:
Because `main` has branch protection configured:
1. Always create a feature branch:
   ```powershell
   git checkout -b feature/your-feature-name
   ```
2. Commit changes and push:
   ```powershell
   git add .
   git commit -m "feat: description of changes"
   git push -u origin feature/your-feature-name
   ```
3. Open a Pull Request:
   ```powershell
   gh pr create --title "feat: your feature" --body "Summary of changes"
   ```
4. CI checks (`ci.yml`) will run automatically. Once green, merge into `main`:
   ```powershell
   gh pr merge --squash --delete-branch
   ```
5. GitHub Actions (`deploy.yml`) will automatically compile and deploy the updated app to [https://aklabx.github.io/bihar-slet/](https://aklabx.github.io/bihar-slet/).

---

## 🚀 5. Recommended Next Steps for Future Sessions

1. **Additional Grand Mock Tests:** Add Grand Mock Sets 2, 3, etc. with randomized or curated 150-question papers.
2. **Flashcards / Quick Recall Module:** Quick flashcards for डॉ. रंगनाथन के 5 सूत्र, पुस्तकालय अधिनियम के वर्ष (1948 Tamil Nadu, etc.), और वर्गीकरण पद्धतियों के संस्करण।
3. **PWA (Progressive Web App):** Add `vite-plugin-pwa` to enable full offline caching on mobile devices with a home-screen install button.
4. **Downloadable PDF Generator:** Provide one-click consolidated PDF downloads for each unit.
