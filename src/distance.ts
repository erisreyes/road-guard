import { CONFIG } from './config';

// Pinhole camera estimate: distance = focalPx * realHeight / heightInPixels.
// Rough by design: people cut off at the frame edge or sitting/bending will read too far or too near.
export function estimateDistanceM(bboxHeightPx: number, frameHeightPx: number): number {
  const fovRad = (CONFIG.verticalFovDeg * Math.PI) / 180;
  const focalPx = frameHeightPx / 2 / Math.tan(fovRad / 2);
  return (focalPx * CONFIG.personHeightM) / Math.max(bboxHeightPx, 1);
}
