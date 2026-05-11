import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { KanbanBoard } from "./features/metas/components/KanbanBoard";
import { HudUsuario } from "./features/hud/components/HudUsuario";
import { Login } from "./pages/Login";
import { LayoutDashboard, Trophy, Settings, LogOut, Flame } from "lucide-react";
import { Historico } from "./pages/Historico";
import { Missoes } from "./pages/Missoes";
import { AuditorDiario } from "./features/hud/components/AuditorDiario";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. O ESTADO DO SWITCHER (Qual tela está ativa?)
  const [telaAtual, setTelaAtual] = useState<
    "kanban" | "historico" | "missoes"
  >("kanban");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className='h-screen bg-[#050e22] flex items-center justify-center text-white'>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    // No mobile é coluna invertida (menu embaixo), no PC é linha (menu na esquerda)
    <div className='flex flex-col-reverse md:flex-row h-screen bg-[#050e22] text-white overflow-hidden font-sans'>
      {/* Menu Principal: Bottom Bar no mobile, Sidebar no PC */}
      <aside className='w-full md:w-20 h-16 md:h-full bg-[#121a27] border-t md:border-t-0 md:border-r border-[#273b4a] flex flex-row md:flex-col items-center justify-around md:py-6 shrink-0 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] md:shadow-[4px_0_24px_rgba(0,0,0,0.5)]'>
        {/* Logo escondida no mobile */}
        <div className='hidden md:flex w-12 h-12 bg-gradient-to-br from-[#ca8aef] to-[#a564d3] rounded-xl mb-10 shadow-[0_0_15px_rgba(202,138,239,0.4)] items-center justify-center font-black text-lg text-white'>
          V2
        </div>

        <nav className='flex flex-row md:flex-col gap-2 md:gap-6 w-full items-center justify-around md:justify-center px-4 md:px-0'>
          <button
            onClick={() => setTelaAtual("kanban")}
            className={`p-3 rounded-xl transition-all group relative ${telaAtual === "kanban" ? "bg-[#ca8aef] text-white shadow-[0_0_15px_rgba(202,138,239,0.5)]" : "bg-[#273b4a] text-white hover:bg-[#ca8aef]/50"}`}
          >
            <LayoutDashboard size={22} />
          </button>

          <button
            onClick={() => setTelaAtual("missoes")}
            className={`p-3 rounded-xl transition-all group relative ${telaAtual === "missoes" ? "bg-[#ca8aef] text-white shadow-[0_0_15px_rgba(202,138,239,0.5)]" : "text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white"}`}
          >
            <Flame size={22} />
            {/* Dica: Você pode colocar uma bolinha vermelha aqui depois se houver missões pendentes */}
          </button>

          <button
            onClick={() => setTelaAtual("historico")}
            className={`p-3 rounded-xl transition-all group relative ${telaAtual === "historico" ? "bg-[#ca8aef] text-white shadow-[0_0_15px_rgba(202,138,239,0.5)]" : "text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white"}`}
          >
            <Trophy size={22} />
          </button>

          <button className='p-3 rounded-xl text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white transition-all'>
            <Settings size={22} />
          </button>
        </nav>

        <div className='hidden md:block flex-grow'></div>

        <button
          onClick={() => supabase.auth.signOut()}
          className='p-3 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all mt-0 md:mt-auto mb-0 md:mb-2'
        >
          <LogOut size={22} />
        </button>
      </aside>

      {/* Área de Conteúdo: Padronizando o padding para não vazar a tela */}
      <main className='flex-grow relative p-4 md:p-10 overflow-y-auto overflow-x-hidden'>
        <AuditorDiario /> {/* <-- O PORTEIRO ESTÁ AQUI */}
        <HudUsuario />
        <header className='mb-8 md:mb-12'>
          <h1 className='text-3xl md:text-[3.2rem] font-bold mb-2 text-white leading-tight'>
            {telaAtual === "kanban" && "Minhas Metas"}
            {telaAtual === "missoes" && "Missões Diárias"}
            {telaAtual === "historico" && "Cofre de Conquistas"}
          </h1>
          <p className='text-sm md:text-[1.6rem] text-[#a0aec0]'>
            {telaAtual === "kanban" && "Transforme sua disciplina em XP."}
            {telaAtual === "missoes" && "Sua ofensiva contra a estagnação."}
            {telaAtual === "historico" && "Auditoria de alta performance."}
          </p>
        </header>
        {/* Switcher de Telas */}
        {telaAtual === "kanban" && <KanbanBoard />}
        {telaAtual === "missoes" && <Missoes />}
        {telaAtual === "historico" && <Historico />}
      </main>
    </div>
  );
}
