# Elly Store revamp — run doc

Static prototype, no dependencies, no build step.

## Reproduce artifacts

None. There is no package.json, lockfile, or build. The site is plain HTML/CSS/JS
served straight from disk — no env files to copy, nothing to install.

## Run the server

From the `elly-store-revamp` directory (that folder is the server root — `server.js`
sets `ROOT = __dirname`, so `pdp.html`, `assets/`, etc. resolve from there):

```bash
node server.js
```

Default port: 4173 (`PORT` env var overrides). Verify: open
http://localhost:4173/pdp.html (or `?p=Kids%20Tee%20-%20Doodle%20Mickey&personalise=1`
for the personalisation configurator demo).

Detached (Windows) start — logs must go to two different files:

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory '<checkout>\elly-store-revamp' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

Sanity check with `node _smoke.js` from `elly-store-revamp` (Node-only smoke tests, no server needed).