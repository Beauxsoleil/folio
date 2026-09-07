# Getting Folio onto GitHub — Complete Guide

Everything you need: from installing Git to pushing your code, your daily
workflow, and connecting GitHub to Vercel for automatic deployments.
Follow the steps top to bottom the first time.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Turn the project into a Git repository](#2-turn-the-project-into-a-git-repository)
3. [Create the repository on GitHub](#3-create-the-repository-on-github)
4. [Connect and push](#4-connect-and-push)
5. [Your daily workflow](#5-your-daily-workflow)
6. [Connect to Vercel (auto-deploy on every push)](#6-connect-to-vercel-auto-deploy-on-every-push)
7. [Common errors and fixes](#7-common-errors-and-fixes)
8. [Alternative: GitHub Desktop (no terminal)](#8-alternative-github-desktop-no-terminal)
9. [Cheat sheet](#9-cheat-sheet)

---

## 1. Prerequisites

### 1.1 Install Git

Check if Git is already installed:

```bash
git --version        # e.g. "git version 2.43.0"
```

If you see a version number, skip ahead. Otherwise:

- **Windows** — download Git for Windows from <https://git-scm.com/downloads> and
  install with the defaults (it includes Git Credential Manager, which makes
  signing in painless).
- **macOS** — run `xcode-select --install`, or `brew install git`.
- **Linux** — `sudo apt install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora).

### 1.2 Create a GitHub account

Go to <https://github.com> → **Sign up** (free). Verify your email address —
unverified accounts get blocked from some features.

### 1.3 Tell Git who you are (one time)

Every commit is stamped with your name and email. Set them once, globally:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

> Use the **same email as your GitHub account** so your commits link to your
> profile and show up in your contribution graph.

Check it worked:

```bash
git config --global user.name
git config --global user.email
```

---

## 2. Turn the project into a Git repository

Open a terminal **in the project's root folder** (the folder that contains
`package.json`).

### 2.1 Initialize the repository

```bash
git init
```

This creates a hidden `.git` folder where all history lives. Nothing has been
sent anywhere yet — everything is local.

### 2.2 Stage all files

```bash
git add -A
```

The project's `.gitignore` automatically **excludes**:

- `node_modules/` (thousands of files — reinstalled via `npm install`)
- `.next/` (build output)
- **`.env` (your database credentials — never committed)**

### 2.3 Verify nothing sensitive is staged

```bash
git status
```

Read the list of files to be committed. **`.env` should NOT appear.** If it
ever does, stop — you'd be publishing your database password (see the
[error table](#7-common-errors-and-fixes) for how to recover).

### 2.4 Create the first commit

```bash
git commit -m "Folio — personal book tracker with 3D shelf"
```

---

## 3. Create the repository on GitHub

1. Go to <https://github.com/new>
2. **Repository name:** `folio` (or whatever you like)
3. **Visibility:** choose **Private** (recommended — only you can see it) or Public
4. **Leave all three checkboxes UNCHECKED:**
   - [ ] Add a README file
   - [ ] Add .gitignore
   - [ ] Choose a license

   > You already have a local repository with its own README. Letting GitHub
   > create these files produces a *second* history that fights your first push.

5. Click **Create repository**.

GitHub shows a "Quick setup" screen. Copy the **HTTPS** URL — it looks like:

```
https://github.com/YOUR_USERNAME/folio.git
```

Keep this page open or paste the URL somewhere handy.

---

## 4. Connect and push

Back in the terminal (still in the project root):

### 4.1 Link the local repo to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/folio.git
```

(Replace `YOUR_USERNAME` — the shortcut Ctrl+Shift+V pastes in most terminals.)

### 4.2 Name the main branch `main`

```bash
git branch -M main
```

### 4.3 Push!

```bash
git push -u origin main
```

**The first push asks you to sign in:**

- **Windows / macOS:** a browser window opens automatically (Git Credential
  Manager). Sign in with GitHub once — it's remembered forever.
- **Linux / headless:** GitHub no longer accepts your account *password* for Git.
  Create a **Personal Access Token** instead:
  1. github.com → your avatar → **Settings**
  2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
  3. **Generate new token (classic)** → check the **`repo`** scope → Generate
  4. Copy the token and paste it when Git asks for a *password*
     (the prompt accepts the token in place of a password)

### 4.4 Confirm it worked

Refresh the GitHub repository page. You should see:

- All your source files
- The rendered **README.md** as the front page

🎉 Your code is on GitHub.

---

## 5. Your daily workflow

Ninety percent of Git, for a solo project, is three commands after you change code:

```bash
git add -A                                    # 1. stage every change
git commit -m "add genre filter to library"   # 2. save a snapshot with a message
git push                                      # 3. ship it to GitHub
```

Write commit messages in the present tense and keep them honest — future-you
will read `git log` to figure out what happened.

### Useful extras (optional)

```bash
git status            # what's changed / staged?
git log --oneline     # compact history of commits
git diff              # line-by-line changes not yet staged
git pull              # download commits made elsewhere (web editor, other machine)
```

### Branches (when you want to experiment safely)

```bash
git checkout -b experiment       # create + switch to a branch
# ...make changes, commit as usual...
git push -u origin experiment    # push the branch
```

Then on GitHub: click **Compare & pull request** → review → **Merge**.
Merging into `main` = production deploy (see next section).

### Editing directly on GitHub

For tiny fixes: open any file on github.com → pencil icon → edit →
**Commit changes**. Remember to `git pull` locally afterward so your copy
catches up.

---

## 6. Connect to Vercel (auto-deploy on every push)

One-time setup — after this, deployments are fully automatic:

1. Sign in to <https://vercel.com> **with your GitHub account**
2. **Add New → Project** → find `folio` → **Import**
3. Vercel detects Next.js automatically — don't change build settings
4. Add the environment variable:
   - `DATABASE_URL` = your **pooled** Neon connection string
     (from the Neon dashboard; the host contains `-pooler`)
   - optional: `FOLIO_DISABLE_SEED` = `1` (skip demo data on fresh databases)
5. Click **Deploy**

From now on:

- **Every `git push` to `main`** → production redeploy in ~2 minutes
- **Every pull request** → its own preview URL to test before merging

---

## 7. Common errors and fixes

| Error message | What it means / fix |
|---|---|
| `remote origin already exists` | The remote was added before. Re-point it: `git remote set-url origin https://github.com/YOU/folio.git` |
| `! [rejected] main -> main (fetch first)` or `non-fast-forward` | The GitHub repo has commits you don't have locally. Run `git pull --rebase origin main`, resolve any conflicts, then push again. |
| `fatal: refusing to merge unrelated histories` | Happens if the GitHub repo was created *with* a README. Fix: `git pull --rebase origin main --allow-unrelated-histories`, then push. |
| Password prompt rejects your real password | GitHub requires a **Personal Access Token**, not your account password (see step 4.3). |
| Asked to sign in over and over | Store credentials once: `git config --global credential.helper store` (Linux) or reinstall Git Credential Manager on Windows/macOS. |
| `author identity unknown` | You skipped step 1.3 — set `user.name` and `user.email`. |
| Accidentally committed `.env` | 1. `git rm --cached .env` 2. `git commit -m "remove env from tracking"` 3. `git push` 4. **Immediately rotate the database password** (Neon dashboard → one click) — secrets in Git history must be treated as leaked. |
| `remote repository not found` | Typo in the URL, or the repo was renamed/deleted: check `git remote -v`. |

---

## 8. Alternative: GitHub Desktop (no terminal)

If you'd rather click buttons:

1. Download <https://desktop.github.com> and sign in with GitHub
2. **File → Add local repository** → choose the project folder
3. GitHub Desktop notices there's no repo yet — click **create a repository**
4. Give it the name `folio`, private — click **Create Repository**
5. Click **Publish repository** to push it to GitHub (first time)
6. Daily flow: changes appear in the left panel → type a summary →
   **Commit to main** → **Push origin**

GitHub Desktop and the terminal can be mixed freely — they're the same Git
underneath.

---

## 9. Cheat sheet

```bash
# FIRST TIME (per project)
git init
git add -A
git commit -m "first commit"
git remote add origin https://github.com/YOU/folio.git
git branch -M main
git push -u origin main

# EVERY DAY
git add -A
git commit -m "what changed"
git push

# WHEN THINGS GET WEIRD
git status                 # where am I?
git log --oneline -10      # recent history
git pull --rebase          # catch up to GitHub
git remote -v              # where does this push?
```

> The one line to memorize:
> **`git add -A && git commit -m "message" && git push`**
> — every push automatically redeploys your site on Vercel.

---

*Next step after this guide: create the free Neon database and add its
connection string to Vercel — see the **Deploy** section of `README.md`.*
