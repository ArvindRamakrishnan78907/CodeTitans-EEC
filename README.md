# SnipLink — URL Shortener (Mission Alpha)

A full-stack URL shortener with QR code generation, custom aliases, and link analytics.

## Features

- ⚡ **URL Shortener** — Shorten any URL to a unique 7-char Base62 code
- 🏷️ **Custom Aliases** — Set memorable custom short codes
- 📱 **QR Generator** — Generate, customize, and download QR codes
- 📊 **Link Analytics** — Track clicks, referrers, devices, and more
- ↗️ **Fast Redirect** — 302 redirect with click logging

## Tech Stack

- **Frontend**: Vite + React 18 + Chart.js
- **Backend**: Node.js + Express
- **Database**: SQLite (sql.js)
- **Styling**: Vanilla CSS (dark mode, glassmorphism)

## Local Development

### Backend
```bash
cd server
npm install
node server.js
# → http://localhost:3001
```

### Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render

## Environment Variables

### Backend (Render)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3001` |
| `BASE_URL` | Public backend URL | `https://your-app.onrender.com` |
| `CLIENT_URL` | Frontend URL | `https://your-app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `https://your-app.onrender.com/api` |
