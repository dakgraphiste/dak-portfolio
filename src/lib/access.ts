// Qui a accès à quoi : un cours acheté seul, ou un parcours qui le contient.
import type { SupabaseClient } from '@supabase/supabase-js';
import { COURSES, TRACKS, courseBySlug, type Course, type Track } from '../data/academy';

export type Item = { kind: 'course'; slug: string; course: Course } | { kind: 'track'; slug: string; track: Track };

/** 'course:brand-identity' ou 'track:brand-designer' → l'élément du catalogue (ou null si inconnu). */
export function parseItem(raw: string | null | undefined): Item | null {
  const m = /^(course|track):([a-z0-9-]+)$/.exec(raw || '');
  if (!m) return null;
  if (m[1] === 'course') { const course = COURSES.find((c) => c.slug === m[2]); return course ? { kind: 'course', slug: m[2], course } : null; }
  const track = TRACKS.find((t) => t.slug === m[2]); return track ? { kind: 'track', slug: m[2], track } : null;
}
export const itemTitle = (it: Item) => (it.kind === 'course' ? it.course.title : `Parcours ${it.track.title}`);
export const itemPrice = (it: Item) => (it.kind === 'course' ? it.course.priceFcfa : it.track.priceFcfa) || 0;
export const itemOpen = (it: Item) => it.kind === 'course' ? it.course.status === 'ouvert' : it.track.courses.every((s) => courseBySlug(s).status === 'ouvert');

/** Slugs des cours accessibles à partir de la liste des accès de l'élève. */
export function unlockedCourses(items: string[]): Set<string> {
  const out = new Set<string>();
  for (const raw of items) {
    const it = parseItem(raw);
    if (!it) continue;
    if (it.kind === 'course') out.add(it.slug); else it.track.courses.forEach((s) => out.add(s));
  }
  return out;
}

export async function myEnrollments(sb: SupabaseClient, userId: string) {
  const { data } = await sb.from('enrollments').select('item').eq('user_id', userId);
  return (data || []).map((r) => r.item as string);
}
