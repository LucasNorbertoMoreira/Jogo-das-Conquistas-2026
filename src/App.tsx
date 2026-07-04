import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { KanbanBoard } from "./features/metas/components/KanbanBoard";
import { HudUsuario } from "./features/hud/components/HudUsuario";
import { Login } from "./pages/Login";
import {
  LayoutDashboard,
  Trophy,
  Settings,
  LogOut,
  Flame,
  Wallet,
} from "lucide-react";
import { Historico } from "./pages/Historico";
import { Missoes } from "./pages/Missoes";
import { AuditorDiario } from "./features/hud/components/AuditorDiario";
import { FluxoDeCaixa } from "./pages/FluxoDeCaixa";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. O ESTADO DO SWITCHER (Agora suportando o financeiro)
  const [telaAtual, setTelaAtual] = useState<
    "kanban" | "historico" | "missoes" | "financeiro"
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
    <div className='flex flex-col-reverse md:flex-row h-screen bg-[#050e22] text-white overflow-hidden font-sans'>
      {/* Menu Principal */}
      <aside className='w-full md:w-20 h-16 md:h-full bg-[#121a27] border-t md:border-t-0 md:border-r border-[#273b4a] flex flex-row md:flex-col items-center justify-around md:py-6 shrink-0 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] md:shadow-[4px_0_24px_rgba(0,0,0,0.5)]'>
        {/* Logo */}
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
          </button>

          <button
            onClick={() => setTelaAtual("historico")}
            className={`p-3 rounded-xl transition-all group relative ${telaAtual === "historico" ? "bg-[#ca8aef] text-white shadow-[0_0_15px_rgba(202,138,239,0.5)]" : "text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white"}`}
          >
            <Trophy size={22} />
          </button>

          {/* NOVO: Botão do Fluxo de Caixa */}
          <button
            onClick={() => setTelaAtual("financeiro")}
            className={`p-3 rounded-xl transition-all group relative ${telaAtual === "financeiro" ? "bg-[#48a64b] text-white shadow-[0_0_15px_rgba(72,166,75,0.5)]" : "text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white"}`}
          >
            <Wallet size={22} />
          </button>

          <button className='p-3 rounded-xl text-[#b7b7b7] hover:bg-[#273b4a] hover:text-white transition-all hidden md:block mt-4'>
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

      {/* Área de Conteúdo */}
      <main className='flex-grow relative p-4 md:p-10 overflow-y-auto overflow-x-hidden'>
        <AuditorDiario />
        <HudUsuario />
        <header className='mb-8 md:mb-12'>
          <h1 className='text-3xl md:text-[3.2rem] font-bold mb-2 text-white leading-tight'>
            {telaAtual === "kanban" && "Minhas Metas"}
            {telaAtual === "missoes" && "Missões Diárias"}
            {telaAtual === "historico" && "Cofre de Conquistas"}
            {telaAtual === "financeiro" && "Fluxo de Caixa"}
          </h1>
          <p className='text-sm md:text-[1.6rem] text-[#a0aec0]'>
            {telaAtual === "kanban" && "Transforme sua disciplina em XP."}
            {telaAtual === "missoes" && "Sua ofensiva contra a estagnação."}
            {telaAtual === "historico" && "Auditoria de alta performance."}
            {telaAtual === "financeiro" && "Controle de recursos e liquidez."}
          </p>
        </header>

        {/* Switcher de Telas */}
        {telaAtual === "kanban" && <KanbanBoard />}
        {telaAtual === "missoes" && <Missoes />}
        {telaAtual === "historico" && <Historico />}
        {telaAtual === "financeiro" && <FluxoDeCaixa />}
      </main>
    </div>
  );
}
