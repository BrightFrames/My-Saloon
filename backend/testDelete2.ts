import { query } from './src/config/db';

async function testDelete() {
  const id = 'f780d07e-921a-449a-b66d-58957edf5b90'; // Test Salon
  try {
    const cascadeQueries = [
      "DELETE FROM notifications WHERE salon_id = $1",
      "DELETE FROM bookings WHERE salon_id = $1",
      "DELETE FROM users WHERE salon_id = $1",
      "DELETE FROM reviews WHERE salon_id = $1",
      "DELETE FROM team_members WHERE salon_id = $1",
      "DELETE FROM services WHERE salon_id = $1"
    ];

    for (const q of cascadeQueries) {
      try {
        console.log("Running:", q);
        await query(q, [id]);
        console.log("Success:", q);
      } catch (err: any) {
        console.warn(`Warning: Cascade delete query failed (${q}) - ${err.message}`);
      }
    }

    const result = await query(
      "DELETE FROM salons WHERE id = $1 RETURNING *",
      [id]
    );

    console.log("Deleted salon:", result.rowCount);
  } catch (err) {
    console.error("Error deleting salon:", err);
  } finally {
    process.exit(0);
  }
}

testDelete();
