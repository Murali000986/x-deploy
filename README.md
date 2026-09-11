# X Dashboard Manager

Next.js app for managing X (Twitter) candidates via the X API.

---

## Prerequisites

Install these once on any new machine:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 + | https://nodejs.org |
| npm | comes with Node | — |
| Git | any | https://git-scm.com |

Verify:
```bash
node -v   # should print v18.x or higher
npm -v
```

---

## 1 — Clone the repo

```bash
git clone https://github.com/Murali000986/x-new.git
cd x-new/x-dashbord-manger
```

---

## 2 — Create environment file

Create a file named `.env.local` in the project root:

```env
X_BEARER_TOKEN=your_bearer_token
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
```

> Get these values from the [X Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps).  
> **Never commit `.env.local` to git.**

---

## 3 — Install dependencies

```bash
npm install
```

---

## 4 — Run dev server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Other commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Lint check |

---

## Troubleshooting

**Port 3000 in use** — run on a different port:
```bash
npm run dev -- -p 3001
```

**Missing env vars** — make sure `.env.local` exists and has all 5 keys.

**Node version too old** — upgrade Node to v18+.
