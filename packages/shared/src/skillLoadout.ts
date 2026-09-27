/** Serialize skill id lists for Colyseus Player string fields. */

const SEP = ",";

export function parseSkillIds(csv: string): string[] {
  if (!csv || !csv.trim()) return [];
  return csv.split(SEP).map((s) => s.trim()).filter(Boolean);
}

export function formatSkillIds(ids: readonly string[]): string {
  return ids.filter(Boolean).join(SEP);
}
