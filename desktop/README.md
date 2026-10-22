# Breakaway Cycling Desktop — Phase 1

This branch packages the existing Vite application with Electron for macOS and Windows. It is intentionally separate from the production web branch.

## Run locally

```bash
npm install
npm run desktop:dev
```

In a separate terminal, run `npm run dev` before `desktop:dev`. Or build and launch offline:

```bash
npm run desktop:build
npm run desktop:start
```

## Produce installers

```bash
npm run desktop:package:mac
npm run desktop:package:win
```

Build the macOS package on a Mac and Windows package on Windows for the best compatibility. Unsigned builds may trigger operating-system warnings.

## Offline architecture

- The desktop Vite build uses relative asset paths so it can load from `file://`.
- Electron blocks all HTTP(S) and WebSocket requests in packaged mode.
- Route generation, including seeded endless terrain, runs locally in the existing renderer.
- IndexedDB and localStorage persist on the user's machine.
- Supabase authentication is disabled in desktop builds.
- Trainer Bluetooth is **not yet validated**. Electron Web Bluetooth device permission and FTMS support are Phase 3 work. This Phase 1 build must not be considered trainer-ready.
- GPX file import is local; imported GPX does not require an internet connection.

## Smoke test

1. Start packaged app with Wi-Fi disconnected.
2. Generate a finite route, inspect distance/elevation and edit the profile.
3. Generate an endless route and verify the initial terrain appears.
4. Close and reopen the app; check local preferences.
5. Confirm that no account or server is required for route creation.

The public Vercel app remains deployed from `main`.
