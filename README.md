# ORBITAL

An Expo / React Native space and astronomy app that uses public data providers and local astronomical calculations.

## Run the app

```sh
npm install
npm start
```

Open it with Expo Go or a development build. Use `npm run android` on Android or `npm run ios` on macOS with Xcode installed.

## What's included

- Expo Router navigation with mobile bottom tabs and secondary screens
- Spaceflight news and launch schedules
- Live satellite, ISS and aurora map layers, plus near-Earth-object close-approach data
- Location-aware sky positions and computed celestial events
- Active Missions dashboard (crews, spacecraft and stations from Launch Library 2) with an ISS live stream
- Search across launches and sky events
- Typed domain models and a replaceable data-source interface
- Nebula-and-star page backgrounds, frosted glass panels, and pointer/touch-reactive glow effects

The shared page and panel components apply the visual treatment across screens. On web, CSS supplies the layered star field, glass blur, edge mask and pointer-following glow; on iOS and Android, native gradients and touch-responsive panels provide the equivalent treatment.

## Data sources and limitations

- Spaceflight news: Spaceflight News API.
- Launches: The Space Devs Launch Library.
- Mission control: Launch Library 2.
- ISS position: Where The ISS At; satellite tracks: public TLE data propagated locally; aurora forecast: NOAA SWPC; near-Earth objects: NASA NeoWs.
- Sky view and celestial-event times are calculated locally with Astronomy Engine ephemerides. Local solar-eclipse visibility uses the device location. Cloud cover, light pollution, obstructions and naked-eye visibility are not forecast.

The app requests foreground location permission only for local sky calculations. Coordinates are used on-device and are not sent to an astronomy provider. Provider APIs are called directly by the app, so network availability, provider changes and rate limits can affect live data. Failed requests are shown as unavailable rather than replaced with sample records.

The map’s launch ground tracks are estimates derived from launch site and target orbit information, not precise mission trajectories. Satellite positions are predictions based on the latest available TLEs.

The screen-facing adapter is `src/services/index.ts`. Keep any future private API credentials in an appropriate server-side environment rather than shipping them in the mobile app.
