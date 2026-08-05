import type { Role } from "@/domain/enums/role";
import { NoteVisibility } from "@/domain/enums/member";
import { Permission, roleHasPermission } from "@/domain/permissions/rbac";

export function noteVisibilitiesForRole(role: Role): NoteVisibility[] {
  const allowed: NoteVisibility[] = [];
  if (roleHasPermission(role, Permission.PEOPLE_NOTES_PRIVATE)) {
    allowed.push(NoteVisibility.PRIVATE);
  }
  if (roleHasPermission(role, Permission.PEOPLE_NOTES_PASTORAL)) {
    allowed.push(NoteVisibility.PASTORAL);
  }
  if (roleHasPermission(role, Permission.PEOPLE_NOTES_LEADER)) {
    allowed.push(NoteVisibility.LEADER);
  }
  return allowed;
}

export function canReadNoteVisibility(
  role: Role,
  visibility: NoteVisibility
): boolean {
  return noteVisibilitiesForRole(role).includes(visibility);
}

export function canWriteNoteVisibility(
  role: Role,
  visibility: NoteVisibility
): boolean {
  // Authors may write notes only at visibilities they can also read.
  return canReadNoteVisibility(role, visibility);
}
