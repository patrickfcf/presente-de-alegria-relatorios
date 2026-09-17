import { beforeAll, beforeEach, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  role: "director",
  handler: null as null | ((r: Request) => Promise<Response>),
  written: vi.fn(),
  createUser: vi.fn(),
}));
vi.stubGlobal("Deno", {
  serve: (handler: (r: Request) => Promise<Response>) => {
    state.handler = handler;
  },
});
vi.mock("../supabase/functions/_shared/http.ts", () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    HttpError,
    cors: {},
    response: (body: unknown, status = 200) => Response.json(body, { status }),
    limitedBody: async (req: Request) => new Uint8Array(await req.arrayBuffer()),
    handleError: (e: unknown) =>
      Response.json(
        { error: (e as Error).message },
        { status: e instanceof HttpError ? e.status : 500 },
      ),
    authenticate: async () => ({
      user: { id: "11111111-1111-4111-8111-111111111111" },
      profile: { role: state.role },
      db: {
        from: (table: string) => ({
          insert: (data: unknown) => {
            state.written(table, data);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: "publication" },
                  error: null,
                }),
              }),
            };
          },
        }),
        auth: { admin: { createUser: state.createUser } },
      },
    }),
  };
});
beforeAll(async () => {
  await import("../supabase/functions/admin/index.ts");
});
beforeEach(() => {
  vi.clearAllMocks();
});
const call = (body: unknown) =>
  state.handler!(
    new Request("https://example.invalid/admin", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
it.each(["director", "coordinator", "volunteer"])(
  "%s cannot publish, even with a forged request",
  async (role) => {
    state.role = role;
    const result = await call({
      action: "save-news",
      title: "Notícia de teste",
      body: "Texto de teste",
      status: "published",
      public_confirmed: true,
      published_at: "2026-01-01T12:00:00Z",
    });
    expect(result.status).toBe(403);
    expect(state.written).not.toHaveBeenCalled();
  },
);
it("communications can publish events but cannot create accounts", async () => {
  state.role = "communications";
  const published = await call({
    action: "save-event",
    title: "Encontro de teste",
    description: "Descrição",
    location: "Sede",
    status: "published",
    public_confirmed: true,
    starts_at: "2026-10-01T12:00:00Z",
  });
  expect(published.status).toBe(200);
  expect(state.written).toHaveBeenCalledWith(
    "events",
    expect.objectContaining({ title: "Encontro de teste" }),
  );
  const account = await call({
    action: "save-profile",
    display_name: "Teste",
    email: "test@example.invalid",
    role: "communications",
    active: true,
  });
  expect(account.status).toBe(403);
  expect(state.createUser).not.toHaveBeenCalled();
});
it("coordinators cannot manufacture a privileged profile", async () => {
  state.role = "coordinator";
  const result = await call({
    action: "save-profile",
    display_name: "Teste",
    email: "test@example.invalid",
    role: "communications",
    active: true,
  });
  expect(result.status).toBe(403);
  expect(state.createUser).not.toHaveBeenCalled();
});

it.each(["director", "coordinator", "volunteer"])(
  "%s cannot publish campaigns",
  async (role) => {
    state.role = role;
    const result = await call({
      action: "save-campaign",
      title: "Campanha teste",
      body: "Ajude",
      status: "published",
      public_confirmed: true,
      published_at: "2026-01-01T12:00:00Z",
      details: { contact_name: "Equipe", contact_url: "https://example.org" },
    });
    expect(result.status).toBe(403);
    expect(state.written).not.toHaveBeenCalled();
  },
);
it("requires public confirmation and validates Pix beneficiary", async () => {
  state.role = "communications";
  const body = {
    action: "save-campaign",
    title: "Campanha teste",
    body: "Ajude",
    status: "published",
    published_at: "2026-01-01T12:00:00Z",
  };
  expect((await call(body)).status).toBe(400);
  expect(
    (
      await call({
        ...body,
        public_confirmed: true,
        details: { pix_key: "synthetic-key" },
      })
    ).status,
  ).toBe(400);
  expect(state.written).not.toHaveBeenCalled();
  expect(
    (
      await call({
        ...body,
        public_confirmed: true,
        details: {
          pix_key: "synthetic-key",
          pix_beneficiary: "ONG teste",
          category: "Pix",
        },
      })
    ).status,
  ).toBe(200);
});
