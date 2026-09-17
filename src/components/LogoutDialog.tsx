import { useEffect, useRef } from "react";
export function LogoutDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    return () => {
      node.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="dialog card"
      aria-labelledby="logout-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id="logout-title">Sair da sua conta?</h2>
      <p>
        Os rascunhos deste aparelho serão removidos. Os relatórios enviados continuam
        seguros.
      </p>
      <div className="form-actions">
        <button autoFocus className="secondary" onClick={onClose}>
          Continuar aqui
        </button>
        <button className="primary" onClick={onConfirm}>
          Sair
        </button>
      </div>
    </dialog>
  );
}
