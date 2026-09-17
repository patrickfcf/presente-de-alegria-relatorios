import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
export function Signature({
  onConfirm,
  onInvalidate,
}: {
  onConfirm: (blob: Blob, url: string) => void;
  onInvalidate: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePad | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const handlers = useRef({ onConfirm, onInvalidate });
  useEffect(() => {
    handlers.current = { onConfirm, onInvalidate };
  }, [onConfirm, onInvalidate]);
  useEffect(() => {
    const el = canvas.current!;
    const signature = new SignaturePad(el, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "#222",
      minWidth: 1.2,
      maxWidth: 2.8,
    });
    pad.current = signature;
    const resize = () => {
      const data = signature.toData();
      const oldWidth = el.width / (Number(el.dataset.ratio) || 1);
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = el.getBoundingClientRect().width;
      el.width = width * ratio;
      el.height = 220 * ratio;
      el.dataset.ratio = String(ratio);
      el.getContext("2d")!.scale(ratio, ratio);
      signature.clear();
      if (data.length) {
        const scale = oldWidth ? width / oldWidth : 1;
        signature.fromData(
          data.map((g) => ({
            ...g,
            points: g.points.map((p) => ({ ...p, x: p.x * scale })),
          })),
        );
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const begin = () => {
      setConfirmed(false);
      setError("");
      handlers.current.onInvalidate();
    };
    signature.addEventListener("beginStroke", begin);
    return () => {
      observer.disconnect();
      signature.off();
      signature.removeEventListener("beginStroke", begin);
      pad.current = null;
    };
  }, []);
  function reset(undo = false) {
    const p = pad.current!;
    if (undo) {
      const strokes = p.toData();
      strokes.pop();
      p.fromData(strokes);
    } else p.clear();
    setConfirmed(false);
    setError("");
    onInvalidate();
  }
  function confirm() {
    const p = pad.current!;
    if (p.isEmpty() || p.toData().reduce((sum, g) => sum + g.points.length, 0) < 4) {
      setError("Peça ao profissional para assinar no espaço acima.");
      return;
    }
    canvas.current!.toBlob((blob) => {
      if (blob) {
        onConfirm(blob, canvas.current!.toDataURL("image/png"));
        setConfirmed(true);
      } else setError("Não foi possível capturar a assinatura. Tente novamente.");
    }, "image/png");
  }
  return (
    <div className="signature">
      <p id="signature-help">
        Entregue o celular ao profissional da instituição para ele assinar com o dedo
        ou uma caneta.
      </p>
      <canvas
        ref={canvas}
        aria-label="Espaço para assinatura do profissional da instituição"
        aria-describedby="signature-help"
      />
      <div className="row">
        <button type="button" className="secondary" onClick={() => reset(true)}>
          Desfazer
        </button>
        <button type="button" className="secondary" onClick={() => reset()}>
          Limpar
        </button>
      </div>
      <button type="button" className="primary" onClick={confirm}>
        {confirmed ? "Assinatura confirmada ✓" : "Confirmar assinatura"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="small muted">
        Não consegue assinar na tela? Use a opção de documento assinado em papel.
      </p>
    </div>
  );
}
