const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash('password', 10);
    const memberHash = await bcrypt.hash('password', 10);

    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      ['Alex Admin', 'admin@demo.com', adminHash, 'Admin']
    );
    const memberRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      ['Morgan Lee', 'member@demo.com', memberHash, 'Member']
    );
    const samRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      ['Sam Rivera', 'sam@demo.com', memberHash, 'Member']
    );

    const adminId = adminRes.rows[0].id;
    const memberId = memberRes.rows[0].id;
    const samId = samRes.rows[0].id;

    const p1 = await client.query(
      `INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING id`,
      ['Website Redesign', 'Revamp the company website with modern design', adminId]
    );
    const p2 = await client.query(
      `INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING id`,
      ['Mobile App', 'Build iOS & Android app for customers', adminId]
    );

    const pid1 = p1.rows[0].id;
    const pid2 = p2.rows[0].id;

    for (const [pid, uid] of [[pid1,adminId],[pid1,memberId],[pid1,samId],[pid2,adminId],[pid2,memberId]]) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [pid, uid]
      );
    }

    const tasks = [
      [pid1, 'Design mockups', 'Done', memberId, 'High', '2025-05-10', adminId],
      [pid1, 'Frontend components', 'In Progress', memberId, 'High', '2025-05-20', adminId],
      [pid1, 'Backend API', 'Todo', adminId, 'Medium', '2025-05-25', adminId],
      [pid1, 'Write tests', 'Todo', samId, 'Medium', '2025-05-05', adminId],
      [pid2, 'Auth flow', 'In Progress', adminId, 'High', '2025-05-18', adminId],
      [pid2, 'Push notifications', 'Todo', memberId, 'Low', '2025-05-30', adminId],
    ];

    for (const [pid, title, status, assignee, priority, due, creator] of tasks) {
      await client.query(
        `INSERT INTO tasks (project_id, title, status, assignee_id, priority, due_date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pid, title, status, assignee, priority, due, creator]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete');
    console.log('   admin@demo.com / password');
    console.log('   member@demo.com / password');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
