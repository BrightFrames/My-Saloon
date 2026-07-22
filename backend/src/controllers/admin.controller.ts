import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

// ─── Dashboard Stats ─────────────────────────────────────────
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const bookingsResult = await query(
      `SELECT COUNT(*) as total_bookings, 
            COALESCE(SUM(total_price) FILTER (WHERE booking_status != 'cancelled'), 0) as total_revenue 
     FROM public.bookings 
     WHERE salon_id = $1 OR salon_id IS NULL`,
      [salon_id],
    );

    const todayResult = await query(
      `SELECT COUNT(*) as today_appointments 
     FROM public.bookings 
     WHERE (salon_id = $1 OR salon_id IS NULL) AND appointment_date = CURRENT_DATE`,
      [salon_id],
    );

    const pendingResult = await query(
      `SELECT COUNT(*) as pending_bookings 
     FROM public.bookings 
     WHERE (salon_id = $1 OR salon_id IS NULL) AND booking_status = 'confirmed' AND appointment_date >= CURRENT_DATE`,
      [salon_id],
    );

    const stats = bookingsResult.rows[0];
    const today = todayResult.rows[0];
    const pending = pendingResult.rows[0];

    res.json({
      success: true,
      data: {
        total_bookings: parseInt(stats.total_bookings, 10),
        total_revenue: parseFloat(stats.total_revenue),
        today_appointments: parseInt(today.today_appointments, 10),
        pending_bookings: parseInt(pending.pending_bookings, 10),
      },
    });
  },
);

// ─── Services ────────────────────────────────────────────────
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res
      .status(403)
      .json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    "SELECT * FROM public.services WHERE salon_id = $1 ORDER BY name ASC",
    [salon_id],
  );

  const mappedData = result.rows.map((row: any) => ({
    ...row,
    originalPrice: row.original_price ?? row.price,
    discountedPrice: row.discounted_price ?? row.price,
    homeServiceAvailable: row.home_service_available ?? false,
    homeServicePrice: row.home_service_price ?? null,
  }));

  res.json({ success: true, data: mappedData });
});

  export const createService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { name, price, originalPrice, discountedPrice, duration, homeServiceAvailable, homeServicePrice } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const finalOriginalPrice = originalPrice !== undefined ? originalPrice : price;
    const finalDiscountedPrice = discountedPrice !== undefined ? discountedPrice : price;
    const finalPrice = finalDiscountedPrice !== undefined ? finalDiscountedPrice : price;

    if (!name || finalPrice === undefined || !duration) {
      res
        .status(400)
        .json({ message: "Name, price, and duration are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.services (salon_id, name, price, original_price, discounted_price, duration, home_service_available, home_service_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [salon_id, name, finalPrice, finalOriginalPrice, finalDiscountedPrice, duration, homeServiceAvailable || false, homeServicePrice || null],
    );

    const row = result.rows[0];
    const mappedRow = {
      ...row,
      originalPrice: row.original_price ?? row.price,
      discountedPrice: row.discounted_price ?? row.price,
      homeServiceAvailable: row.home_service_available ?? false,
      homeServicePrice: row.home_service_price ?? null,
    };

    res.status(201).json({ success: true, data: mappedRow });
  },
);

  export const updateService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;
    const { name, price, originalPrice, discountedPrice, duration, homeServiceAvailable, homeServicePrice } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    // Ensure service belongs to this salon
    const checkResult = await query(
      "SELECT salon_id FROM public.services WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res
        .status(403)
        .json({ message: "Forbidden: Service belongs to another salon" });
      return;
    }

    const finalOriginalPrice = originalPrice !== undefined ? originalPrice : price;
    const finalDiscountedPrice = discountedPrice !== undefined ? discountedPrice : price;
    const finalPrice = finalDiscountedPrice !== undefined ? finalDiscountedPrice : price;

    const result = await query(
      "UPDATE public.services SET name = $1, price = $2, original_price = $3, discounted_price = $4, duration = $5, home_service_available = $6, home_service_price = $7 WHERE id = $8 RETURNING *",
      [name, finalPrice, finalOriginalPrice, finalDiscountedPrice, duration, homeServiceAvailable !== undefined ? homeServiceAvailable : false, homeServicePrice || null, id],
    );

    const row = result.rows[0];
    const mappedRow = {
      ...row,
      originalPrice: row.original_price ?? row.price,
      discountedPrice: row.discounted_price ?? row.price,
      homeServiceAvailable: row.home_service_available ?? false,
      homeServicePrice: row.home_service_price ?? null,
    };

    res.json({ success: true, data: mappedRow });
  },
);

export const deleteService = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.services WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res
        .status(403)
        .json({ message: "Forbidden: Service belongs to another salon" });
      return;
    }

    await query("DELETE FROM public.services WHERE id = $1", [id]);
    res.json({ success: true, message: "Service deleted" });
  },
);

// ─── Team ────────────────────────────────────────────────────
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const { salon_id } = (req as any).user;

  if (!salon_id) {
    res
      .status(403)
      .json({ message: "Salon ID missing from authenticated user." });
    return;
  }

  const result = await query(
    "SELECT * FROM public.team_members WHERE salon_id = $1 ORDER BY name ASC",
    [salon_id],
  );

  res.json({ success: true, data: result.rows });
});

