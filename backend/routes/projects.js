const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Helper: check if user is member of project
async function isMember(projectId, userId) {
  const r = await db.query(
    'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
    [projectId, userId]
  );
  return r.rows.length > 0;
}

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'Admin') {
      query = `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='Done') as done_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id=p.id) as member_count
        FROM projects p LEFT JOIN users u ON u.id=p.created_by ORDER BY p.created_at DESC`;
      params = [];
    } else {
      query = `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id AND t.status='Done') as done_count,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id=p.id) as member_count
        FROM projects p
        JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=$1
        LEFT JOIN users u ON u.id=p.created_by
        ORDER BY p.created_at DESC`;
      params = [req.user.id];
    }
    const result = await db.query(query, params);

    // Attach members list to each project
    for (const proj of result.rows) {
      const mems = await db.query(
        `SELECT u.id, u.name, u.email, u.role FROM users u
         JOIN project_members pm ON pm.user_id=u.id WHERE pm.project_id=$1`,
        [proj.id]
      );
      proj.members = mems.rows;
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects  (Admin only)
router.post('/', auth, adminOnly, [
  body('name').trim().notEmpty(),
  body('memberIds').isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, memberIds = [] } = req.body;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const p = await client.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name, description || null, req.user.id]
    );
    const pid = p.rows[0].id;
    const allIds = [...new Set([req.user.id, ...memberIds])];
    for (const uid of allIds) {
      await client.query('INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [pid, uid]);
    }
    await client.query('COMMIT');

    const proj = p.rows[0];
    const mems = await db.query(
      `SELECT u.id, u.name, u.email, u.role FROM users u JOIN project_members pm ON pm.user_id=u.id WHERE pm.project_id=$1`,
      [pid]
    );
    proj.members = mems.rows;
    res.status(201).json(proj);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && !(await isMember(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const result = await db.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    const proj = result.rows[0];
    const mems = await db.query(
      `SELECT u.id, u.name, u.email, u.role FROM users u JOIN project_members pm ON pm.user_id=u.id WHERE pm.project_id=$1`,
      [proj.id]
    );
    proj.members = mems.rows;
    res.json(proj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id  (Admin only)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  const { name, description, memberIds } = req.body;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description) WHERE id=$3 RETURNING *',
      [name || null, description !== undefined ? description : null, req.params.id]
    );
    if (!result.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    if (Array.isArray(memberIds)) {
      await client.query('DELETE FROM project_members WHERE project_id=$1', [req.params.id]);
      const allIds = [...new Set([req.user.id, ...memberIds])];
      for (const uid of allIds) {
        await client.query('INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
      }
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/projects/:id  (Admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  const result = await db.query('DELETE FROM projects WHERE id=$1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Project deleted' });
});

module.exports = router;
