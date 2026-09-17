import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { getInstallPrompt, clearInstallPrompt } from "../lib/install";
import type { InstallEvent } from "../lib/install";
export function Install() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(getInstallPrompt);
  const [qr, setQr] = useState("");
  const [installed, setInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches,
  );
  const production = import.meta.env.VITE_PRODUCTION_URL as string | undefined;
  useEffect(() => {
    const listener = () => setPrompt(getInstallPrompt());
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("pda-install-ready", listener);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("pda-install-ready", listener);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (production && /^https:\/\//.test(production))
      void import("qrcode")
        .then((m) =>
          m.toDataURL(production, {
            width: 256,
            margin: 2,
            color: { dark: "#2D1D54", light: "#ffffff" },
          }),
        )
        .then((url) => {
          if (active) setQr(url);
        });
    return () => {
      active = false;
    };
  }, [production]);
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    clearInstallPrompt();
    setPrompt(null);
  }
  return (
    <>
      <div className="eyebrow">SEMPRE POR PERTO</div>
      <h1>
        A alegria na
        <br />
        sua tela inicial.
      </h1>
      <p className="intro">
        Acesse os relatórios, notícias e eventos com um toque.
      </p>
      {installed ? (
        <p className="badge success">✓ Você já está usando o aplicativo</p>
      ) : (
        prompt && (
          <button className="primary" onClick={() => void install()}>
            Instalar aplicativo
            <Icon name="download" />
          </button>
        )
      )}
      <div className="card">
        <h2>No iPhone</h2>
        <ol className="instructions">
          <li>
            Abra o site no <strong>Safari</strong>.
          </li>
          <li>
            Toque em <strong>Compartilhar</strong>.
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong> e confirme.
          </li>
        </ol>
        <hr />
        <h2>No Android</h2>
        <ol className="instructions">
          <li>
            Abra o site no <strong>Chrome</strong>.
          </li>
          <li>
            Toque no menu <strong>⋮</strong>.
          </li>
          <li>
            Escolha <strong>Instalar aplicativo</strong> ou{" "}
            <strong>Adicionar à tela inicial</strong>.
          </li>
        </ol>
        <p className="small muted">
          Você também pode usar o site normalmente, sem instalar.
        </p>
      </div>
      {qr && (
        <div className="card qr-card">
          <img src="/logo.png" alt="Presente de Alegria" className="qr-logo" />
          <h2>Relatórios de Visita</h2>
          <p>Escaneie para abrir no seu celular.</p>
          <img
            src={qr}
            width={256}
            height={256}
            alt="QR Code para abrir o aplicativo Presente de Alegria"
          />
          <a href={production}>{production}</a>
        </div>
      )}
    </>
  );
}
