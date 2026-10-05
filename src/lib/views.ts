import type { Section } from './model';
export type RoomView = 'room' | Section;
export type Vec3 = [number, number, number];
export const views: Record<RoomView, { position: Vec3; look: Vec3 }> = {
  room: { position: [0.1, 1.95, 3.9], look: [0, 1.72, -2.5] },
  work: { position: [2.4, 1.6, 1.65], look: [2.4, 1.6, 0.698] },
  studio: { position: [-2.52, 1.58, -1.55], look: [-2.52, 1.58, -2.87] },
  records: { position: [-2.47, 0.82, -0.55], look: [-2.47, 0.55, -1.9] },
  books: { position: [2.57, 0.75, -0.5], look: [2.57, 0.55, -1.9] },
  memories: { position: [2.6, 2.28, -0.95], look: [2.6, 2.28, -2.76] },
  contact: { position: [1.44, 1.25, 1.72], look: [1.44, 1.011, 1.43] },
};
export const hotspots: Record<Section, Vec3> = {
  studio: [-2.15, 2.6, -2.7], records: [-2.5, 1.05, -1.78], books: [2.55, 0.7, -1.7],
  memories: [2.6, 2.35, -2.7], work: [2.4, 1.8, 0.66], contact: [1.45, 1.13, 1.5],
};
// Mid-distance framing keeps the room visible and clears the desk/speakers.
export const inspectionViews:Record<Section,Vec3>={
  work:[1.45,1.95,2.7],studio:[-1.55,2.15,-.2],records:[-1.6,1.8,.65],
  books:[2.57,1.65,.4],memories:[1.55,2.25,.55],contact:[.9,1.95,2.6],
};
export type MarkerRefs = { current: Partial<Record<Section, HTMLButtonElement | null>> };
