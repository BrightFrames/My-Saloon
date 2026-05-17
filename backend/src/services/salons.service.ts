import { query } from '../config/db';
import { ApiError } from '../exceptions/ApiError';

export class SalonsService {
  /**
   * Retrieves a list of salons from the Postgres DB
   */
  public async findAllSalons(
    limit: number = 20,
    city?: string,
    lat?: number,
    lon?: number,
    radiusKm: number = 10,
  ) {
    try {
      // If latitude and longitude are provided, compute distance using Haversine
      if (typeof lat === 'number' && typeof lon === 'number') {
        const haversine = `(
          6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2))
            + sin(radians($1)) * sin(radians(latitude))
          )
        )`;

        const sql = `SELECT *, ${haversine} AS distance_km FROM salons WHERE ${haversine} <= $3 ORDER BY distance_km ASC LIMIT $4`;
        const res = await query(sql, [lat, lon, radiusKm, limit]);
        return res.rows;
      }

      if (city) {
        const res = await query('SELECT * FROM salons WHERE city ILIKE $1 LIMIT $2', [`%${city}%`, limit]);
        return res.rows;
      }

      const res = await query('SELECT * FROM salons LIMIT $1', [limit]);
      return res.rows;
    } catch (err: any) {
      throw ApiError.internal(`Failed to fetch salons: ${err.message}`, 'DB_FETCH_ERROR');
    }
  }

  /**
   * Retrieves a specific salon by ID (plus services and reviews)
   */
  public async findSalonById(id: string) {
    try {
      const salonRes = await query('SELECT * FROM salons WHERE id = $1', [id]);
      if (salonRes.rowCount === 0) {
        throw ApiError.notFound(`Salon with ID ${id} not found`, 'SALON_NOT_FOUND');
      }
      const salon = salonRes.rows[0];

      const servicesRes = await query('SELECT * FROM services WHERE salon_id = $1', [id]);
      const reviewsRes = await query('SELECT * FROM reviews WHERE salon_id = $1', [id]);

      return {
        ...salon,
        services: servicesRes.rows || [],
        reviews: reviewsRes.rows || [],
      };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal(`Failed to fetch salon: ${err.message}`, 'DB_FETCH_ERROR');
    }
  }
}
