import { useEffect, useRef, useState } from "react";
import type {
  Cell,
  Institution,
  Membership,
  Profile,
  ReportInput,
} from "../../shared/report";
import {
  attendanceTotal,
  DECLARATION,
  formatCpf,
  parseCount,
  todayBR,
  validateReport,
} from "../../shared/report";
import { saveDraft, readDraft, clearDraft } from "../lib/draft";
import { invoke } from "../lib/api";
import { Signature } from "./Signature";
import { Icon } from "./Icon";
const countFields = [
  ["beneficiaries", "Assistidos (Pacientes / Beneficiários)"],
  ["companions", "Acompanhantes"],
  ["local_team", "Equipe do Local (Funcionários / Profissionais)"],
] as const;
export function ReportForm({
  profile,
  cells,
  institutions,
  memberships,
  profiles,
  onClose,
  onSuccess,
}: {
  profile: Profile;
  cells: Cell[];
  institutions: Institution[];
  memberships: Membership[];
  profiles: Profile[];
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const available = cells.filter(
    (c) =>
      c.active &&
      (profile.role === "admin" ||
        memberships.some(
          (m) => m.cell_id === c.id && m.active && m.profile_id === profile.id,
        )),
  );
  const [initial] = useState(() => readDraft(profile.id));
  const [id] = useState(() => initial?.id || crypto.randomUUID());
  const defaultCell =
    memberships.find(
      (m) => m.profile_id === profile.id && m.active && m.is_default,
    )?.cell_id ||
    available[0]?.id ||
    "";
  const [form, setForm] = useState<ReportInput>(() => ({
    ...{
      cell_id: defaultCell,
      visit_date: todayBR(),
      start_time: "",
      end_time: "",
      professional_name: "",
      professional_role: "",
      professional_cpf: "",
      beneficiaries: null,
      companions: null,
      local_team: null,
      attendance: [],
      estimates: false,
      signature_method: "canvas",
      accepted: false,
    },
    ...initial?.form,
    cell_id: available.some((c) => c.id === initial?.form.cell_id)
      ? initial!.form.cell_id!
      : defaultCell,
  }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);
  const [signature, setSignature] = useState<Blob | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const cell = available.find((c) => c.id === form.cell_id);
  const institution = institutions.find((i) => i.id === cell?.institution_id);
  const roster = profiles.filter(
    (p) =>
      p.role === "volunteer" &&
      p.active &&
      !p.deleted_at &&
      (profile.role === "admin" || p.manager_id === profile.id) &&
      memberships.some(
        (m) => m.profile_id === p.id && m.cell_id === form.cell_id && m.active,
      ),
  );
  const total = attendanceTotal([
    form.beneficiaries,
    form.companions,
    form.local_team,
  ]);
  useEffect(() => {
    const timer = setTimeout(
      () => setSaved(saveDraft(profile.id, form, id)),
      500,
    );
    return () => clearTimeout(timer);
  }, [form, profile.id, id]);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (busy || form.professional_name || signature || files.length) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy, form.professional_name, signature, files.length]);
  function update<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "cell_id" ? { attendance: [] } : {}),
      accepted: false,
    }));
    setSignature(null);
    setSignatureUrl("");
    setErrors({});
    setError("");
  }
  function next() {
    const all = validateReport({ ...form, accepted: true });
    const relevant =
      step === 0
        ? ["cell_id", "visit_date", "end_time", "attendance"]
        : [
            "professional_name",
            "professional_role",
            "professional_cpf",
            "beneficiaries",
            "companions",
            "local_team",
          ];
    const found = Object.fromEntries(
      Object.entries(all).filter(([k]) => relevant.includes(k)),
    );
    if (Object.keys(found).length) {
      setErrors(found);
      setError("Confira os campos indicados.");
      return;
    }
    if (
      step === 0 &&
      roster.some((p) => !form.attendance.some((a) => a.volunteer_id === p.id))
    ) {
      setError("Preencha a presença de cada voluntário da equipe.");
      return;
    }
    if (step === 2) {
      if (form.signature_method === "canvas" && !signature) {
        setError("Confirme a assinatura do profissional antes de continuar.");
        return;
      }
      if (form.signature_method === "paper" && !files.length) {
        setError("Anexe o documento assinado.");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  }
  async function submit() {
    const invalid = validateReport(form);
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      setError("Confirme a declaração e confira os dados.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("id", id);
      body.append("report", JSON.stringify(form));
      if (form.signature_method === "canvas") {
        if (!signature)
          throw new Error("A assinatura precisa ser confirmada novamente.");
        body.append("evidence", signature, "assinatura.png");
      } else {
        if (!files.length) throw new Error("Anexe o documento assinado.");
        files.forEach((f) => body.append("evidence", f));
      }
      const result = await invoke<{ id: string }>("submit-report", body);
      clearDraft(profile.id);
      onSuccess(result.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const fieldError = (name: string) =>
    errors[name] ? (
      <span id={name + "-error"} className="field-error">
        {errors[name]}
      </span>
    ) : null;
  const inputProps = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? name + "-error" : undefined,
  });
  return (
    <div className="form-layout">
      <button
        type="button"
        className="text-button"
        disabled={busy}
        onClick={onClose}
      >
        ← Voltar à minha célula
      </button>
      <div className="eyebrow">RELATÓRIO DE VISITA</div>
      <h1 ref={heading} tabIndex={-1}>
        {
          [
            "Sobre a visita",
            "Quem vocês atenderam?",
            "Assinatura do profissional",
            "Confira antes de enviar",
          ][step]
        }
      </h1>
      <div className="steps" aria-label={`Etapa ${step + 1} de 4`}>
        {["Visita", "Atendimento", "Assinatura", "Revisão"].map((s, i) => (
          <span
            key={s}
            className={i <= step ? "active" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <b>{i + 1}</b>
            {s}
          </span>
        ))}
      </div>
      <p className="small muted">
        {saved
          ? "Data, horários e quantidades ficam salvos neste aparelho por até 7 dias."
          : "Não foi possível salvar o rascunho neste aparelho."}{" "}
        Dados do profissional, assinatura e arquivos precisam ser informados
        novamente se você fechar a página.
      </p>
      {!available.length ? (
        <div className="card">
          <h2>Nenhuma célula vinculada</h2>
          <p>Peça à diretoria para concluir seu cadastro.</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (step === 3 ? submit() : next());
          }}
        >
          <div className="card form-card">
            {step === 0 && (
              <>
                <label>
                  Célula
                  <select
                    value={form.cell_id}
                    required
                    onChange={(e) => update("cell_id", e.target.value)}
                    {...inputProps("cell_id")}
                  >
                    {available.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldError("cell_id")}
                </label>
                <div className="institution">
                  <span className="small muted">Instituição</span>
                  <strong>
                    {institution?.name || "Instituição não encontrada"}
                  </strong>
                </div>
                <label>
                  Data da visita
                  <input
                    type="date"
                    max={todayBR()}
                    min={cell?.reporting_start}
                    required
                    value={form.visit_date}
                    onChange={(e) => update("visit_date", e.target.value)}
                    {...inputProps("visit_date")}
                  />
                  {fieldError("visit_date")}
                </label>
                <div className="two-columns">
                  <label>
                    Horário inicial
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={(e) => update("start_time", e.target.value)}
                    />
                  </label>
                  <label>
                    Horário final
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={(e) => update("end_time", e.target.value)}
                      {...inputProps("end_time")}
                    />
                    {fieldError("end_time")}
                  </label>
                </div>
                <hr />
                <h2>Chamada dos voluntários</h2>
                <p className="small">
                  Registre quem compareceu à visita e se as faltas tiveram
                  justificativa válida. Não inclua informações médicas ou
                  detalhes pessoais.
                </p>
                {!roster.length ? (
                  <p className="notice">
                    Nenhum voluntário individual ativo vinculado a esta célula.
                    Cadastre a equipe em Minha equipe antes de registrar a
                    presença.
                  </p>
                ) : (
                  roster.map((p) => {
                    const a = form.attendance.find(
                      (v) => v.volunteer_id === p.id,
                    );
                    return (
                      <label key={p.id}>
                        {p.display_name}
                        {p.clown_name ? " · " + p.clown_name : ""}
                        <select
                          required
                          value={
                            !a
                              ? ""
                              : a.status === "present"
                                ? "present"
                                : a.justified
                                  ? "justified"
                                  : "absent"
                          }
                          onChange={(e) =>
                            update("attendance", [
                              ...form.attendance.filter(
                                (v) => v.volunteer_id !== p.id,
                              ),
                              {
                                volunteer_id: p.id,
                                status:
                                  e.target.value === "present"
                                    ? "present"
                                    : "absent",
                                justified:
                                  e.target.value === "present"
                                    ? null
                                    : e.target.value === "justified",
                              },
                            ])
                          }
                        >
                          <option value="" disabled>
                            Selecione a presença
                          </option>
                          <option value="present">Presente</option>
                          <option value="justified">
                            Faltou · justificativa válida
                          </option>
                          <option value="absent">
                            Faltou · sem justificativa válida
                          </option>
                        </select>
                      </label>
                    );
                  })
                )}
                {fieldError("attendance")}
              </>
            )}
            {step === 1 && (
              <>
                <h2>Dados do profissional da instituição</h2>
                <p className="small">
                  Preencha os dados da pessoa responsável pela instituição que
                  vai assinar o relatório.
                </p>
                <label>
                  Nome do profissional
                  <input
                    required
                    maxLength={100}
                    autoComplete="off"
                    value={form.professional_name}
                    onChange={(e) =>
                      update("professional_name", e.target.value)
                    }
                    {...inputProps("professional_name")}
                  />
                  {fieldError("professional_name")}
                </label>
                <label>
                  Função / Cargo <span className="optional">opcional</span>
                  <input
                    maxLength={100}
                    value={form.professional_role}
                    onChange={(e) =>
                      update("professional_role", e.target.value)
                    }
                  />
                </label>
                <label>
                  CPF do profissional <span className="optional">opcional</span>
                  <input
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formatCpf(form.professional_cpf)}
                    onChange={(e) =>
                      update(
                        "professional_cpf",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    {...inputProps("professional_cpf")}
                  />
                  {fieldError("professional_cpf")}
                </label>
                <hr />
                <h2>Indicadores de atendimento</h2>
                <p className="small">
                  Se não souber uma quantidade, deixe em branco. Zero significa
                  que não houve pessoas nessa categoria.
                </p>
                {countFields.map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={1000000}
                      step={1}
                      value={form[key] ?? ""}
                      onChange={(e) => {
                        try {
                          update(key, parseCount(e.target.value));
                        } catch (err) {
                          setErrors((v) => ({
                            ...v,
                            [key]: (err as Error).message,
                          }));
                        }
                      }}
                      {...inputProps(key)}
                    />
                    {fieldError(key)}
                  </label>
                ))}
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={form.estimates}
                    onChange={(e) => update("estimates", e.target.checked)}
                  />
                  Estas quantidades incluem estimativas.
                </label>
                <div className="total">
                  <span>
                    {total.complete
                      ? "Total de pessoas atendidas"
                      : "Subtotal informado"}
                  </span>
                  <strong>{total.value ?? "—"}</strong>
                </div>
                {!total.complete && (
                  <p className="small muted">
                    O total é parcial porque há quantidades não informadas.
                  </p>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <h2>Quem assina é o profissional da instituição.</h2>
                <fieldset className="choices">
                  <legend>Como deseja anexar a assinatura?</legend>
                  <label>
                    <input
                      type="radio"
                      name="method"
                      checked={form.signature_method === "canvas"}
                      onChange={() => {
                        update("signature_method", "canvas");
                        setFiles([]);
                      }}
                    />
                    Assinar neste celular
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="method"
                      checked={form.signature_method === "paper"}
                      onChange={() => update("signature_method", "paper")}
                    />
                    Enviar documento assinado em papel
                  </label>
                </fieldset>
                {form.signature_method === "canvas" ? (
                  <Signature
                    onConfirm={(blob, url) => {
                      setSignature(blob);
                      setSignatureUrl(url);
                      setError("");
                    }}
                    onInvalidate={() => {
                      setSignature(null);
                      setSignatureUrl("");
                    }}
                  />
                ) : (
                  <>
                    <p>
                      Fotografe ou digitalize a folha assinada pelo profissional
                      da instituição. Inclua toda a página, com os dados e a
                      assinatura legíveis.
                    </p>
                    <label className="upload-zone">
                      <Icon name="file" size={32} />
                      <span>Escolher comprovantes</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        multiple
                        onChange={(e) => {
                          const selected = Array.from(e.target.files || []);
                          if (
                            selected.length > 3 ||
                            selected.some((f) => f.size > 5 * 1024 * 1024)
                          ) {
                            setError(
                              "Escolha até 3 arquivos, com até 5 MB cada.",
                            );
                            e.target.value = "";
                            setFiles([]);
                          } else {
                            setFiles(selected);
                            setError("");
                          }
                        }}
                      />
                    </label>
                    <p className="small muted">
                      PDF, JPG ou PNG · até 3 arquivos de 5 MB · PDF sem senha,
                      até 20 páginas no total.
                    </p>
                    <ul>
                      {files.map((f, i) => (
                        <li key={i}>
                          {f.name}{" "}
                          <button
                            type="button"
                            className="text-button"
                            aria-label={"Remover " + f.name}
                            onClick={() =>
                              setFiles((fs) => fs.filter((_, n) => n !== i))
                            }
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <h2>{institution?.name}</h2>
                <dl className="review">
                  <dt>Célula</dt>
                  <dd>{cell?.name}</dd>
                  <dt>Data / Horário</dt>
                  <dd>
                    {form.visit_date.split("-").reverse().join("/")} ·{" "}
                    {form.start_time} – {form.end_time}
                  </dd>
                  <dt>Profissional da instituição</dt>
                  <dd>{form.professional_name}</dd>
                  <dt>Função / Cargo</dt>
                  <dd>{form.professional_role || "Não informado"}</dd>
                  <dt>CPF do profissional</dt>
                  <dd>
                    {form.professional_cpf
                      ? formatCpf(form.professional_cpf)
                      : "Não informado"}
                  </dd>
                  {countFields.map(([key, label]) => (
                    <div className="review-group" key={key}>
                      <dt>{label}</dt>
                      <dd>{form[key] ?? "Não informado"}</dd>
                    </div>
                  ))}
                  <dt>{total.complete ? "Total" : "Subtotal informado"}</dt>
                  <dd>
                    <strong>
                      {total.value ?? "Não informado"}
                      {form.estimates ? " (estimativa)" : ""}
                    </strong>
                  </dd>
                  <dt>Presença da equipe</dt>
                  <dd>
                    {
                      form.attendance.filter((a) => a.status === "present")
                        .length
                    }{" "}
                    presente(s) ·{" "}
                    {
                      form.attendance.filter((a) => a.status === "absent")
                        .length
                    }{" "}
                    falta(s)
                  </dd>
                  <dt>Responsável pelo envio</dt>
                  <dd>{profile.display_name}</dd>
                </dl>
                {signatureUrl ? (
                  <img
                    className="signature-preview"
                    src={signatureUrl}
                    alt="Assinatura confirmada do profissional da instituição"
                  />
                ) : (
                  <p>
                    <Icon name="file" /> {files.length} comprovante(s)
                    assinado(s) em papel.
                  </p>
                )}
                <div className="declaration">{DECLARATION}</div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={form.accepted}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, accepted: e.target.checked }))
                    }
                  />{" "}
                  {form.signature_method === "paper"
                    ? "Conferi os dados e confirmo que os comprovantes estão legíveis e assinados pelo profissional da instituição."
                    : "Conferi os dados e confirmo que o profissional da instituição leu a declaração e assinou neste aparelho."}
                </label>
                {fieldError("accepted")}
                <p className="small muted">
                  Após o envio, o relatório será arquivado e não poderá ser
                  editado nesta tela.
                </p>
              </>
            )}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 0 && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  if (step === 3 && form.signature_method === "canvas") {
                    setSignature(null);
                    setSignatureUrl("");
                  }
                  setForm((f) => ({ ...f, accepted: false }));
                  setStep((s) => s - 1);
                  setError("");
                }}
              >
                Voltar
              </button>
            )}
            <button className="primary" disabled={busy}>
              {busy
                ? "Enviando e arquivando…"
                : step === 3
                  ? "Enviar relatório"
                  : "Continuar"}
              <Icon name={step === 3 ? "check" : "arrow"} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
