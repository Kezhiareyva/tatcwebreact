require('dotenv').config();
const { db } = require('./lib/db.js');
async function run() {
  const pool = db();
  const where=['1=1'];
  const vals=[];
  const [rows] = await pool.query(`
    SELECT b.id, b.status, b.teaching_date, b.method, b.submitted_at, b.sync_attendance,
            i.full_name instructor_name,
            s.title session_title, s.session_date,
            bt.name batch_name, p.name program_name,
            mt.title topic_title, mt.sequence_no topic_sequence
    FROM bap b
    JOIN instructors i ON i.id = b.instructor_id
    JOIN sessions s ON s.id = b.session_id
    JOIN batches bt ON bt.id = s.batch_id
    JOIN programs p ON p.id = bt.program_id
    LEFT JOIN module_topics mt ON mt.id = b.topic_id
    WHERE ${where.join(' AND ')}
    ORDER BY b.teaching_date DESC, b.submitted_at DESC
  `, vals);
  console.log('rows:', rows);
  process.exit(0);
}
run().catch(console.error);
