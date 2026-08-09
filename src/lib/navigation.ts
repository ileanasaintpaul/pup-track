const TAB_ROOTS = ['health', 'training', 'map', 'coach'];

export function parentPath(pathname: string, dogId: string): string | null {
  const base = `/dog/${dogId}`;
  if (!pathname.startsWith(base)) return null;

  const rest = pathname.slice(base.length).replace(/^\/|\/$/g, '');
  if (rest === '') return null;

  const segments = rest.split('/');
  if (segments.length === 1 && TAB_ROOTS.includes(segments[0])) return null;

  return segments.length === 1 ? base : `${base}/${segments.slice(0, -1).join('/')}`;
}
