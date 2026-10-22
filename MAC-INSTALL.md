# Breakaway Cycling for macOS — build kit

This is the current v3.7.7 web app packaged with Electron desktop support and a **native window-opacity slider** in the floating overlay.

## Build on your Mac
1. Install Node.js LTS from nodejs.org.
2. Unzip this folder and open Terminal in the unzipped folder.
3. Run `npm install`.
4. Run `npm run dist:mac`.
5. Open the `installers` folder and install the generated `.dmg`.

The DMG must be built on macOS. This source kit is **not** a compiled or Apple-signed application. macOS may block an unsigned app. For distribution to others, configure Apple Developer signing and notarization.

## Overlay
Click **Always on top** in the elevation profile. The desktop overlay uses a separate transparent Electron window. Its **Window opacity** slider changes actual native window opacity via `BrowserWindow.setOpacity`, from 5% to 100% in 1% increments, including the background, graph, labels, and controls. The value persists across overlay reopenings. This differs from the browser's CSS content-opacity control.

Click-through lets your mouse interact with apps behind the overlay. Press **Command+Shift+O** to unlock it.

## Limitations
The package was assembled on Linux and has not been compiled, signed, notarized, or tested on a Mac or with Bluetooth trainer hardware. Electron Bluetooth compatibility should be validated with your Direto XR-T, Zwift Click, and HRM. Supabase sign-in may require configuration for localhost; guest riding and local TCX are the intended desktop path.
