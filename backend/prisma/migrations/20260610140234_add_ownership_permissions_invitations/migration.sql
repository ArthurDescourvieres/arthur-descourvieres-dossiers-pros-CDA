-- ownerId is backfilled from each workspace's OWNER member below, so this
-- migration is safe to run against a populated database.

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add ownerId nullable, backfill from each workspace's OWNER
-- member, then enforce NOT NULL — safe whether the table is empty or not.
ALTER TABLE "Workspace" ADD COLUMN     "ownerId" TEXT;

UPDATE "Workspace" w
SET "ownerId" = (
  SELECT m."userId"
  FROM "WorkspaceMember" m
  WHERE m."workspaceId" = w."id" AND m."role" = 'OWNER'
  ORDER BY m."joinedAt" ASC
  LIMIT 1
);

ALTER TABLE "Workspace" ALTER COLUMN "ownerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "noteId" TEXT,
    "folderId" TEXT,
    "level" "PermissionLevel" NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Permission_memberId_idx" ON "Permission"("memberId");

-- CreateIndex
CREATE INDEX "Permission_noteId_idx" ON "Permission"("noteId");

-- CreateIndex
CREATE INDEX "Permission_folderId_idx" ON "Permission"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_workspaceId_idx" ON "Invitation"("workspaceId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
