import { createContext } from 'react';

export type TouchGlowPoint = { x: number; y: number };

export const TouchGlowContext = createContext({
  pageId: '',
  point: null as TouchGlowPoint | null,
  setPoint: (_point: TouchGlowPoint | null) => {},
  shootingStarPoint: null as TouchGlowPoint | null,
  setShootingStarPoint: (_point: TouchGlowPoint | null) => {},
});
