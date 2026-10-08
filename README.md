# ORBITAL

An Expo / React Native mobile foundation for a space and astronomy observatory app. The UI runs from local sample data; no API keys, backend, or live feeds are required to start it.

## Run the app

```sh
npm install
npm start
```

Open it with Expo Go or a development build. Use `npm run android` on Android or `npm run ios` on macOS with Xcode installed.

## What's included

- Expo Router navigation with mobile bottom tabs and secondary screens
- Overview dashboard, sample observation map, report list and report details
- Space and UAP news views with separate categories
- Launch schedule and live local countdowns
- Manual sky-view preview, camera source placeholders and celestial-event list
- Search across sightings, stories, missions and events
- Typed domain models, mock data and a replaceable data-source interface
- Source/confidence labels and explicit notices that reports are not verification

## Replace mock data with APIs

The screen-facing adapter is `src/services/index.ts`. Implement `OrbitalDataSource` with your API clients and assign that implementation to `dataSource`; screens already consume the interface. Keep credentials in an appropriate server-side environment rather than shipping private API keys in the mobile app.

`src/mock-data.ts` deliberately uses sample records, relative dates and clearly labelled placeholder sources. Replace those records and labels before presenting live data.

## Follow-up integrations

- Connect real sightings, news, launch, astronomy and camera providers in the service layer.
- Add loading, error, retry and cache states around provider requests.
- Add location, camera, compass and orientation permissions before using device sensors.
- Replace the schematic map preview with a geographic map and the globe illustration with a native-compatible 3D globe.
- Connect push notifications and a backend before presenting alert preferences as active.

These are intentionally represented as previews/placeholders rather than fake API or live-stream integrations.
