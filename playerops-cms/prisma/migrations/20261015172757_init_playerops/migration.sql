-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON_EVENING', 'NIGHT');

-- CreateEnum
CREATE TYPE "PlayerAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('STAFF_VERIFIED');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'REQUESTED_CALLBACK', 'ISSUE_REPORTED', 'CONTACT_DECLINED', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('INACTIVITY', 'CALLBACK', 'ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "playerCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "referredBy" TEXT,
    "referralSource" TEXT,
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountStatus" "PlayerAccountStatus" NOT NULL DEFAULT 'UNKNOWN',
    "assignedStaffId" TEXT,
    "assignedShiftType" "ShiftType",
    "lastVerifiedPlayedAt" TIMESTAMPTZ(3),
    "lastContactAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPlatformAccount" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "externalPlayerId" TEXT,
    "status" "PlayerAccountStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PlayerPlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerActivity" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "playedAt" TIMESTAMPTZ(3) NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "ActivitySource" NOT NULL DEFAULT 'STAFF_VERIFIED',
    "notes" TEXT,

    CONSTRAINT "PlayerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "calledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "CallOutcome" NOT NULL,
    "notes" TEXT,
    "nextFollowUpAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpTask" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "type" "FollowUpType" NOT NULL DEFAULT 'INACTIVITY',
    "status" "FollowUpStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "FollowUpTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "authorStaffId" TEXT NOT NULL,
    "recipientStaffId" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_playerCode_key" ON "Player"("playerCode");

-- CreateIndex
CREATE INDEX "Player_assignedStaffId_idx" ON "Player"("assignedStaffId");

-- CreateIndex
CREATE INDEX "Player_lastVerifiedPlayedAt_idx" ON "Player"("lastVerifiedPlayedAt");

-- CreateIndex
CREATE INDEX "Player_registeredAt_idx" ON "Player"("registeredAt");

-- CreateIndex
CREATE INDEX "Player_accountStatus_idx" ON "Player"("accountStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE INDEX "PlayerPlatformAccount_playerId_idx" ON "PlayerPlatformAccount"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPlatformAccount_platformId_username_key" ON "PlayerPlatformAccount"("platformId", "username");

-- CreateIndex
CREATE INDEX "PlayerActivity_playerId_playedAt_idx" ON "PlayerActivity"("playerId", "playedAt");

-- CreateIndex
CREATE INDEX "PlayerActivity_staffId_recordedAt_idx" ON "PlayerActivity"("staffId", "recordedAt");

-- CreateIndex
CREATE INDEX "ShiftAssignment_shiftDate_shiftType_idx" ON "ShiftAssignment"("shiftDate", "shiftType");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_staffId_shiftDate_shiftType_key" ON "ShiftAssignment"("staffId", "shiftDate", "shiftType");

-- CreateIndex
CREATE INDEX "CallLog_playerId_calledAt_idx" ON "CallLog"("playerId", "calledAt");

-- CreateIndex
CREATE INDEX "CallLog_staffId_calledAt_idx" ON "CallLog"("staffId", "calledAt");

-- CreateIndex
CREATE INDEX "CallLog_nextFollowUpAt_idx" ON "CallLog"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "FollowUpTask_playerId_type_status_idx" ON "FollowUpTask"("playerId", "type", "status");

-- CreateIndex
CREATE INDEX "FollowUpTask_assignedStaffId_status_dueAt_idx" ON "FollowUpTask"("assignedStaffId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUpTask_status_dueAt_idx" ON "FollowUpTask"("status", "dueAt");

-- CreateIndex
CREATE INDEX "ShiftHandover_shiftDate_shiftType_idx" ON "ShiftHandover"("shiftDate", "shiftType");

-- CreateIndex
CREATE INDEX "ShiftHandover_authorStaffId_createdAt_idx" ON "ShiftHandover"("authorStaffId", "createdAt");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPlatformAccount" ADD CONSTRAINT "PlayerPlatformAccount_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPlatformAccount" ADD CONSTRAINT "PlayerPlatformAccount_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivity" ADD CONSTRAINT "PlayerActivity_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerActivity" ADD CONSTRAINT "PlayerActivity_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_authorStaffId_fkey" FOREIGN KEY ("authorStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHandover" ADD CONSTRAINT "ShiftHandover_recipientStaffId_fkey" FOREIGN KEY ("recipientStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
