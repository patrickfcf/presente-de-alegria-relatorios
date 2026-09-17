import type { PublicationDetails } from "./publications.ts";
export type AttendanceInput = {
  volunteer_id: string;
  status: "present" | "absent";
  justified: boolean | null;
};
export type ReportInput = {
  cell_id: string;
  visit_date: string;
  start_time: string;
  end_time: string;
  professional_name: string;
  professional_role: string;
  professional_cpf: string;
  beneficiaries: number | null;
  companions: number | null;
  local_team: number | null;
  attendance: AttendanceInput[];
  estimates: boolean;
  signature_method: "canvas" | "paper";
  accepted: boolean;
};
export const DECLARATION =
  "Declaro para os devidos fins que a visita institucional descrita acima foi devidamente realizada na data estipulada.";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function todayBR() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}
export function parseCount(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value))
    throw new Error("Informe uma quantidade inteira igual ou maior que zero.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > 1000000)
    throw new Error("Quantidade fora do limite permitido.");
  return n;
}
export function attendanceTotal(values: readonly (number | null)[]) {
  if (
    values.length !== 3 ||
    values.some(
      (n) => n !== null && (!Number.isInteger(n) || n < 0 || n > 1000000),
    )
  )
    throw new Error("Indicadores inválidos.");
  const known = values.filter((n): n is number => n !== null);
  return {
    value: known.length ? known.reduce((a, b) => a + b, 0) : null,
    complete: known.length === 3,
  };
}
export function validCpf(value: string) {
  const cpf = value.replace(/[.\-\s]/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (n: number) =>
    (([...cpf.slice(0, n)].reduce((s, d, i) => s + Number(d) * (n + 1 - i), 0) *
      10) %
      11) %
    10;
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return (
    digits.slice(0, 3) +
    (digits.length > 3 ? "." + digits.slice(3, 6) : "") +
    (digits.length > 6 ? "." + digits.slice(6, 9) : "") +
    (digits.length > 9 ? "-" + digits.slice(9) : "")
  );
}
export function validVisitTimes(a: string, b: string) {
  const valid = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  return valid(a) && valid(b) && b > a;
}
export function validateReport(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object")
    return { form: "Formulário inválido." };
  const f = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (typeof f.cell_id !== "string" || !UUID.test(f.cell_id))
    errors.cell_id = "Selecione sua célula.";
  if (
    typeof f.visit_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(f.visit_date) ||
    !Number.isFinite(Date.parse(f.visit_date)) ||
    new Date(f.visit_date).toISOString().slice(0, 10) !== f.visit_date ||
    f.visit_date > todayBR()
  )
    errors.visit_date = "Informe uma data válida, até hoje.";
  if (
    typeof f.start_time !== "string" ||
    typeof f.end_time !== "string" ||
    !validVisitTimes(f.start_time, f.end_time)
  )
    errors.end_time = "O horário final deve ser posterior ao inicial.";
  for (const key of [
    "professional_name",
    "professional_role",
    "professional_cpf",
  ])
    if (typeof f[key] !== "string") errors[key] = "Valor inválido.";
  if (
    typeof f.professional_name === "string" &&
    (f.professional_name.trim().length < 2 || f.professional_name.length > 100)
  )
    errors.professional_name =
      "Informe o nome do profissional da instituição (2 a 100 caracteres).";
  if (
    typeof f.professional_role === "string" &&
    f.professional_role.length > 100
  )
    errors.professional_role = "Use até 100 caracteres.";
  if (
    typeof f.professional_cpf === "string" &&
    f.professional_cpf.trim() &&
    !validCpf(f.professional_cpf)
  )
    errors.professional_cpf = "Confira o CPF do profissional da instituição.";
  for (const key of ["beneficiaries", "companions", "local_team"]) {
    const n = f[key];
    if (
      n !== null &&
      (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 1000000)
    )
      errors[key] =
        "Informe uma quantidade inteira igual ou maior que zero, ou deixe vazio.";
  }
  if (typeof f.estimates !== "boolean")
    errors.estimates = "Indique se as quantidades são estimadas.";
  if (!["canvas", "paper"].includes(String(f.signature_method)))
    errors.signature_method = "Escolha como comprovar a assinatura.";
  if (
    !Array.isArray(f.attendance) ||
    f.attendance.length > 500 ||
    f.attendance.some(
      (a: AttendanceInput) =>
        !a ||
        !UUID.test(a.volunteer_id) ||
        !["present", "absent"].includes(a.status) ||
        (a.status === "present"
          ? a.justified !== null
          : typeof a.justified !== "boolean"),
    ) ||
    new Set(f.attendance.map((a: AttendanceInput) => a.volunteer_id)).size !==
      f.attendance.length
  )
    errors.attendance =
      "Preencha a chamada de todos os voluntários, sem duplicações.";
  if (f.accepted !== true)
    errors.accepted = "Confirme a declaração antes de enviar.";
  return errors;
}
export function normalizeReport(f: ReportInput): ReportInput {
  return {
    cell_id: f.cell_id,
    visit_date: f.visit_date,
    start_time: f.start_time,
    end_time: f.end_time,
    professional_name: f.professional_name.trim(),
    professional_role: f.professional_role.trim(),
    professional_cpf: f.professional_cpf.replace(/[.\-\s]/g, ""),
    beneficiaries: f.beneficiaries,
    companions: f.companions,
    local_team: f.local_team,
    estimates: f.estimates,
    signature_method: f.signature_method,
    accepted: f.accepted,
    attendance: f.attendance.map((a) => ({
      volunteer_id: a.volunteer_id,
      status: a.status,
      justified: a.justified,
    })),
  };
}
export type Role =
  "coordinator" | "director" | "admin" | "volunteer" | "communications";
export type Profile = {
  id: string;
  display_name: string;
  email: string;
  clown_name: string;
  phone: string;
  role: Role;
  active: boolean;
  manager_id: string | null;
  deleted_at: string | null;
};
export type Institution = { id: string; name: string; active: boolean };
export type Cell = {
  id: string;
  name: string;
  institution_id: string;
  active: boolean;
  reporting_start: string;
  reporting_end: string | null;
  expected_visits: number;
};
export type Membership = {
  profile_id: string;
  cell_id: string;
  active: boolean;
  is_default: boolean;
};
export type Period = {
  id: string;
  cell_id: string;
  month: string;
  expected_count: number;
};
export type Report = Omit<ReportInput, "accepted"> & {
  id: string;
  created_by: string;
  cell_name: string;
  institution_name: string;
  coordinator_name: string;
  period_id: string;
  submitted_at: string;
  created_at: string;
  status: "submitted";
  pdf_path: string;
  file_paths: string[];
  file_labels: string[];
};
export type News = {
  details?: PublicationDetails;
  id: string;
  title: string;
  body: string;
  published_at: string;
  status: "draft" | "published" | "archived";
};
export type Event = {
  details?: PublicationDetails;
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "published" | "archived";
};
export function monthLabel(month: string) {
  return new Date(month.slice(0, 7) + "-01T12:00:00").toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" },
  );
}

export type Attendance = AttendanceInput & {
  report_id: string;
  volunteer_name: string;
  clown_name: string;
};

export type Campaign = News & { ends_at: string | null };
