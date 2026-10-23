# Ride Breakaway iPhone native development

This branch introduces an **isolated Capacitor iOS foundation**. The existing Vite
desktop web application and Web Bluetooth FTMS implementation remain unchanged.

## Requirements
- macOS with current Xcode and Apple command-line tools
- Node.js matching the web project
- An Apple development team for device signing
- A physical iPhone and FTMS smart trainer for BLE verification

## Build locally
1. Run `npm install`.
2. Run `npm run build`.
3. Run `npm run ios:add` once to generate the native Xcode project.
4. Run `npm run ios:sync` after each web build.
5. Run `npm run ios:open` to open Xcode and configure signing.

The generated `ios/` directory is intentionally not committed in this initial
foundation. Generate it on macOS and commit it after native signing, entitlements,
privacy strings and BLE plugin integration are reviewed.

## Bluetooth architecture and safety
- Desktop: preserve existing Web Bluetooth FTMS and HR behavior.
- iOS: implement a Capacitor plugin using CoreBluetooth, not Web Bluetooth.
- Request Bluetooth permission with an accurate
  `NSBluetoothAlwaysUsageDescription` in the native Info.plist.
- Discover FTMS (0x1826), read Indoor Bike Data (0x2AD2), subscribe to
  Fitness Machine Status (0x2ADA), and use Fitness Machine Control Point
  (0x2AD9) with notification/indication acknowledgement and serialized writes.
- Request control before setting simulation grade or ERG power. Handle
  disconnections, denied permission, and unsupported control capabilities.
- Support Heart Rate service (0x180D) separately; Zwift Click V1 requires
  protocol verification on actual hardware.
- Do not send trainer resistance commands until the user has explicitly
  connected and the device has confirmed FTMS control ownership.
- Do not claim background riding, lock-screen operation, or trainer control
  until tested on physical devices.

## Planned integration
1. Define a typed `TrainerTransport` abstraction for web and native.
2. Implement the CoreBluetooth Capacitor plugin and its permission flow.
3. Refactor existing trainer connection/control calls behind the transport.
4. Build iPhone-specific route, connection and ride layouts.
5. Add iOS simulator tests and physical trainer/HR/Click tests.
6. Validate production desktop regression before merging.

This is a foundation, **not yet a functional native BLE trainer integration**.
