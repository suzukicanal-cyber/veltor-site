"use client";
import { useId, useMemo, useRef, useState } from "react";

export type Opt = { value: string; label: string; group?: string; brand?: string };

/** Letters and digits only, lower case: "S 1000 RR" ≈ "s1000rr", "Harley-Davidson" ≈ "harleydavidson". */
export const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/g, "");

/** Text field with a dropdown: type any name or pick one from the list. */
export default function Combo({ id, label, value, onChange, onPick, options, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; onPick?: (o: Opt) => void; options: Opt[]; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const lid = useId();

  const shown = useMemo(() => {
    const q = norm(value);
    if (!q || options.some((o) => o.label === value)) return options;
    return options.filter((o) => norm(o.label).includes(q) || (o.group && norm(o.group + o.label).includes(q)));
  }, [value, options]);

  const pick = (o: Opt) => { onChange(o.label); onPick?.(o); setOpen(false); setAct(-1); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && open && act >= 0 && shown[act]) { e.preventDefault(); pick(shown[act]); }
    else if (e.key === "Escape") { setOpen(false); setAct(-1); }
  };

  let lastGroup = "";
  return (
    <div className="cat-f">
      <label htmlFor={id}>{label}</label>
      <div className={"combo" + (open ? " is-open" : "")}>
        <input
          ref={input} id={id} type="text" autoComplete="off" spellCheck={false} placeholder={placeholder} value={value}
          role="combobox" aria-expanded={open} aria-controls={lid} aria-autocomplete="list"
          aria-activedescendant={open && act >= 0 ? `${lid}-${act}` : undefined}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setAct(-1); }}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey}
        />
        {value
          ? <button type="button" className="combo-x" aria-label={`Очистить: ${label}`} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(""); onPick?.({ value: "", label: "" }); input.current?.focus(); }}>×</button>
          : <button type="button" className="combo-v" aria-label={`Показать список: ${label}`} tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => { setOpen(!open); input.current?.focus(); }}></button>}
        {open && shown.length > 0 && (
          <ul className="combo-list" id={lid} role="listbox" aria-label={label}>
            {shown.map((o, i) => {
              const head = o.group && o.group !== lastGroup ? (lastGroup = o.group) : null;
              return [
                head ? <li key={"g" + head} className="combo-g" role="presentation">{head}</li> : null,
                <li
                  key={o.value} id={`${lid}-${i}`} role="option" aria-selected={i === act}
                  className={"combo-o" + (i === act ? " is-act" : "") + (o.label === value ? " is-sel" : "")}
                  onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setAct(i)} onClick={() => pick(o)}
                >{o.label}</li>,
              ];
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
