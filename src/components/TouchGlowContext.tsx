import { createContext } from 'react';

export type TouchGlowPoint = { x: number; y: number };

export const TouchGlowContext = createContext({
  point: null as TouchGlowPoint | null,
  setPoint: (_point: TouchGlowPoint | null) => {},
});
