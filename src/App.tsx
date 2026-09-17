import { useState } from 'react'
import './App.css'

export default function App() {
  const [install, setInstall] = useState(false)
  return (
    <>
      <a className="skip" href="#main">Ir para o conteúdo</a>
      <header><img src="/logo.png" alt="Presente de Alegria" /><span>RELATÓRIOS DE VISITA</span></header>
      <main id="main">
        <div className="eyebrow">CUIDAR TAMBÉM É REGISTRAR</div>
        <h1>Cada visita faz<br />a diferença.</h1>
        <p className="intro">Um lugar simples para registrar os encontros que levam alegria a quem precisa.</p>
        <section className="card" aria-labelledby="status-title">
          <span className="badge">Em preparação</span>
          <h2 id="status-title">Estamos preparando esse espaço.</h2>
          <p>Em breve, os coordenadores poderão preencher, assinar e enviar seus relatórios por aqui.</p>
          <p className="notice">O sistema ainda não está recebendo relatórios.</p>
        </section>
        <button className="primary" aria-expanded={install} aria-controls="install-help" onClick={() => setInstall(!install)}>Como usar no celular <span aria-hidden="true">↗</span></button>
        {install && <section id="install-help" className="card" aria-label="Instalação no celular">
          <h2>O site também será seu aplicativo.</h2>
          <h3>No iPhone</h3><p>Abra no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.</p>
          <h3>No Android</h3><p>Abra no Chrome, toque no menu e escolha Instalar aplicativo ou Adicionar à tela inicial.</p>
          <p>A instalação estará disponível quando a versão de produção estiver pronta. Você também poderá usar pelo navegador.</p>
        </section>}
      </main>
      <footer>Presente de Alegria <span aria-hidden="true">♥</span><br />Mais tempo para estar presente.</footer>
    </>
  )
}
