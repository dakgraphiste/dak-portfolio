// Supports de cours écrits (src/content/lessons/<cours>.md), découpés par leçon.
// Lus uniquement côté serveur : le texte n'est envoyé qu'aux élèves qui ont accès à la leçon.
import { marked } from 'marked';

const files = import.meta.glob('../content/lessons/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

type Notes = { lessons: Map<string, string>; project: string };
const cache = new Map<string, Notes>();

export function courseNotes(slug: string): Notes | null {
  if (cache.has(slug)) return cache.get(slug)!;
  const raw = Object.entries(files).find(([p]) => p.endsWith(`/${slug}.md`))?.[1];
  if (!raw) return null;
  const parts = raw.replace(/<!--[\s\S]*?-->/g, '').split(/^## /m).slice(1);
  const lessons = new Map<string, string>();
  let project = '';
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const head = part.slice(0, nl).trim(), body = part.slice(nl + 1);
    const key = /^(\d+-\d+) ·/.exec(head)?.[1];
    const html = marked.parse(body.replace(/^### /gm, '#### '), { async: false }) as string;
    if (key) lessons.set(key, html);
    else if (/^Projet final/i.test(head)) project = `<h3>${head.replace(/^Projet final · /, '')}</h3>` + html;
  }
  const notes = { lessons, project };
  cache.set(slug, notes);
  return notes;
}
