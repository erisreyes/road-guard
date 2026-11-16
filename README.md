# Road Guard (prototype)

Pedestrian warning PWA for an iPad on a dashboard. Detection runs on the device (COCO-SSD + TensorFlow.js).
This is an assistive prototype only. It is not tested for real driving use.

## Run
    npm install
    npm run dev          # HTTPS dev server; open the https://<your-computer-ip>:5173 link on the iPad (accept the certificate warning)

## Put it on the iPad home screen
Deploy `dist/` (npm run build) to Cloudflare Pages, Netlify, Vercel or GitHub Pages (all free, all HTTPS),
open the URL in Safari on the iPad, then Share > Add to Home Screen.

## Tune
Edit `src/config.ts`. Calibrate `verticalFovDeg` by standing a person at a measured distance (e.g. 10 m)
and adjusting until the on-screen estimate matches.

## iPhone
The layout switches to a slim status strip on phones held in landscape. Turn off the rotation lock in
Control Center so Safari goes landscape, and add the site to the Home Screen for full-screen use.
