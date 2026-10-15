import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CallOutcome, FollowUpStatus, FollowUpType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCallSchema = z.object({
  playerCode: z.string().trim().min(1).max(50),
  outcome: z.nativeEnum(CallOutcome),
  notes: z.string().trim().max(2000).optional(),
  nextFollowUpAt: z.string().optional(),
});

async function getActiveStaff() {
  const session = await auth();
  const staffId = session?.user?.id;

  if (!staffId) return null;

  return prisma.staff.findFirst({
    where: { id: staffId, isActive: true },
    select: { id: true, role: true },
  });
}

export async function GET(request: Request) {
  try {
    const staff = await getActiveStaff();

    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const playerCode = url.searchParams.get("playerCode");

    const player = playerCode
      ? await prisma.player.findUnique({
          where: { playerCode },
          select: { id: true, assignedStaffId: true },
        })
      : null;

    if (playerCode && !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (
      player &&
      staff.role !== "ADMIN" &&
      player.assignedStaffId !== staff.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const callLogs = await prisma.callLog.findMany({
      where: {
        ...(player ? { playerId: player.id } : {}),
        ...(staff.role === "ADMIN"
          ? {}
          : { player: { assignedStaffId: staff.id } }),
      },
      orderBy: { calledAt: "desc" },
      take: 100,
      include: {
        player: {
          select: { playerCode: true, fullName: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ callLogs });
  } catch (error) {
    console.error("GET /api/call-logs failed:", error);
    return NextResponse.json(
      { error: "Unable to load call logs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const staff = await getActiveStaff();

    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid call details", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { playerCode, outcome, notes, nextFollowUpAt } = parsed.data;

    let followUpDate: Date | undefined;

    if (nextFollowUpAt) {
      followUpDate = new Date(nextFollowUpAt);

      if (Number.isNaN(followUpDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid follow-up date" },
          { status: 400 },
        );
      }
    }

    const player = await prisma.player.findUnique({
      where: { playerCode },
      select: {
        id: true,
        playerCode: true,
        fullName: true,
        assignedStaffId: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (
      staff.role !== "ADMIN" &&
      player.assignedStaffId !== staff.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const callLog = await tx.callLog.create({
        data: {
          playerId: player.id,
          staffId: staff.id,
          outcome,
          notes: notes || null,
          ...(followUpDate ? { nextFollowUpAt: followUpDate } : {}),
        },
        include: {
          player: {
            select: { playerCode: true, fullName: true },
          },
          staff: {
            select: { id: true, name: true },
          },
        },
      });

      if (followUpDate) {
        await tx.followUpTask.create({
          data: {
            playerId: player.id,
            assignedStaffId: player.assignedStaffId ?? staff.id,
            type: FollowUpType.CALLBACK,
            status: FollowUpStatus.OPEN,
            dueAt: followUpDate,
            notes: `Callback requested after call (${outcome}).${
              notes ? ` ${notes}` : ""
            }`,
          },
        });
      }

      return callLog;
    });

    return NextResponse.json({ callLog: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/call-logs failed:", error);
    return NextResponse.json(
      { error: "Unable to save call log" },
      { status: 500 },
    );
  }
}
