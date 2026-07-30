import { query } from "./config/db";

async function main() {
  try {
    const res = await query(
      `SELECT id, customer_name, total_price, booking_status, booking_date, appointment_date, created_at
       FROM public.bookings 
       WHERE salon_id = '60bdc3ff-c30a-48cb-adc6-38eb346527b3'
       ORDER BY created_at DESC LIMIT 15`
    );
    console.log("=== ALL RECENT BOOKINGS FOR THIS SALON ===");
    res.rows.forEach(r => {
      console.log({
        id: r.id,
        name: r.customer_name,
        price: r.total_price,
        status: r.booking_status,
        b_date: r.booking_date,
        a_date: r.appointment_date,
        c_at: r.created_at
      });
    });

    const todayStats = await query(
      `SELECT 
        COUNT(*) as cnt,
        SUM(total_price) as sum_price,
        ARRAY_AGG(total_price) as prices
       FROM public.bookings
       WHERE salon_id = '60bdc3ff-c30a-48cb-adc6-38eb346527b3'
         AND (
           DATE(created_at) = CURRENT_DATE
           OR DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
           OR DATE(appointment_date) = CURRENT_DATE
           OR DATE(appointment_date AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
           OR DATE(booking_date) = CURRENT_DATE
         )`
    );
    console.log("=== TODAY STATS QUERY ===");
    console.log(todayStats.rows);

  } catch (err) {
    console.error("DB Error:", err);
  }
}

main();
