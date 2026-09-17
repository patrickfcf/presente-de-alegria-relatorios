import { useState } from "react";
import { supabase } from "../lib/api";
import { Icon } from "./Icon";
export function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nextSend, setNextSend] = useState(0);
  async function send() {
    if (Date.now() < nextSend) {
      setError("Aguarde um minuto antes de pedir outro código.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await supabase!.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (result.error) throw result.error;
      setSent(true);
      setNextSend(Date.now() + 60000);
    } catch {
      setError(
        "Não foi possível enviar o código. Confira seu e-mail e se seu cadastro está ativo com a administração.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const result = await supabase!.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: "email",
      });
      if (result.error) throw result.error;
    } catch {
      setError(
        "Código inválido ou expirado. Confira o e-mail ou peça outro código.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login-card card">
      <div className="round-icon">
        <Icon name="heart" size={26} />
      </div>
      <h2>{sent ? "Confira seu e-mail" : "Acesse seu espaço"}</h2>
      <p>
        {sent
          ? "Digite o código que enviamos para " + email + "."
          : "Use o e-mail cadastrado pela ONG. Não precisa lembrar de senha."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (sent ? verify() : send());
        }}
      >
        {!sent ? (
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              maxLength={254}
            />
          </label>
        ) : (
          <label>
            Código de acesso
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              minLength={6}
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Aguarde…" : sent ? "Entrar" : "Receber código"}
          <Icon name="arrow" />
        </button>
      </form>
      {sent && (
        <div className="row">
          <button
            className="text-button"
            disabled={busy}
            onClick={() => void send()}
          >
            Reenviar código
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            Trocar e-mail
          </button>
        </div>
      )}
      <p className="small muted">
        Acesso exclusivo para pessoas cadastradas no Presente de Alegria.
      </p>
    </section>
  );
}
