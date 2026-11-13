import { useState, useEffect } from "react";
import { habitService } from "../services/habitService";
import { supabase } from "../lib/supabase";
import { useRpgStore } from "../store/useRpgStore";
import { Calendar, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export function RelatoriosPassados() {
  const dataHoje = new Date().toISOString().split("T")[0];
  const [dataSelecionada, setDataSelecionada] = useState(dataHoje);
  const [relatorio, setRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const addXp = useRpgStore((state) => state.addXp);
  const removeXp = useRpgStore((state) => state.removeXp);

  const carregarRelatorio = async (data: string) => {
    setLoading(true);
    try {
      const [habitos, registros] = await Promise.all([
        habitService.getHabitos(),
        habitService.getRegistrosPorData(data),
      ]);

      const concluidos: any[] = [];
      const falhos: any[] = [];
      let xpGanho = 0;
      let danoTotal = 0;
      const diaDaSemana = new Date(data + "T12:00:00").getDay();

      habitos.forEach((h) => {
        // Ignora hábitos que ainda não existiam na data selecionada
        if (new Date(h.created_at).toISOString().split("T")[0] > data) return;

        // Respeita os dias da semana configurados para o hábito
        if (h.dias_semana && !h.dias_semana.includes(diaDaSemana)) return;

        const reg = registros.find((r: any) => r.habito_id === h.id);
        if (reg?.concluido) {
          concluidos.push(h);
          xpGanho += h.xp_ganho;
        } else {
          falhos.push(h);
          danoTotal += h.xp_penalidade;
        }
      });

      setRelatorio({
        concluidos,
        falhos,
        xpGanho,
        danoTotal,
        saldo: xpGanho - danoTotal,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAlternarStatusHabito = async (
    habito: any,
    novoStatus: boolean,
  ) => {
    setAtualizandoId(habito.id);
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

      const ehDiaPassado = dataSelecionada < dataHoje;
      const xpGanho = Number(habito.xp_ganho) || 0;
      const xpPenalidade = Number(habito.xp_penalidade) || 0;

      if (ehDiaPassado) {
        // Em dias anteriores: estorna a perda (+xp_penalidade) e soma o ganho (+xp_ganho) ao concluir, ou o inverso ao desmarcar
        if (novoStatus) {
          addXp(xpGanho + xpPenalidade);
        } else {
          removeXp(xpGanho + xpPenalidade);
        }
      } else {
        if (novoStatus) {
          addXp(xpGanho);
        } else {
          removeXp(xpGanho);
        }
      }

      await carregarRelatorio(dataSelecionada);
    } catch (e) {
      console.error("Erro ao corrigir hábito no relatório:", e);
    } finally {
      setAtualizandoId(null);
    }
  };

  useEffect(() => {
    carregarRelatorio(dataSelecionada);
  }, [dataSelecionada]);

  return (
    <div className='flex flex-col gap-6 bg-[#121a27] border border-[#273b4a] p-6 rounded-2xl shadow-xl mt-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#273b4a] pb-4'>
        <div className='flex items-center gap-3'>
          <Calendar className='text-[#ca8aef]' size={24} />
          <div>
            <h3 className='text-xl font-black text-white uppercase tracking-tighter'>
              Registros de Campanha
            </h3>
            <p className='text-[#a0aec0] text-xs'>
              Consulte ou corrija hábitos de dias anteriores com recálculo
              automático de XP.
            </p>
          </div>
        </div>

        <input
          type='date'
          max={dataHoje}
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className='bg-[#050e22] border border-[#273b4a] text-white p-2 rounded-lg outline-none focus:border-[#ca8aef] transition-all text-sm font-bold'
        />
      </div>

      {loading ? (
        <div className='py-10 text-center text-[#a0aec0] animate-pulse font-bold tracking-widest uppercase text-sm'>
          Acessando banco de dados...
        </div>
      ) : (
        relatorio && (
          <div className='flex flex-col gap-6'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-[#050e22] p-4 rounded-xl border border-[#273b4a] text-center shadow-inner'>
                <span className='block text-[10px] text-[#48a64b] font-black uppercase mb-1 tracking-widest'>
                  XP Ganho
                </span>
                <span className='text-xl font-black text-white'>
                  +{relatorio.xpGanho}
                </span>
              </div>
              <div className='bg-[#050e22] p-4 rounded-xl border border-[#273b4a] text-center shadow-inner'>
                <span className='block text-[10px] text-red-500 font-black uppercase mb-1 tracking-widest'>
                  HP Perdido
                </span>
                <span className='text-xl font-black text-red-500'>
                  -{relatorio.danoTotal}
                </span>
              </div>
              <div
                className={`p-4 rounded-xl border text-center shadow-inner ${relatorio.saldo >= 0 ? "bg-[#48a64b]/10 border-[#48a64b]/30" : "bg-red-500/10 border-red-500/30"}`}
              >
                <span className='block text-[10px] text-[#a0aec0] font-black uppercase mb-1 tracking-widest'>
                  Saldo Final
                </span>
                <span
                  className={`text-2xl font-black ${relatorio.saldo >= 0 ? "text-[#48a64b]" : "text-red-500"}`}
                >
                  {relatorio.saldo > 0 ? "+" : ""}
                  {relatorio.saldo}
                </span>
              </div>
            </div>

            <div className='grid md:grid-cols-2 gap-6 pt-4'>
              <div className='space-y-3'>
                <h4 className='text-[10px] font-black uppercase tracking-widest text-[#48a64b] flex items-center gap-2 mb-4'>
                  <CheckCircle2 size={16} /> Missões Executadas
                </h4>
                {relatorio.concluidos.length > 0 ? (
                  relatorio.concluidos.map((h: any) => (
                    <div
                      key={h.id}
                      className='bg-[#050e22]/50 p-3 rounded-lg border border-[#48a64b]/30 flex justify-between items-center hover:border-[#48a64b] transition-all gap-2'
                    >
                      <div className='flex flex-col'>
                        <span className='text-white/80 text-sm font-bold'>
                          {h.nome}
                        </span>
                        <span className='text-[#48a64b] text-[10px] font-black'>
                          +{h.xp_ganho} XP
                        </span>
                      </div>
                      <button
                        onClick={() => handleAlternarStatusHabito(h, false)}
                        disabled={atualizandoId === h.id}
                        className='flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#a0aec0] hover:text-red-400 bg-[#121a27] hover:bg-red-500/10 border border-[#273b4a] hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50'
                        title='Desmarcar hábito'
                      >
                        <RotateCcw size={12} />
                        {atualizandoId === h.id ? "..." : "Desmarcar"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='text-[#5a6b7a] text-xs font-bold uppercase tracking-widest p-3 bg-[#050e22]/50 rounded-lg border border-[#273b4a]'>
                    Zero execução
                  </p>
                )}
              </div>

              <div className='space-y-3'>
                <h4 className='text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2 mb-4'>
                  <XCircle size={16} /> Missões Falhas
                </h4>
                {relatorio.falhos.length > 0 ? (
                  relatorio.falhos.map((h: any) => (
                    <div
                      key={h.id}
                      className='bg-[#050e22]/50 p-3 rounded-lg border border-red-500/30 flex justify-between items-center hover:border-red-500 transition-all gap-2'
                    >
                      <div className='flex flex-col'>
                        <span className='text-white/80 text-sm font-bold'>
                          {h.nome}
                        </span>
                        <span className='text-red-500 text-[10px] font-black'>
                          -{h.xp_penalidade} HP
                        </span>
                      </div>
                      <button
                        onClick={() => handleAlternarStatusHabito(h, true)}
                        disabled={atualizandoId === h.id}
                        className='flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#48a64b] hover:text-white bg-[#48a64b]/15 hover:bg-[#48a64b] border border-[#48a64b]/40 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50'
                        title='Corrigir: marcar como concluído e recalcular pontos'
                      >
                        <CheckCircle2 size={12} />
                        {atualizandoId === h.id
                          ? "Salvando..."
                          : "Marcar Concluído"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='text-[#5a6b7a] text-xs font-bold uppercase tracking-widest p-3 bg-[#050e22]/50 rounded-lg border border-[#273b4a]'>
                    Zero falhas
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
