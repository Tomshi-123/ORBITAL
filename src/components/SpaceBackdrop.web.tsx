import { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { TouchGlowContext } from './TouchGlowContext';

export function SpaceBackdrop() {
  const { pageId } = useContext(TouchGlowContext);

  useEffect(() => {
    const page = document.getElementById(`orbital-page-${pageId}`);
    const scope: ParentNode = page ?? document;
    const getPanels = () => Array.from(scope.querySelectorAll<HTMLElement>('[data-testid="orbital-glass-panel"]'));
    const shootingStars = Array.from(scope.querySelectorAll<HTMLElement>('[id^="orbital-shooting-star-"]'));
    const lastGlow = new WeakMap<HTMLElement, { x: number; y: number; opacity: number }>();
    let animationFrame = 0;
    let lastStarUpdate = 0;

    const updatePointer = (event: PointerEvent) => {
      getPanels().forEach((panel) => {
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

    const updateShootingStarGlow = (timestamp: number) => {
      if (timestamp - lastStarUpdate < 32) {
        animationFrame = requestAnimationFrame(updateShootingStarGlow);
        return;
      }
      lastStarUpdate = timestamp;

      const panels = getPanels();
      const panelRects = panels.map((panel) => panel.getBoundingClientRect());
      const starHeads = shootingStars.flatMap((star) => {
        if (Number(getComputedStyle(star).opacity) < 0.05) return [];

        const rect = star.getBoundingClientRect();
        const radians = 24 * Math.PI / 180;
        return [{
          x: rect.left + rect.width / 2 + star.offsetWidth / 2 * Math.cos(radians),
          y: rect.top + rect.height / 2 + star.offsetWidth / 2 * Math.sin(radians),
        }];
      });

      panels.forEach((panel, index) => {
        const rect = panelRects[index];
        let strongestGlow = { x: 0, y: 0, opacity: 0 };
        starHeads.forEach((head) => {
          const x = Math.max(rect.left, Math.min(head.x, rect.right));
          const y = Math.max(rect.top, Math.min(head.y, rect.bottom));
          const opacity = Math.max(0, 1 - Math.hypot(head.x - x, head.y - y) / 88);
          if (opacity > strongestGlow.opacity) strongestGlow = { x: x - rect.left, y: y - rect.top, opacity };
        });

        const previousGlow = lastGlow.get(panel);
        if (!previousGlow
          || Math.abs(previousGlow.x - strongestGlow.x) > 1
          || Math.abs(previousGlow.y - strongestGlow.y) > 1
          || Math.abs(previousGlow.opacity - strongestGlow.opacity) > 0.01) {
          panel.style.setProperty('--star-x', `${strongestGlow.x}px`);
          panel.style.setProperty('--star-y', `${strongestGlow.y}px`);
          panel.style.setProperty('--star-glow-opacity', String(strongestGlow.opacity));
          lastGlow.set(panel, strongestGlow);
        }
      });

      animationFrame = requestAnimationFrame(updateShootingStarGlow);
    };

    const clearPanelGlow = () => {
      getPanels().forEach((panel) => {
        panel.style.setProperty('--glow-opacity', '0');
      });
    };

    document.addEventListener('pointermove', updatePointer, { passive: true });
    document.addEventListener('pointerdown', updatePointer, { passive: true });
    document.addEventListener('pointerup', clearPanelGlow, { passive: true });
    document.addEventListener('pointercancel', clearPanelGlow, { passive: true });
    animationFrame = requestAnimationFrame(updateShootingStarGlow);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('pointermove', updatePointer);
      document.removeEventListener('pointerdown', updatePointer);
      document.removeEventListener('pointerup', clearPanelGlow);
      document.removeEventListener('pointercancel', clearPanelGlow);
      getPanels().forEach((panel) => {
        panel.style.removeProperty('--mouse-x');
        panel.style.removeProperty('--mouse-y');
        panel.style.removeProperty('--glow-opacity');
        panel.style.removeProperty('--star-x');
        panel.style.removeProperty('--star-y');
        panel.style.removeProperty('--star-glow-opacity');
      });
    };
  }, [pageId]);

  return <>
    <View nativeID="orbital-space-backdrop" pointerEvents="none" />
    <View nativeID="orbital-shooting-stars" pointerEvents="none">
      <View nativeID="orbital-shooting-star-1" />
      <View nativeID="orbital-shooting-star-2" />
    </View>
  </>;
}