export const createTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { name, role, experience, image_url, availability, service_ids } =
      req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    if (!name || !role) {
      res.status(400).json({ message: "Name and role are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.team_members (salon_id, name, role, experience, image_url, availability, service_ids) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        salon_id,
        name,
        role,
        experience,
        image_url,
        availability ? JSON.stringify(availability) : null,
        Array.isArray(service_ids) ? service_ids : [],
      ],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  },
);

export const updateTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;
    const { name, role, experience, image_url, availability, service_ids } =
      req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.team_members WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Team member not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = await query(
      "UPDATE public.team_members SET name = $1, role = $2, experience = $3, image_url = $4, availability = $5, service_ids = $6 WHERE id = $7 RETURNING *",
      [
        name,
        role,
        experience,
        image_url,
        availability ? JSON.stringify(availability) : null,
        Array.isArray(service_ids) ? service_ids : [],
        id,
      ],
    );

    res.json({ success: true, data: result.rows[0] });
  },
);

export const deleteTeamMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const { id } = req.params;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const checkResult = await query(
      "SELECT salon_id FROM public.team_members WHERE id = $1",
      [id],
    );
    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: "Team member not found" });
      return;
    }
    if (checkResult.rows[0].salon_id !== salon_id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await query("DELETE FROM public.team_members WHERE id = $1", [id]);
    res.json({ success: true, message: "Team member deleted" });
  },
);

// ─── Salon Profile ───────────────────────────────────────────
export const getSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    const result = await query("SELECT * FROM public.salons WHERE id = $1", [
      salon_id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  },
);

export const createSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id: userId } = user || {};

    const {
      name,
      city,
      starting_price,
      rating,
      latitude,
      longitude,
      address,
      state,
      country,
      phone,
      email,
      google_maps_link,
      image,
    } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !city || starting_price === undefined) {
      res
        .status(400)
        .json({ message: "Name, city, and starting_price are required." });
      return;
    }

    const insertResult = await query(
      "INSERT INTO public.salons (name, address, city, state, country, image, starting_price, rating, latitude, longitude, phone, email, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
      ],
    );

    const newSalon = insertResult.rows[0];

    await query("UPDATE public.users SET salon_id = $1 WHERE id = $2", [
      newSalon.id,
      userId,
    ]);

    res.status(201).json({ success: true, data: newSalon });
  },
);

export const updateSalonProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { salon_id } = (req as any).user;
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
      video,
      home_service_charge,
      about,
      gallery,
    } = req.body;

    if (!salon_id) {
      res
        .status(403)
        .json({ message: "Salon ID missing from authenticated user." });
      return;
    }

    // Fetch current salon data to preserve video/image if undefined in request body
    const existingSalonRes = await query("SELECT video, image FROM public.salons WHERE id = $1", [salon_id]);
    const existingVideo = existingSalonRes.rows[0]?.video || null;
    const existingImage = existingSalonRes.rows[0]?.image || null;
    const finalVideo = video !== undefined ? (video || null) : existingVideo;
    const finalImage = image !== undefined ? (image || null) : existingImage;

    const result = await query(
      "UPDATE public.salons SET name = $1, address = $2, city = $3, state = $4, country = $5, starting_price = $6, rating = $7, latitude = $8, longitude = $9, phone = $10, email = $11, google_maps_link = $12, image = $13, video = $14, home_service_charge = $15, about = $16, gallery = $17 WHERE id = $18 RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
        finalImage,
        finalVideo,
        home_service_charge !== undefined ? home_service_charge : 0,
        about || null,
        gallery || null,
        salon_id,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  },
);

// ─── Superadmin Salon Management ─────────────────────────────
export const createSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
    } = req.body;

    if (!name || !city || starting_price === undefined) {
      res
        .status(400)
        .json({ message: "Name, city, and starting_price are required." });
      return;
    }

    const result = await query(
      "INSERT INTO public.salons (name, address, city, state, country, image, starting_price, rating, latitude, longitude, phone, email, google_maps_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
      ],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  },
);

export const updateSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      country,
      image,
      starting_price,
      rating,
      latitude,
      longitude,
      phone,
      email,
      google_maps_link,
    } = req.body;

    const result = await query(
      "UPDATE public.salons SET name = $1, address = $2, city = $3, state = $4, country = $5, image = $6, starting_price = $7, rating = $8, latitude = $9, longitude = $10, phone = $11, email = $12, google_maps_link = $13 WHERE id = $14 RETURNING *",
      [
        name,
        address || null,
        city,
        state || null,
        country || null,
        image ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
        starting_price,
        rating ?? null,
        latitude ?? null,
        longitude ?? null,
        phone || null,
        email || null,
        google_maps_link || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  },
);

export const deleteSuperAdminSalon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM public.salons WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salon not found" });
      return;
    }
    res.json({ success: true, message: "Salon deleted successfully" });
  },
);
