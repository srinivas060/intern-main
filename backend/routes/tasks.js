const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

async function canAccessProject(projectId, userId, role) {
  if (role === 'Admin') return true;
  const r = await db.query('SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2', [projectId, userId]);
  return r.rows.length > 0;
}

const taskSelect = `
  SELECT t.*, 
    u.name as assignee_name, u.email as assignee_email,
    p.name as project_name,
    cb.name as created_by_name
  FROM tasks t
  LEFT JOIN users u ON u.id=t.assignee_id
  LEFT JOIN projects p ON p.id=t.project_id
  LEFT JOIN users cb ON cb.id=t.created_by
`;

// GET /api/tasks  — all tasks visible to user
router.get('/', auth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'Admin') {
      result = await db.query(taskSelect + ' ORDER BY t.created_at DESC');
    } else {
      result = await db.query(
        taskSelect + ` WHERE t.project_id IN (
          SELECT project_id FROM project_members WHERE user_id=$1
        ) ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/my  — tasks assigned to me
router.get('/my', auth, async (req, res) => {
  const result = await db.query(taskSelect + ' WHERE t.assignee_id=$1 ORDER BY t.due_date ASC NULLS LAST', [req.user.id]);
  res.json(result.rows);
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth, async (req, res) => {
  if (!(await canAccessProject(req.params.projectId, req.user.id, req.user.role))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const result = await db.query(taskSelect + ' WHERE t.project_id=$1 ORDER BY t.created_at DESC', [req.params.projectId]);
  res.json(result.rows);
});

// POST /api/tasks
router.post('/', auth, [
  body('title').trim().notEmpty(),
  body('projectId').isInt(),
  body('status').optional().isIn(['Todo', 'In Progress', 'Done']),
  body('priority').optional().isIn(['High', 'Medium', 'Low']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, status = 'Todo', priority = 'Medium', assigneeId, dueDate } = req.body;

  if (!(await canAccessProject(projectId, req.user.id, req.user.role))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await db.query(
      `INSERT INTO tasks (title, description, project_id, status, priority, assignee_id, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description || null, projectId, status, priority, assigneeId || null, dueDate || null, req.user.id]
    );
    const task = await db.query(taskSelect + ' WHERE t.id=$1', [result.rows[0].id]);
    res.status(201).json(task.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', auth, async (req, res) => {
  const task = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
  if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

  const t = task.rows[0];
  if (!(await canAccessProject(t.project_id, req.user.id, req.user.role))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, status, priority, assigneeId, dueDate } = req.body;
  try {
    const result = await db.query(
      `UPDATE tasks SET
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        status=COALESCE($3,status),
        priority=COALESCE($4,priority),
        assignee_id=COALESCE($5,assignee_id),
        due_date=COALESCE($6,due_date)
       WHERE id=$7 RETURNING *`,
      [title||null, description||null, status||null, priority||null, assigneeId||null, dueDate||null, req.params.id]
    );
    const updated = await db.query(taskSelect + ' WHERE t.id=$1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id  (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  const result = await db.query('DELETE FROM tasks WHERE id=$1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/dashboard  — summary stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    let where = req.user.role === 'Admin'
      ? ''
      : `WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id=${req.user.id})`;

    const stats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE true) as total,
        COUNT(*) FILTER (WHERE status='Todo') as todo,
        COUNT(*) FILTER (WHERE status='In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status='Done') as done,
        COUNT(*) FILTER (WHERE status!='Done' AND due_date < CURRENT_DATE) as overdue
      FROM tasks t ${where}
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
