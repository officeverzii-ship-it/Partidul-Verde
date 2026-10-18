import { ROMANIA_COUNTIES, ROMANIA_OUTLINE } from '@/data/romania-counties';

export function RomaniaMap({ active, onSelect, available }: { active: string; onSelect: (county: string) => void; available: Set<string> }) {
  return (
    <figure className="w-full max-w-4xl">
      <svg viewBox="0 0 900 620" role="group" aria-label="Harta României cu granițele județelor" className="romania-map w-full">
        {ROMANIA_COUNTIES.map(({ name, path, x, y }) => {
          const has = available.has(name);
          const sel = active === name;
          const lines = name === 'Bistrița-Năsăud' ? ['Bistrița-', 'Năsăud'] : name === 'Caraș-Severin' ? ['Caraș-', 'Severin'] : name === 'Satu Mare' ? ['Satu', 'Mare'] : [name];
          const select = () => { if (has) onSelect(sel ? '' : name); };
          return (
            <g key={name} role={has ? 'button' : undefined} tabIndex={has ? 0 : undefined}
              aria-label={has ? name : `${name} (fără filială publicată)`} aria-pressed={has ? sel : undefined}
              className={`county ${sel ? 'county-selected' : has ? 'county-available' : 'county-unavailable'}`}
              onClick={select} onKeyDown={event => { if (has && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); select(); } }}>
              <path d={path} fillRule="evenodd" className="county-shape" />
              {name === 'București' && <path d={`M${x - 65},${y - 55}L${x - 40},${y + 18}H${x - 8}`} className="county-callout" aria-hidden="true" />}
              <text x={x} y={y - (lines.length - 1) * 6 + (name === 'București' ? 18 : 0)} textAnchor="middle" dominantBaseline="middle" className="county-label">
                {lines.map((line, index) => <tspan key={line} x={x} dy={index === 0 ? 0 : 13}>{line}</tspan>)}
              </text>
            </g>
          );
        })}
        <path d={ROMANIA_OUTLINE} fillRule="evenodd" className="country-outline" aria-hidden="true" />
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-brand/25 border border-brand" />Județ cu filială publicată</span>
        <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer" className="underline">Contururi: geoBoundaries · CC BY 4.0</a>
      </figcaption>
    </figure>
  );
}
