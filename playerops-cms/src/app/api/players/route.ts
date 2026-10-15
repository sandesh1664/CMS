import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";


const DAY_MS = 24 * 60 * 60 * 1000;

function getActivityStatus(lastPlayedAt: Date | null, now: Date) {
  if (!lastPlayedAt) return "UNKNOWN";

  const elapsed = now.getTime() - lastPlayedAt.getTime();

  if (elapsed < 2 * DAY_MS) return "ACTIVE";
  if (elapsed < 3 * DAY_MS) return "AT_RISK";
  return "FOLLOW_UP_DUE";
}

export async function GET(request: Request) {
  // This endpoint depends on the incoming request and its authenticated session.
  const requestUrl = new URL(request.url);
  void requestUrl;
  try {
    const session = await auth();
    const staffId = session?.user?.id;

    if (!staffId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // Always verify current staff permissions in PostgreSQL.
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, isActive: true },
    });

    if (!staff || !staff.isActive) {
      return NextResponse.json(
        { error: "Your staff account is inactive or unavailable." },
        { status: 403 }
      );
    }

    const players = await prisma.player.findMany({
      where: staff.role === "ADMIN"
        ? {}
        : { assignedStaffId: staff.id },
      orderBy: { registeredAt: "desc" },
      take: 200,
      select: {
        id: true,
        playerCode: true,
        fullName: true,
        phone: true,
        email: true,
        referredBy: true,
        referralSource: true,
        registeredAt: true,
        accountStatus: true,
        assignedStaffId: true,
        assignedShiftType: true,
        lastVerifiedPlayedAt: true,
        lastContactAt: true,
        notes: true,
        assignedStaff: {
          select: { id: true, name: true },
        },
        platformAccounts: {
          select: {
            id: true,
            username: true,
            externalPlayerId: true,
            status: true,
            platform: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const now = new Date();

    return NextResponse.json({
      players: players.map((player) => ({
        ...player,
        activityStatus: getActivityStatus(
          player.lastVerifiedPlayedAt,
          now
        ),
      })),
    });
  } catch (error) {
    console.error("GET /api/players failed:", error);

    return NextResponse.json(
      { error: "Unable to load players right now." },
      { status: 500 }
    );
  }
}


const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().max(maxLength).optional()
  );

const createPlayerSchema = z.object({
  playerCode: z.string().trim().min(1).max(50)
    .transform((value) => value.toUpperCase()),
  fullName: z.string().trim().min(2).max(150),
  phone: optionalText(40),
  email: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().email().max(254).optional()
  ),
  referredBy: optionalText(150),
  referralSource: optionalText(100),
  accountStatus: z.enum([
    "ACTIVE", "INACTIVE", "SUSPENDED", "CLOSED", "UNKNOWN",
  ]).optional(),
  assignedStaffId: optionalText(100),
  assignedShiftType: z.enum([
    "MORNING", "AFTERNOON_EVENING", "NIGHT",
  ]).optional(),
  notes: optionalText(2000),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const staffId = session?.user?.id;

    if (!staffId) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const currentStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, isActive: true },
    });

    if (!currentStaff || !currentStaff.isActive) {
      return NextResponse.json(
        { error: "Your staff account is inactive or unavailable." },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please correct the submitted player details.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Staff can only assign registrations to themselves.
    // Only admins may select another staff member.
    let assignedStaffId: string | null =
      currentStaff.role === "ADMIN"
        ? data.assignedStaffId ?? null
        : currentStaff.id;

    if (assignedStaffId) {
      const assignee = await prisma.staff.findUnique({
        where: { id: assignedStaffId },
        select: { id: true, isActive: true },
      });

      if (!assignee || !assignee.isActive) {
        return NextResponse.json(
          { error: "The selected staff member is unavailable." },
          { status: 400 }
        );
      }
    }

    const player = await prisma.player.create({
      data: {
        playerCode: data.playerCode,
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        referredBy: data.referredBy ?? null,
        referralSource: data.referralSource ?? null,
        accountStatus: data.accountStatus ?? "UNKNOWN",
        assignedStaffId,
        assignedShiftType: data.assignedShiftType ?? null,
        notes: data.notes ?? null,
        // Intentionally do not set lastVerifiedPlayedAt during registration.
      },
      select: {
        id: true,
        playerCode: true,
        fullName: true,
        phone: true,
        email: true,
        referredBy: true,
        referralSource: true,
        registeredAt: true,
        accountStatus: true,
        assignedStaffId: true,
        assignedShiftType: true,
        lastVerifiedPlayedAt: true,
        lastContactAt: true,
        notes: true,
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That player code already exists. Use a unique code." },
        { status: 409 }
      );
    }

    console.error("POST /api/players failed:", error);
    return NextResponse.json(
      { error: "Unable to register the player right now." },
      { status: 500 }
    );
  }
}
