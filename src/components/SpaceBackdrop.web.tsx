import { useEffect } from 'react';
import { View } from 'react-native';

export function SpaceBackdrop() {
  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      document.querySelectorAll<HTMLElement>('[data-testid="orbital-glass-panel"]').forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const closestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
        const closestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));
        const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY);
        const glow = Math.max(0, 1 - distance / 80);

        panel.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        panel.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
        panel.style.setProperty('--glow-opacity', String(glow));
      });
    };

    const clearPanelGlow = () => {
      document.querySelectorAll<HTMLElement>('[data-testid="orbital-glass-panel"]').forEach((panel) => {
        panel.style.setProperty('--glow-opacity', '0');
      });
    };

    document.addEventListener('pointermove', updatePointer, { passive: true });
    document.addEventListener('pointerdown', updatePointer, { passive: true });
    document.addEventListener('pointerup', clearPanelGlow, { passive: true });
    document.addEventListener('pointercancel', clearPanelGlow, { passive: true });

    return () => {
      document.removeEventListener('pointermove', updatePointer);
      document.removeEventListener('pointerdown', updatePointer);
      document.removeEventListener('pointerup', clearPanelGlow);
      document.removeEventListener('pointercancel', clearPanelGlow);
      document.querySelectorAll<HTMLElement>('[data-testid="orbital-glass-panel"]').forEach((panel) => {
        panel.style.removeProperty('--mouse-x');
        panel.style.removeProperty('--mouse-y');
        panel.style.removeProperty('--glow-opacity');
      });
    };
  }, []);

  return <View nativeID="orbital-space-backdrop" pointerEvents="none" />;
}
