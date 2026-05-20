/**
 * UrgencyTimer.tsx
 *
 * Component that displays order age with urgency-based color coding.
 * Updates every 15 seconds (via setInterval).
 *
 * Color scheme (RN-CO04):
 * - Green: < 5 minutes
 * - Yellow: 5-10 minutes
 * - Orange: 10-15 minutes
 * - Red: > 15 minutes
 */

import { useState, useEffect } from "react";
import "./UrgencyTimer.css";

interface UrgencyTimerProps {
  kitchenEntryAt: string; // ISO timestamp when order entered kitchen
}

function getUrgencyLevel(ageSeconds: number): {
  level: "green" | "yellow" | "orange" | "red";
  label: string;
} {
  if (ageSeconds < 300) {
    // < 5 min
    return { level: "green", label: "Fresh" };
  } else if (ageSeconds < 600) {
    // 5-10 min
    return { level: "yellow", label: "Warning" };
  } else if (ageSeconds < 900) {
    // 10-15 min
    return { level: "orange", label: "Urgent" };
  } else {
    // > 15 min
    return { level: "red", label: "Critical" };
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function UrgencyTimer({ kitchenEntryAt }: UrgencyTimerProps) {
  const [ageSeconds, setAgeSeconds] = useState(0);
  const [urgency, setUrgency] = useState(getUrgencyLevel(0));

  useEffect(() => {
    // Initial calculation
    const entryTime = new Date(kitchenEntryAt).getTime();
    const now = new Date().getTime();
    const age = Math.floor((now - entryTime) / 1000);
    setAgeSeconds(Math.max(0, age));
    setUrgency(getUrgencyLevel(Math.max(0, age)));

    // Update every 15 seconds
    const interval = setInterval(() => {
      const entryTime = new Date(kitchenEntryAt).getTime();
      const now = new Date().getTime();
      const age = Math.floor((now - entryTime) / 1000);
      const validAge = Math.max(0, age);
      setAgeSeconds(validAge);
      setUrgency(getUrgencyLevel(validAge));
    }, 15000);

    return () => clearInterval(interval);
  }, [kitchenEntryAt]);

  return (
    <div className={`urgency-timer ${urgency.level}`}>
      <div className="timer-display">
        <span className="timer-value">{formatTime(ageSeconds)}</span>
        <span className="timer-label">{urgency.label}</span>
      </div>
    </div>
  );
}
