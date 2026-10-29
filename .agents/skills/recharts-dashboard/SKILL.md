---
name: recharts-dashboard
description: >-
  Builds dashboard charts with Recharts in React/Next.js: responsive containers,
  pie/bar/line charts, custom tooltips, currency formatting, and export-safe
  SVG styling. Use when adding data visualizations, allocation charts, trend
  graphs, or financial dashboards.
---

# Recharts Dashboard Charts

## Install

```bash
npm install recharts
```

Charts are client components — add `"use client"` to wrapper files.

## Layout pattern

```tsx
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

<div className="h-64 w-full">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
        {data.map((entry, i) => (
          <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
</div>
```

Parent **must** have explicit height — `ResponsiveContainer` needs it.

## Data shape

Normalize before passing to Recharts:

```ts
interface ChartSlice {
  name: string;
  value: number;
  percent?: number;
}

function toChartData(items: { label: string; amount: number }[]): ChartSlice[] {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return items
    .filter((i) => i.amount > 0)
    .map((i) => ({
      name: i.label,
      value: i.amount,
      percent: total > 0 ? (i.amount / total) * 100 : 0,
    }));
}
```

## Custom tooltip

```tsx
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: ChartSlice }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p>{formatMoney(value)} ({percent?.toFixed(1)}%)</p>
    </div>
  );
}
```

## Color palette

Define once, reuse across charts:

```ts
export const CHART_COLORS = [
  "#1e3a5f", "#2563eb", "#0d9488", "#d97706", "#7c3aed", "#64748b",
];
```

Match brand tokens from Tailwind `@theme`.

## Bar / line charts

```tsx
<BarChart data={monthlyData}>
  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
  <YAxis tickFormatter={(v) => formatCompact(v)} width={60} />
  <Bar dataKey="amount" fill="var(--color-brand-700)" radius={[4, 4, 0, 0]} />
</BarChart>
```

Format Y-axis for large numbers (K, L, M).

## Empty states

Don't render an empty chart — show placeholder:

```tsx
{data.length === 0 ? (
  <p className="text-sm text-muted-foreground">No data yet</p>
) : (
  <ResponsiveContainer>...</ResponsiveContainer>
)}
```

## Export compatibility

Recharts renders SVG — works with `html-to-image` capture. Tips:

- Avoid CSS `filter` on chart containers during export
- Set `[data-export="true"]` overrides if legend overlaps
- Test capture at 2× pixel ratio

## Performance

- Memoize `data` with `useMemo` when derived from store
- Keep slice count reasonable (< 12); group remainder as "Other"
- Don't animate on first render if it causes export flicker (`isAnimationActive={false}` for exports)

## Accessibility

Charts fail WCAG 1.1.1 if values are visual-only. Add **sr-only data table**:

```tsx
<table className="sr-only">
  <caption>Allocation breakdown</caption>
  <thead><tr><th scope="col">Category</th><th scope="col">Share</th></tr></thead>
  <tbody>{data.map(d => (
    <tr key={d.name}><td>{d.name}</td><td>{formatValue(d.value)} ({d.percent}%)</td></tr>
  ))}</tbody>
</table>
<div className="h-64 w-full" aria-hidden="true">
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

Also provide visible legend; ensure tooltip isn't the only access path. See `web-accessibility-wcag`.

## Anti-patterns

- Putting business logic inside tooltip components
- Using Recharts for single static numbers (use typography instead)
- Missing height on parent → collapsed invisible chart
