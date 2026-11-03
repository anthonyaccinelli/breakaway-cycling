# Ride Breakaway iPad — Phase 1

An **isolated**, review-only Capacitor iPad foundation. Nothing in the existing browser applications imports this folder.

## Current scope
- Capacitor configuration and Vite/TypeScript web shell.
- Touch-friendly landscape navigation: Classic + Coach, Survival, Cycle Quest, Pedalkin.
- Explicitly simulated ride telemetry and session controls, shared across modes.
- No Bluetooth pairing, resistance control, account sync, saved rides, or actual game engine integration.

## Run on desktop
```bash
cd apps/ipad
npm install
npm run dev
npm run build
```

## Create local native iPad project (requires macOS + Xcode)
```bash
npm run build
npx cap add ios
npm run cap:sync
npm run cap:open
```

Choose an iPad target in Xcode. Set device orientation to landscape and verify rotation and safe-area behavior on a physical device. **No .xcodeproj is checked in at this stage.**

## Next gated phases
1. Separate native BLE service using CoreBluetooth and FTMS, with device discovery, reconnect, permissions and sensor capabilities.
2. Safe FTMS control queue with feature negotiation, ERG/SIM and virtual shifting where supported. No resistance writes before hardware validation.
3. Shared ride engine adapter, data sync, Coach, and mode-specific game integration.
4. TestFlight hardware matrix: Elite Direto XR-T, speed-only/cadence-only/combined sensors, HRM, power meter; background/foreground, disconnect recovery.

## Important
Browser Web Bluetooth code is **not** a replacement for native CoreBluetooth in WKWebView. Zwift Click support needs separate protocol/licensing/compatibility investigation.
