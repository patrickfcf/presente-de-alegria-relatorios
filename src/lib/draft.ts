import type { ReportInput } from "../../shared/report";
const PREFIX = "pda:draft:v1:";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
// Never persist the professional's name, CPF, signature or uploaded originals.
export function saveDraft(userId: string, form: ReportInput, id: string) {
  try {
    const {
      cell_id,
      visit_date,
      start_time,
      end_time,
      beneficiaries,
      companions,
      local_team,
      estimates,
    } = form;
    localStorage.setItem(
      PREFIX + userId,
      JSON.stringify({
        savedAt: Date.now(),
        id,
        form: {
          cell_id,
          visit_date,
          start_time,
          end_time,
          beneficiaries,
          companions,
          local_team,
          estimates,
        },
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function readDraft(
  userId: string,
): { id: string; form: Partial<ReportInput> } | null {
  try {
    const value = localStorage.getItem(PREFIX + userId);
    if (!value) return null;
    const draft = JSON.parse(value);
    if (Date.now() - draft.savedAt > MAX_AGE) {
      clearDraft(userId);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
export function clearDraft(userId: string) {
  try {
    localStorage.removeItem(PREFIX + userId);
  } catch {
    /* unavailable storage */
  }
}
export function clearAllDrafts() {
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  } catch {
    /* unavailable storage */
  }
}
