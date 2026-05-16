const AV_COLORS = ['av-blue', 'av-teal', 'av-coral', 'av-purple', 'av-amber'];

export function avatarColor(name = '') {
  let i = 0;
  for (const c of name) i += c.charCodeAt(0);
  return AV_COLORS[i % AV_COLORS.length];
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function isOverdue(task) {
  if (task.status === 'Done' || !task.due_date) return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusBadgeClass(status) {
  return { Todo: 'b-todo', 'In Progress': 'b-prog', Done: 'b-done' }[status] || 'b-todo';
}

export function priorityBadgeClass(p) {
  return { High: 'b-high', Medium: 'b-med', Low: 'b-low' }[p] || 'b-med';
}
