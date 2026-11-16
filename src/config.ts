// All tunable values live here. Calibrate verticalFovDeg with a real person at a measured distance.
export const CONFIG = {
  minScore: 0.5,          // minimum detection confidence
  detectIntervalMs: 66,   // pause between detections (~15 per second at best)
  cautionM: 15,           // amber alert at or under this distance
  dangerM: 7,             // red alert at or under this distance
  pathZone: [0.25, 0.75] as const, // only people whose centre is in this horizontal band count
  personHeightM: 1.7,     // assumed height used for distance estimate
  verticalFovDeg: 40,     // ASSUMED camera field of view. Calibrate it.
  holdMs: 800,            // keep the alert this long after the person disappears
};
