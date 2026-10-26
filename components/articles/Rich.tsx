import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/** Text with **bold** and [links](/path) — the only markup allowed in articles. */
export default function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[3].startsWith("/")) out.push(<Link key={i++} href={m[3]}>{m[2]}</Link>);
    else if (/^https:\/\//.test(m[3])) out.push(<a key={i++} href={m[3]} target="_blank" rel="noopener nofollow">{m[2]}</a>);
    else out.push(<Fragment key={i++}>{m[2]}</Fragment>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
