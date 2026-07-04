import { query } from "../config/db";
import { ApiError } from "../exceptions/ApiError";

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
    name?: string,
    rating?: number,
    service?: string,
    maxPrice?: number,
  ) {
    try {
      const queryParams: any[] = [];
      let paramIndex = 1;

      let selectFields = "s.*";
      const fromClause = "salons s";
      const whereClauses: string[] = [];
      let orderBy = "s.rating DESC NULLS LAST, s.starting_price ASC";

      // 1. Distance / Haversine formula
      if (typeof lat === "number" && typeof lon === "number") {
        const haversine = `(
          6371 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($2))
            + sin(radians($1)) * sin(radians(s.latitude))
          )
        )`;
        queryParams.push(lat, lon);
        paramIndex += 2;

        selectFields += `, ${haversine} AS distance_km`;

        // Filter by distance/radius ONLY if no specific city or name is searched
        if (!city && !name) {
          whereClauses.push(`${haversine} <= $${paramIndex}`);
          queryParams.push(radiusKm);
          paramIndex += 1;
        }

        orderBy = "distance_km ASC, s.rating DESC NULLS LAST, s.starting_price ASC";
      }

      // 2. Filter by city, state, or address
      if (city) {
        whereClauses.push(
          `(s.city ILIKE $${paramIndex} OR s.state ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`
        );
        queryParams.push(`%${city}%`);
        paramIndex += 1;
      }

      // 3. Filter by name
      if (name) {
        whereClauses.push(`s.name ILIKE $${paramIndex}`);
        queryParams.push(`%${name}%`);
        paramIndex += 1;
      }

      // 4. Filter by minimum rating
      if (rating) {
        whereClauses.push(`s.rating >= $${paramIndex}`);
        queryParams.push(rating);
        paramIndex += 1;
      }

      // 5. Filter by price
      if (maxPrice) {
        whereClauses.push(`s.starting_price <= $${paramIndex}`);
        queryParams.push(maxPrice);
        paramIndex += 1;
      }

      // 6. Filter by service
      if (service) {
        whereClauses.push(
          `s.id IN (SELECT salon_id FROM services WHERE name ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${service}%`);
        paramIndex += 1;
      }

      // Combine SQL
      let sql = `SELECT ${selectFields} FROM ${fromClause}`;
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(" AND ")}`;
      }

      sql += ` ORDER BY ${orderBy} LIMIT $${paramIndex}`;
      queryParams.push(limit);

      const res = await query(sql, queryParams);
      return res.rows;
    } catch (err: any) {
      throw ApiError.internal(
        `Failed to fetch salons: ${err.message}`,
        "DB_FETCH_ERROR",
      );
    }
  }

  /**
   * Retrieves a specific salon by ID (plus services and reviews)
   */
  public async findSalonById(id: string) {
    try {
      const salonRes = await query("SELECT * FROM salons WHERE id = $1", [id]);
      if (salonRes.rowCount === 0) {
        throw ApiError.notFound(
          `Salon with ID ${id} not found`,
          "SALON_NOT_FOUND",
        );
      }
      const salon = salonRes.rows[0];

      const servicesRes = await query(
        "SELECT * FROM public.services WHERE salon_id = $1 ORDER BY name ASC",
        [id],
      ).catch(() => ({ rows: [] }));
      const reviewsRes = await query(
        "SELECT * FROM public.reviews WHERE salon_id = $1",
        [id],
      ).catch(() => ({ rows: [] }));

      return {
        ...salon,
        services: servicesRes.rows || [],
        reviews: reviewsRes.rows || [],
      };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal(
        `Failed to fetch salon: ${err.message}`,
        "DB_FETCH_ERROR",
      );
    }
  }

  /**
   * Create a new salon
   */
  public async createSalon(data: {
    name: string;
    city: string;
    latitude?: number;
    longitude?: number;
    starting_price?: number;
    address?: string;
    phone?: string;
    admin_email?: string;
    google_maps_link?: string;
  }) {
    try {
      const sql = `
        INSERT INTO salons (name, city, latitude, longitude, rating, starting_price, address, phone, google_maps_link, email, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const values = [
        data.name,
        data.city,
        data.latitude || null,
        data.longitude || null,
        0, // default rating
        data.starting_price || 0,
        data.address || null,
        data.phone || null,
        data.google_maps_link || null,
        data.admin_email || null,
        '', // default empty image
      ];

      const res = await query(sql, values);
      return res.rows[0];
    } catch (err: any) {
      throw ApiError.internal(
        `Failed to create salon: ${err.message}`,
        "DB_CREATE_ERROR",
      );
    }
  }

  public async getSalonById(id: string) {
    const result = await query("SELECT * FROM salons WHERE id = $1", [id]);
    return result.rows[0] || null;
  }
}
