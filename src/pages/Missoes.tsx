import { useEffect, useState } from "react";
import { habitService } from "../services/habitService";
import { supabase } from "../lib/supabase";
import {
  CheckCircle2,
  Circle,
  Flame,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
} from "lucide-react";
import { useRpgStore } from "../store/useRpgStore";
import { FormCriarHabito } from "./FormCriarHabito";

export function Missoes() {
  const dataHoje = new Date().toISOString().split("T")[0];
  const [dataSelecionada, setDataSelecionada] = useState<string>(dataHoje);
  const [habitos, setHabitos] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackCorrecao, setFeedbackCorrecao] = useState<string | null>(null);

  const addXp = useRpgStore((state) => state.addXp);
  const removeXp = useRpgStore((state) => state.removeXp);

  const ehDiaAnterior = dataSelecionada < dataHoje;

  const carregarDados = async (dataAlvo = dataSelecionada) => {
    try {
      const [h, r] = await Promise.all([
        habitService.getHabitos(),
        habitService.getRegistrosPorData(dataAlvo),
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
    carregarDados(dataSelecionada);
  }, [dataSelecionada]);

  const alterarDia = (deltaDias: number) => {
    const dataAtual = new Date(dataSelecionada + "T12:00:00");
    dataAtual.setDate(dataAtual.getDate() + deltaDias);
    const novaData = dataAtual.toISOString().split("T")[0];
    if (novaData <= dataHoje) {
      setDataSelecionada(novaData);
    }
  };

  const formatarRotuloData = (dataStr: string) => {
    if (dataStr === dataHoje) return "Hoje";
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const dataOntem = ontem.toISOString().split("T")[0];
    if (dataStr === dataOntem) return "Ontem";
    return new Date(dataStr + "T12:00:00").toLocaleDateString("pt-BR");
  };

  const handleToggle = async (habito: any) => {
    const registro = registros.find((r) => r.habito_id === habito.id);
    const novoStatus = !registro?.concluido;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await habitService.toggleHabito(
        habito.id,
        novoStatus,
        user.id,
        dataSelecionada,
      );

      if (ehDiaAnterior) {
        // Recálculo retroativo: estorna a penalidade (-HP) e adiciona os pontos (+XP), ou vice-versa ao desmarcar
        const xpGanho = Number(habito.xp_ganho) || 0;
        const xpPenalidade = Number(habito.xp_penalidade) || 0;
        const totalRecalculo = xpGanho + xpPenalidade;

        if (novoStatus) {
          addXp(totalRecalculo);
          setFeedbackCorrecao(
            `Hábito "${habito.nome}" corrigido! Penalidade estornada (+${xpPenalidade} XP) + Ganho adicionado (+${xpGanho} XP) = +${totalRecalculo} XP no total.`,
          );
        } else {
          removeXp(totalRecalculo);
          setFeedbackCorrecao(
            `Hábito "${habito.nome}" desmarcado em dia anterior: -${xpGanho} XP (ganho removido) e -${xpPenalidade} XP (penalidade aplicada) = -${totalRecalculo} XP.`,
          );
        }
        setTimeout(() => setFeedbackCorrecao(null), 5000);
      } else {
        novoStatus ? addXp(habito.xp_ganho) : removeXp(habito.xp_ganho);
      }

      carregarDados(dataSelecionada);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Remover este hábito da sua rotina?")) return;
    try {
      await habitService.deleteHabito(id);
      carregarDados(dataSelecionada);
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
    const diaSemanaAlvo = new Date(dataSelecionada + "T12:00:00").getDay();
    // 1. Filtra os hábitos pela coluna correta (baixa, media, alta) e pelo dia da semana da data selecionada
    let habitosDaColuna = habitos.filter((h) => {
      if (ehDiaAnterior && h.created_at) {
        const dataCriacao = new Date(h.created_at).toISOString().split("T")[0];
        if (dataCriacao > dataSelecionada) return false;
      }
      return (
        h.tipo === tipo &&
        h.dias_semana &&
        h.dias_semana.includes(diaSemanaAlvo)
      );
    });

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
    <div className='flex flex-col gap-6 w-full'>
      <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121a27] border border-[#273b4a] p-6 rounded-2xl'>
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

        <div className='flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end'>
          {/* Seletor de Data para Correção Retroativa */}
          <div className='flex items-center gap-1 bg-[#050e22] border border-[#273b4a] rounded-xl p-1.5'>
            <button
              onClick={() => alterarDia(-1)}
              className='p-2 rounded-lg text-[#a0aec0] hover:text-white hover:bg-[#121a27] transition-all'
              title='Dia anterior'
            >
              <ChevronLeft size={18} />
            </button>

            <div className='flex items-center gap-2 px-2'>
              <span
                className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  ehDiaAnterior
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-[#ca8aef]/20 text-[#ca8aef]"
                }`}
              >
                {formatarRotuloData(dataSelecionada)}
              </span>
              <input
                type='date'
                max={dataHoje}
                value={dataSelecionada}
                onChange={(e) => {
                  if (e.target.value && e.target.value <= dataHoje) {
                    setDataSelecionada(e.target.value);
                  }
                }}
                className='bg-transparent text-white text-xs font-bold outline-none cursor-pointer'
              />
            </div>

            <button
              onClick={() => alterarDia(1)}
              disabled={!ehDiaAnterior}
              className='p-2 rounded-lg text-[#a0aec0] hover:text-white hover:bg-[#121a27] transition-all disabled:opacity-20 disabled:pointer-events-none'
              title='Próximo dia'
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {ehDiaAnterior && (
            <button
              onClick={() => setDataSelecionada(dataHoje)}
              className='flex items-center gap-1.5 bg-[#273b4a] hover:bg-[#ca8aef] text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all'
              title='Voltar para Hoje'
            >
              <RotateCcw size={14} />
              Hoje
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className='bg-[#ca8aef] text-white p-3 rounded-xl hover:scale-105 transition-all shadow-lg'
            title='Novo Hábito'
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {ehDiaAnterior && (
        <div className='bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <History className='text-amber-400 shrink-0' size={22} />
            <div>
              <h4 className='text-amber-400 text-xs font-black uppercase tracking-widest'>
                Modo de Correção Retroativa ({formatarRotuloData(dataSelecionada)})
              </h4>
              <p className='text-[#a0aec0] text-xs mt-0.5'>
                Esqueceu de marcar um hábito? Marque-o abaixo para estornar a
                perda de penalidade (-HP) e receber os pontos (+XP) da missão.
              </p>
            </div>
          </div>
        </div>
      )}

      {feedbackCorrecao && (
        <div className='bg-[#48a64b]/15 border border-[#48a64b]/40 text-[#48a64b] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between'>
          <span>{feedbackCorrecao}</span>
          <button
            onClick={() => setFeedbackCorrecao(null)}
            className='text-white/60 hover:text-white ml-4 text-xs uppercase font-black'
          >
            Fechar
          </button>
        </div>
      )}

      <div className='flex flex-col md:flex-row gap-8'>
        <RenderColuna titulo='Prioridade Alta' tipo='alta' cor='#ca8aef' />
        <RenderColuna titulo='Prioridade Média' tipo='media' cor='#E2B34B' />
        <RenderColuna titulo='Prioridade Baixa' tipo='baixa' cor='#48A64B' />
      </div>

      <FormCriarHabito
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => carregarDados(dataSelecionada)}
      />
    </div>
  );
}
