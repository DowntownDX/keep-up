function trim(value: number, digits: number): string {
  return value
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1_000_000_000) return `${trim(value / 1_000_000_000, 1)}B`;
  if (magnitude >= 1_000_000) return `${trim(value / 1_000_000, 1)}M`;
  if (magnitude >= 1_000) return `${trim(value / 1_000, 1)}K`;
  if (magnitude >= 10) return trim(value, 1);
  return trim(value, 2);
}

export function formatRate(value: number): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatAmount(Math.abs(value))}/s`;
}

export function formatPercent(value: number): string {
  return `${trim(Math.min(1, Math.max(0, value)) * 100, 1)}%`;
}

/** Compact elapsed time for countdowns and release ages. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  if (whole < 60) return `${whole}s`;
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) {
    const rest = whole % 60;
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest === 0 ? `${days}d` : `${days}d ${rest}h`;
}
