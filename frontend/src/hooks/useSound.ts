/**
 * useSound — Web Audio API hook for KDS sound alerts.
 *
 * Plays a short beep tone when a new order arrives (PEDIDO_CONFIRMADO).
 * Uses Web Audio API — no external audio files needed.
 *
 * Implements US-COCINA-05:
 * - Reproduce un beep al recibir PEDIDO_CONFIRMADO
 * - No requiere archivos externos
 * - Respeta política de autoplay del navegador (requiere interacción previa)
 */

import { useCallback, useRef } from "react";
import { useUIStore } from "../store/uiStore";

const BEEP_FREQUENCY = 880; // Hz (A5 — agudo pero no irritante)
const BEEP_DURATION = 180; // ms
const BEEP_TYPE: OscillatorType = "sine";

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Lazy-init AudioContext (requiere interacción del usuario en navegadores modernos)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;

      // Si está suspendido (política de autoplay), intentar reanudar
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
          // Si no se puede reanudar, no hay audio — silencioso
        });
      }

      // Crear oscilador
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = BEEP_TYPE;
      oscillator.frequency.setValueAtTime(BEEP_FREQUENCY, ctx.currentTime);

      // Envolvente: fade in/out suave para evitar click
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + BEEP_DURATION / 1000 - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + BEEP_DURATION / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + BEEP_DURATION / 1000);
    } catch {
      // Web Audio API no disponible — silencioso
    }
  }, [soundEnabled]);

  return { playBeep };
}
