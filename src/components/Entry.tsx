import { useState } from "react";
import { Login } from "./Login";
import { Icon } from "./Icon";
const choices = [
  ["communications", "Equipe de Comunicação e Eventos"],
  ["director", "Diretor de célula"],
  ["coordinator", "Coordenador de célula"],
  ["volunteer", "Voluntário individual"],
] as const;
export function Entry() {
  const [choice, setChoice] = useState(() => {
    try {
      return localStorage.getItem("pda:entry") || "";
    } catch {
      return "";
    }
  });
  function choose(value: string) {
    setChoice(value);
    try {
      localStorage.setItem("pda:entry", value);
    } catch {
      /* preference is optional */
    }
  }
  if (choice)
    return (
      <>
        <div className="row between">
          <p className="small">
            {choices.find((c) => c[0] === choice)?.[1] || "Administração"}
          </p>
          <button className="text-button" onClick={() => choose("")}>
            Trocar opção
          </button>
        </div>
        <Login />
      </>
    );
  return (
    <section className="card">
      <h2>Quem é você no Presente?</h2>
      <p>Todos somos voluntários. Escolha como você participa.</p>
      <div className="entry-options">
        {choices.map(([value, label]) => (
          <button
            className="secondary"
            key={value}
            onClick={() => choose(value)}
          >
            <span>{label}</span>
            <Icon name="arrow" size={20} />
          </button>
        ))}
      </div>
      <p className="small muted">
        Seu acesso será confirmado pelo cadastro da ONG.
      </p>
      <button className="text-button small" onClick={() => choose("admin")}>
        Acesso de administrador
      </button>
    </section>
  );
}
