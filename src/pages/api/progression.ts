// Marque une leçon comme terminée (ou non) pour l'élève connecté, puis revient au lecteur
export const prerender = false;
import type { APIRoute } from 'astro';
import { currentUser } from '../../lib/supabase';
import { myEnrollments, unlockedCourses } from '../../lib/access';
import { portalReady } from '../../lib/env';
import { COURSES, allLessons } from '../../data/academy';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!portalReady()) return redirect('/espace-eleve', 303);
  const f = await request.formData();
  const course = COURSES.find((c) => c.slug === String(f.get('course')));
  if (!course) return redirect('/espace-eleve', 303);
  const keys = allLessons(course).map((l) => l.key);
  const lesson = String(f.get('lesson')), next = String(f.get('next'));
  const back = (k: string) => redirect(`/espace-eleve/cours/${course.slug}?lecon=${keys.includes(k) ? k : keys[0]}`, 303);
  const { sb, user } = await currentUser(request, cookies);
  if (!user) return redirect('/espace-eleve/connexion', 303);
  if (!keys.includes(lesson) || !unlockedCourses(await myEnrollments(sb, user.id)).has(course.slug)) return back(lesson);
  if (f.get('done') === '1') await sb.from('lesson_progress').upsert({ user_id: user.id, course: course.slug, lesson }, { onConflict: 'user_id,course,lesson' });
  else await sb.from('lesson_progress').delete().eq('user_id', user.id).eq('course', course.slug).eq('lesson', lesson);
  return back(next);
};
