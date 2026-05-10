import { useEffect, useState } from "react";
import { habitService } from "../services/habitService";
import { supabase } from "../lib/supabase";
import { CheckCircle2, Circle, Flame, AlertTriangle } from "lucide-react";
import { useRpgStore } from "../store/useRpgStore";
import { FormCriarHabito } from "./FormCriarHabito";

export function Missoes() {
  const [habitos, setHabitos] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addXp = useRpgStore((state) => state.addXp);
  const removeXp = useRpgStore((state) => state.removeXp);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carregarDados = async () => {
    try {
      const [h, r] = await Promise.all([
        habitService.getHabitos(),
        habitService.getRegistrosHoje(),
      ]);
      setHabitos(h);
      setRegistros(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleToggle = async (habito: any) => {
    const concluidoAtual = registros.find(
      (r) => r.habito_id === habito.id,
    )?.concluido;
    const novoStatus = !concluidoAtual;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await habitService.toggleHabito(habito.id, novoStatus, user.id);

      // Feedback de XP em tempo real
      if (novoStatus) {
        addXp(habito.xp_ganho);
      } else {
        removeXp(habito.xp_ganho);
      }

      carregarDados();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return <div className='p-10 text-white'>Escaneando rotina...</div>;

  return (
    <div className='flex flex-col gap-8 max-w-2xl'>
      <header className='bg-[#121a27] border border-[#273b4a] p-6 rounded-2xl shadow-xl'>
        <div className='flex items-center gap-3 mb-2'>
          <Flame className='text-orange-500' size={32} />
          <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
            Missões de Sobrevivência
          </h2>
        </div>
        <p className='text-[#a0aec0] text-sm'>
          Complete suas obrigações diárias para manter seu XP. O fracasso
          resulta em sangramento automático à meia-noite.
        </p>
      </header>

      <div className='grid gap-4'>
        {habitos.map((h) => {
          const concluido = registros.find(
            (r) => r.habito_id === h.id,
          )?.concluido;
          return (
            <button
              key={h.id}
              onClick={() => handleToggle(h)}
              className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                concluido
                  ? "bg-[#48a64b]/10 border-[#48a64b]/50 shadow-[0_0_15px_rgba(72,166,75,0.1)]"
                  : "bg-[#121a27] border-[#273b4a] hover:border-[#ca8aef]/50"
              }`}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={concluido ? "text-[#48a64b]" : "text-[#273b4a]"}
                >
                  {concluido ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <Circle size={28} />
                  )}
                </div>
                <div className='text-left'>
                  <h3
                    className={`font-bold text-lg ${concluido ? "text-white/50 line-through" : "text-white"}`}
                  >
                    {h.nome}
                  </h3>
                  <div className='flex gap-3 text-xs font-black uppercase mt-1'>
                    <span className='text-[#48a64b]'>+{h.xp_ganho} XP</span>
                    <span className='text-red-500 flex items-center gap-1'>
                      <AlertTriangle size={12} /> -{h.xp_penalidade} Sangue
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Botão para abrir o modal quando a lista estiver vazia ou no header */}
      {habitos.length === 0 && (
        <div className='text-center p-10 border-2 border-dashed border-[#273b4a] rounded-2xl'>
          <p className='text-[#a0aec0]'>Nenhum hábito mestre cadastrado.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className='mt-4 text-[#ca8aef] font-bold uppercase text-sm underline cursor-pointer'
          >
            CONFIGURAR ROTINA
          </button>
        </div>
      )}

      <FormCriarHabito
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarDados}
      />
    </div>
  );
}
