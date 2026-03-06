interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  title?: string;        // label shown above hours in center (e.g. "本月" / "上月")
  showLegend?: boolean;
}

export function DonutChart({ segments, size = 200, title, showLegend = true }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const strokeWidth = size * 0.18;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        {/* Segments */}
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const segOffset = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-segOffset + circumference * 0.25}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
        {/* Center */}
        {title && (
          <text x={cx} y={cy - size * 0.17} textAnchor="middle" fontSize={size * 0.07} fill="#94a3b8">
            {title}
          </text>
        )}
        <text x={cx} y={cy + (title ? size * 0.02 : -size * 0.04)} textAnchor="middle"
          fontSize={size * 0.13} fontWeight="700" fill="#0f172a">
          {(total / 60).toFixed(1)}
        </text>
        <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontSize={size * 0.07} fill="#64748b">
          小时
        </text>
      </svg>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span>{seg.label}</span>
              <span className="text-slate-400">({(seg.value / total * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
