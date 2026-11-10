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
