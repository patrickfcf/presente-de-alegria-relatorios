import {
  authenticate,
  cors,
  response,
  HttpError,
  limitedBody,
  handleError,
} from "../_shared/http.ts";
import { UUID } from "../../../shared/report.ts";
import { validateDetails } from "../../../shared/publications.ts";
const str = (v: unknown, min: number, max: number) =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return response({ error: "Método não permitido." }, 405);
  try {
    const { db, user, profile } = await authenticate(req);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(new TextDecoder().decode(await limitedBody(req, 24000)));
    } catch {
      throw new HttpError(400, "Dados inválidos.");
    }
    const action = body.action;
    if (action === "ensure-periods") {
      if (!["admin", "director", "coordinator"].includes(profile.role))
        throw new HttpError(403, "Acesso restrito.");
      const month = String(body.month || "");
      if (!/^\d{4}-\d{2}-01$/.test(month)) throw new HttpError(400, "Mês inválido.");
      const { error } = await db.rpc("ensure_report_periods", {
        p_actor: user.id,
        p_month: month,
      });
      if (error) throw new HttpError(400, "Não foi possível abrir esse período.");
      return response({ ok: true });
    }
    if (
      !["admin", "director", "coordinator", "communications"].includes(profile.role)
    )
      throw new HttpError(403, "Acesso restrito à equipe responsável.");
    if (
      action === "save-news" ||
      action === "save-event" ||
      action === "save-campaign"
    ) {
      if (!["admin", "communications"].includes(profile.role))
        throw new HttpError(403, "Somente a equipe de comunicação pode publicar.");
      const isNews = action !== "save-event";
      const table =
        action === "save-campaign" ? "campaigns" : isNews ? "news" : "events";
      if (body.status === "published" && body.public_confirmed !== true)
        throw new HttpError(400, "Confirme que o conteúdo pode ficar público.");
      let details;
      try {
        details = validateDetails(table, body.details);
      } catch (e) {
        throw new HttpError(400, (e as Error).message);
      }
      if (
        !str(body.title, 3, 160) ||
        !str(isNews ? body.body : body.description, 1, 4000) ||
        !["draft", "published", "archived"].includes(String(body.status))
      )
        throw new HttpError(
          400,
          "Confira o título, o texto e a situação da publicação.",
        );
      const data: Record<string, unknown> = {
        details,
        title: String(body.title).trim(),
        status: body.status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      if (isNews) {
        if (
          !str(body.published_at, 10, 35) ||
          !Number.isFinite(Date.parse(String(body.published_at)))
        )
          throw new HttpError(400, "Data inválida.");
        data.body = String(body.body).trim();
        data.published_at = new Date(String(body.published_at)).toISOString();
      } else {
        if (
          !str(body.location, 2, 200) ||
          !Number.isFinite(Date.parse(String(body.starts_at)))
        )
          throw new HttpError(400, "Confira o local e a data do evento.");
        if (
          body.ends_at &&
          (!Number.isFinite(Date.parse(String(body.ends_at))) ||
            Date.parse(String(body.ends_at)) <= Date.parse(String(body.starts_at)))
        )
          throw new HttpError(400, "O fim do evento deve ser posterior ao início.");
        Object.assign(data, {
          description: String(body.description).trim(),
          location: String(body.location).trim(),
          starts_at: new Date(String(body.starts_at)).toISOString(),
          ends_at: body.ends_at
            ? new Date(String(body.ends_at)).toISOString()
            : null,
        });
      }
      if (table === "campaigns") {
        if (
          body.ends_at &&
          (!Number.isFinite(Date.parse(String(body.ends_at))) ||
            Date.parse(String(body.ends_at)) <=
              Date.parse(String(body.published_at)))
        )
          throw new HttpError(400, "O prazo deve ser posterior à publicação.");
        data.ends_at = body.ends_at
          ? new Date(String(body.ends_at)).toISOString()
          : null;
        if (
          body.status === "published" &&
          !details.action_url &&
          !details.contact_url &&
          !details.pix_key
        )
          throw new HttpError(400, "Informe como ajudar: link, contato ou Pix.");
      }
      let result;
      if (body.id) {
        if (!UUID.test(String(body.id)))
          throw new HttpError(400, "Publicação inválida.");
        result = await db
          .from(table)
          .update(data)
          .eq("id", body.id)
          .select("id")
          .single();
      } else
        result = await db
          .from(table)
          .insert({ ...data, created_by: user.id })
          .select("id")
          .single();
      if (result.error)
        throw new HttpError(400, "Não foi possível salvar a publicação.");
      return response({ id: result.data.id });
    }
    if (action === "reset-login" || action === "delete-account") {
      if (!UUID.test(String(body.id)))
        throw new HttpError(400, "Cadastro inválido.");
      const { data: email, error } = await db.rpc("authorize_account_action", {
        p_actor: user.id,
        p_target: body.id,
        p_action: action === "reset-login" ? "reset" : "delete",
      });
      if (error)
        throw new HttpError(
          403,
          "Operação não permitida. Reatribua a equipe antes de excluir um responsável.",
        );
      if (action === "delete-account") {
        // Retain historical records; remove Auth access with Supabase soft deletion.
        const removed = await db.auth.admin.deleteUser(String(body.id), true);
        if (removed.error)
          throw new HttpError(
            503,
            "O acesso já foi bloqueado. A exclusão no provedor precisa ser concluída pela administração.",
          );
        return response({ ok: true });
      }
      const sent = await db.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      return response({ ok: true, email_sent: !sent.error });
    }
    if (action === "replace-coordinator") {
      if (!UUID.test(String(body.id)) || !UUID.test(String(body.successor_id)))
        throw new HttpError(400, "Escolha o coordenador e seu substituto.");
      const { error } = await db.rpc("replace_coordinator", {
        p_actor: user.id,
        p_current: body.id,
        p_successor: body.successor_id,
      });
      if (error)
        throw new HttpError(
          403,
          "Não foi possível realizar a troca. Escolha um voluntário ativo da equipe e confira seu acesso.",
        );
      return response({ ok: true });
    }
    if (profile.role !== "admin" && action !== "save-profile")
      throw new HttpError(403, "Somente administradores podem alterar cadastros.");
    if (action === "save-institution") {
      if (!str(body.name, 2, 160) || typeof body.active !== "boolean")
        throw new HttpError(400, "Nome de instituição inválido.");
      const data = { name: String(body.name).trim(), active: body.active };
      const result = body.id
        ? await db
            .from("institutions")
            .update(data)
            .eq("id", body.id)
            .select("id")
            .single()
        : await db.from("institutions").insert(data).select("id").single();
      if (result.error)
        throw new HttpError(400, "Não foi possível salvar a instituição.");
      return response(result.data);
    }
    if (action === "save-cell") {
      if (
        !str(body.name, 2, 100) ||
        !UUID.test(String(body.institution_id)) ||
        typeof body.active !== "boolean" ||
        !/^\d{4}-\d{2}-01$/.test(String(body.reporting_start)) ||
        !Number.isInteger(body.expected_visits) ||
        Number(body.expected_visits) < 1 ||
        Number(body.expected_visits) > 31
      )
        throw new HttpError(400, "Confira os dados da célula.");
      if (body.reporting_end && !/^\d{4}-\d{2}-01$/.test(String(body.reporting_end)))
        throw new HttpError(400, "Mês final inválido.");
      const data = {
        name: String(body.name).trim(),
        institution_id: body.institution_id,
        active: body.active,
        reporting_start: body.reporting_start,
        reporting_end: body.reporting_end || null,
        expected_visits: body.expected_visits,
      };
      const result = body.id
        ? await db.from("cells").update(data).eq("id", body.id).select("id").single()
        : await db.from("cells").insert(data).select("id").single();
      if (result.error)
        throw new HttpError(
          400,
          "Não foi possível salvar. Confira se já existe uma célula com esse nome.",
        );
      return response(result.data);
    }
    if (action === "save-profile") {
      if (
        !str(body.display_name, 2, 100) ||
        !str(body.email, 3, 254) ||
        !/^\S+@\S+\.\S+$/.test(String(body.email)) ||
        !["coordinator", "director", "volunteer", "communications"].includes(
          String(body.role),
        ) ||
        typeof body.active !== "boolean"
      )
        throw new HttpError(
          400,
          "Confira nome, e-mail e perfil. Administradores são provisionados fora deste formulário.",
        );
      if (profile.role === "director" && body.role !== "coordinator")
        throw new HttpError(
          403,
          "Líderes de segmento podem cadastrar coordenadores.",
        );
      if (
        ["coordinator", "volunteer"].includes(String(body.role)) &&
        (!str(body.clown_name, 1, 100) ||
          !/^\+[0-9]{10,15}$/.test(String(body.phone)))
      )
        throw new HttpError(
          400,
          "Informe o nome de palhaço e um celular válido com código do país.",
        );
      if (body.role === "coordinator" && !UUID.test(String(body.cell_id)))
        throw new HttpError(400, "Escolha a célula padrão.");
      if (profile.role === "coordinator" && body.role !== "volunteer")
        throw new HttpError(403, "Coordenadores cadastram somente voluntários.");
      if (
        ["coordinator", "volunteer"].includes(String(body.role)) &&
        !UUID.test(String(body.manager_id))
      )
        throw new HttpError(400, "Escolha o responsável pela equipe.");
      if (profile.role === "communications")
        throw new HttpError(403, "Seu perfil permite gerenciar publicações.");
      let id = body.id ? String(body.id) : "";
      let created = false;
      if (id && !UUID.test(id)) throw new HttpError(400, "Usuário inválido.");
      if (!id) {
        // No password is set; email possession must be verified at every OTP login.
        const { data, error } = await db.auth.admin.createUser({
          email: String(body.email).trim().toLowerCase(),
          email_confirm: true,
        });
        if (error || !data.user)
          throw new HttpError(
            400,
            "Não foi possível criar o usuário. Confira se esse e-mail já está cadastrado.",
          );
        id = data.user.id;
        created = true;
      }
      const { error } = await db.rpc("manage_profile", {
        p_actor: user.id,
        p_target: id,
        p_name: String(body.display_name).trim(),
        p_email: String(body.email).trim().toLowerCase(),
        p_role: body.role,
        p_active: body.active,
        p_cell: body.role === "coordinator" ? body.cell_id : null,
        p_clown: String(body.clown_name || "").trim(),
        p_phone: String(body.phone || ""),
        p_manager: ["director", "communications"].includes(String(body.role))
          ? null
          : body.manager_id,
      });
      if (error) {
        if (created) await db.auth.admin.deleteUser(id);
        throw new HttpError(
          400,
          "Não foi possível salvar o cadastro. Confira o responsável e a célula. Para trocar um coordenador com equipe, use Substituir coordenador. Para desativar um responsável, reatribua sua equipe primeiro.",
        );
      }
      if (created) {
        const sent = await db.auth.signInWithOtp({
          email: String(body.email).trim().toLowerCase(),
          options: { shouldCreateUser: false },
        });
        return response({ id, email_sent: !sent.error });
      }
      return response({ id });
    }
    throw new HttpError(400, "Operação não reconhecida.");
  } catch (error) {
    return handleError(error);
  }
});
