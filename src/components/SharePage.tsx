import { useState } from "react";
import { siteOrigin } from "../../shared/seo";
export function SharePage({ path, title }: { path: string; title: string }) {
  const [notice, setNotice] = useState("");
  return (
    <div className="share-page">
      <button
        className="text-button"
        onClick={async () => {
          const url = siteOrigin + path + "/";
          try {
            if (navigator.share) await navigator.share({ title, url });
            else {
              await navigator.clipboard.writeText(url);
              setNotice("Link copiado para compartilhar.");
            }
          } catch (error) {
            if (!(error instanceof Error && error.name === "AbortError"))
              setNotice(
                "Não foi possível compartilhar. Copie o endereço da página.",
              );
          }
        }}
      >
        Compartilhar página
      </button>
      <span className="small" role="status">
        {notice}
      </span>
    </div>
  );
}
