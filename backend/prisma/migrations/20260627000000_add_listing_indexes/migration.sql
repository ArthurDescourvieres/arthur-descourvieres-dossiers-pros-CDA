-- Add covering indexes for the listing/filtering queries that previously did
-- sequential scans on these foreign keys:
--   * WorkspaceMember.workspaceId — listing a workspace's members. The existing
--     @@unique([userId, workspaceId]) is left-prefixed by userId, so Postgres
--     cannot use it for a workspaceId-only lookup.
--   * Folder.workspaceId          — listing a workspace's folders.
--   * Note.folderId               — listing a folder's notes.
--
-- Generated with `prisma migrate diff` (datamodel-to-datamodel) so the spurious
-- `DROP INDEX "Note_searchVector_idx"` / `DROP DEFAULT` that `prisma migrate dev`
-- emits for the generated tsvector column are not present (see schema.prisma).

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "Folder_workspaceId_idx" ON "Folder"("workspaceId");

-- CreateIndex
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId");
