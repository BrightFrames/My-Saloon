import { query, pool } from "../src/config/db";

const TEST_CUSTOMER_EMAIL = "pokhriyalhimanshu09@gmail.com";
const TEST_CUSTOMER_NAME = "Test Customer";

async function removeTestCustomerBooking() {
  try {
    const matchingBookings = await query(
      `
        SELECT id, salon_id, customer_name, customer_email
        FROM public.bookings
        WHERE customer_email = $1
           OR customer_name = $2
      `,
      [TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_NAME],
    );

    if (matchingBookings.rowCount === 0) {
      console.log("No test customer bookings found.");
      return;
    }

    const bookingIds = matchingBookings.rows.map((row) => row.id);

    await query(
      `DELETE FROM public.reviews WHERE booking_id = ANY($1::uuid[])`,
      [bookingIds],
    );

    const deleteResult = await query(
      `
        DELETE FROM public.bookings
        WHERE customer_email = $1
           OR customer_name = $2
        RETURNING id, salon_id
      `,
      [TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_NAME],
    );

    const salonIds = [...new Set(deleteResult.rows.map((row) => row.salon_id).filter(Boolean))];

    console.log(
      `Removed ${deleteResult.rowCount} booking(s) for the test customer across ${salonIds.length} salon(s).`,
    );
  } catch (err: any) {
    console.error("Failed to remove test customer booking:", err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

removeTestCustomerBooking();
