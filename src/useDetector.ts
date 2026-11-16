import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { CONFIG } from './config';
import { estimateDistanceM } from './distance';

export type Person = {
  x: number; y: number; w: number; h: number; // pixels in the video frame
  score: number;
  distanceM: number;
  inPath: boolean;
};
export type Frame = { people: Person[]; vw: number; vh: number };

export function useDetector(videoRef: RefObject<HTMLVideoElement>, running: boolean) {
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<Frame>({ people: [], vw: 1280, vh: 720 });
  const [latencyMs, setLatencyMs] = useState(0);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  // Load the model once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await tf.setBackend('webgl');
      await tf.ready();
      const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      if (!cancelled) {
        modelRef.current = model;
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Detection loop.
  useEffect(() => {
    if (!running || !ready) return;
    let stop = false;
    let timer = 0;

    const tick = async () => {
      const video = videoRef.current;
      const model = modelRef.current;
      if (video && model && video.readyState >= 2) {
        const t0 = performance.now();
        const preds = await model.detect(video, 10, CONFIG.minScore);
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const people: Person[] = preds
          .filter((p) => p.class === 'person')
          .map((p) => {
            const [x, y, w, h] = p.bbox;
            const cx = (x + w / 2) / vw;
            return {
              x, y, w, h,
              score: p.score,
              distanceM: estimateDistanceM(h, vh),
              inPath: cx >= CONFIG.pathZone[0] && cx <= CONFIG.pathZone[1],
            };
          });
        if (!stop) {
          setFrame({ people, vw, vh });
          setLatencyMs(Math.round(performance.now() - t0));
        }
      }
      if (!stop) timer = window.setTimeout(tick, CONFIG.detectIntervalMs);
    };

    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [running, ready, videoRef]);

  return { ready, frame, latencyMs };
}
