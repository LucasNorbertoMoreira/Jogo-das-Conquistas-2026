import { useEffect, useState } from "react";
import { habitService } from "../services/habitService";
import { supabase } from "../lib/supabase";
import { CheckCircle2, Circle, Flame, Trash2, Plus } from "lucide-react";
import { useRpgStore } from "../store/useRpgStore";
import { FormCriarHabito } from "./FormCriarHabito";

export function Missoes() {
  const [habitos, setHabitos] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addXp = useRpgStore((state) => state.addXp);
  const removeXp = useRpgStore((state) => state.removeXp);

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
    const registro = registros.find((r) => r.habito_id === habito.id);
    const novoStatus = !registro?.concluido;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await habitService.toggleHabito(habito.id, novoStatus, user.id);
      novoStatus ? addXp(habito.xp_ganho) : removeXp(habito.xp_ganho);
      carregarDados();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Remover este hábito da sua rotina?")) return;
    try {
      await habitService.deleteHabito(id);
      carregarDados();
    } catch (e) {
      console.error(e);
    }
  };

  const RenderColuna = ({
    titulo,
    tipo,
    cor,
  }: {
    titulo: string;
    tipo: string;
    cor: string;
  }) => {
    // 1. Filtra os hábitos pela coluna correta (baixa, media, alta)
    let habitosDaColuna = habitos.filter((h) => h.tipo === tipo);

    // 2. O Algoritmo de Prioridade: Joga os concluídos para o fundo
    habitosDaColuna.sort((a, b) => {
      const aConcluido =
        registros.find((r) => r.habito_id === a.id)?.concluido || false;
      const bConcluido =
        registros.find((r) => r.habito_id === b.id)?.concluido || false;

      if (aConcluido && !bConcluido) return 1; // A vai pro fim
      if (!aConcluido && bConcluido) return -1; // B vai pro fim
      return 0; // Mantém a ordem original se ambos estiverem no mesmo estado
    });

    return (
      <div className='flex flex-col gap-4 flex-1'>
        <h3
          className='text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2'
          style={{ color: cor }}
        >
          <div
            className='w-2 h-2 rounded-full'
            style={{ backgroundColor: cor }}
          ></div>
          {titulo}
        </h3>
        <div className='flex flex-col gap-3'>
          {habitosDaColuna.map((h) => {
            const concluido = registros.find(
              (r) => r.habito_id === h.id,
            )?.concluido;

            return (
              <div
                key={h.id}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  concluido
                    ? "bg-[#48a64b]/10 border-[#48a64b]/30 shadow-inner opacity-60 hover:opacity-100"
                    : "bg-[#121a27] border-[#273b4a] hover:border-[#ca8aef]/40 hover:bg-[#162131]"
                }`}
              >
                <button
                  onClick={() => handleToggle(h)}
                  className='flex items-center gap-4 text-left flex-grow group/btn'
                >
                  <div
                    className={`transition-transform duration-200 group-hover/btn:scale-110 ${concluido ? "text-[#48a64b]" : "text-[#273b4a] group-hover/btn:text-[#ca8aef]/70"}`}
                  >
                    {concluido ? (
                      <CheckCircle2 size={26} />
                    ) : (
                      <Circle size={26} />
                    )}
                  </div>

                  <div className='flex flex-col'>
                    <span
                      className={`font-bold text-sm transition-all ${concluido ? "text-white/30 line-through" : "text-white"}`}
                    >
                      {h.nome}
                    </span>
                    <div className='flex gap-2 mt-1'>
                      <span className='text-[10px] font-black text-[#48a64b]/70'>
                        +{h.xp_ganho} XP
                      </span>
                      <span className='text-[10px] font-black text-red-500/70'>
                        -{h.xp_penalidade} HP
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExcluir(h.id)}
                  className='text-red-500/0 group-hover:text-red-500/40 hover:text-red-500 transition-all p-2'
                  title='Excluir missão'
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className='p-10 text-[#a0aec0]'>Sincronizando registros...</div>
    );

  return (
    <div className='flex flex-col gap-8 w-full'>
      <header className='flex justify-between items-center bg-[#121a27] border border-[#273b4a] p-6 rounded-2xl'>
        <div className='flex items-center gap-4'>
          <Flame className='text-orange-500' size={32} />
          <div>
            <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
              Missões de Sobrevivência
            </h2>
            <p className='text-[#a0aec0] text-xs'>
              Mantenha a ofensiva. A falha gera sangramento de XP.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className='bg-[#ca8aef] text-white p-3 rounded-xl hover:scale-105 transition-all shadow-lg'
        >
          <Plus size={24} />
        </button>
      </header>

      <div className='flex flex-col md:flex-row gap-8'>
        <RenderColuna titulo='Prioridade Alta' tipo='alta' cor='#ca8aef' />
        <RenderColuna titulo='Prioridade Média' tipo='media' cor='#E2B34B' />
        <RenderColuna titulo='Prioridade Baixa' tipo='baixa' cor='#48A64B' />
      </div>

      <FormCriarHabito
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarDados}
      />
    </div>
  );
}
