import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { query } from "../config/db";

export const getPublicTeam = asyncHandler(
  async (req: Request, res: Response) => {
    const salonId = req.query.salon_id as string | undefined;
    const date = req.query.date as string | undefined;

    let sql = "SELECT * FROM public.team_members WHERE (is_active = true OR is_active IS NULL)";
    const params: any[] = [];
    if (salonId) {
      sql += " AND salon_id = $1";
      params.push(salonId);
    }
    sql += " ORDER BY name ASC";

    const result = await query(sql, params);
    let staffMembers = result.rows;

    if (date && staffMembers.length > 0) {
      try {
        const leaveRes = await query(
          "SELECT * FROM public.staff_leaves WHERE leave_date::text LIKE $1 || '%'",
          [date]
        );
        const leavesMap: Record<string, any[]> = {};
        for (const l of leaveRes.rows) {
          const key = l.team_member_id || l.staff_name?.toLowerCase();
          if (key) {
            if (!leavesMap[key]) leavesMap[key] = [];
            leavesMap[key].push(l);
          }
        }

        staffMembers = staffMembers.map((m) => {
          const mLeaves = leavesMap[m.id] || leavesMap[m.name?.toLowerCase()] || [];
          const isFullDayLeave = mLeaves.some((l) => l.is_full_day || l.leave_type === "full_day");
          return {
            ...m,
            leaves: mLeaves,
            isOnLeave: isFullDayLeave,
            leaveReason: isFullDayLeave ? mLeaves[0]?.reason : undefined,
          };
        });
      } catch (err) {
        console.warn("[getPublicTeam] Failed to attach leaves:", err);
      }
    }

    res.json({ success: true, data: staffMembers });
  },
);

