import { useState, useEffect } from "react";
import { habitService } from "../services/habitService";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

export function RelatoriosPassados() {
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [relatorio, setRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

      habitos.forEach((h) => {
        // Ignora hábitos que ainda não existiam na data selecionada
        if (new Date(h.created_at).toISOString().split("T")[0] > data) return;

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

  useEffect(() => {
    carregarRelatorio(dataSelecionada);
  }, [dataSelecionada]);

  return (
    <div className='flex flex-col gap-6 bg-[#121a27] border border-[#273b4a] p-6 rounded-2xl shadow-xl mt-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#273b4a] pb-4'>
        <div className='flex items-center gap-3'>
          <Calendar className='text-[#ca8aef]' size={24} />
          <h3 className='text-xl font-black text-white uppercase tracking-tighter'>
            Registros de Campanha
          </h3>
        </div>

        <input
          type='date'
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
                      className='bg-[#050e22]/50 p-3 rounded-lg border border-[#48a64b]/30 flex justify-between items-center hover:border-[#48a64b] transition-all'
                    >
                      <span className='text-white/80 text-sm font-bold'>
                        {h.nome}
                      </span>
                      <span className='text-[#48a64b] text-[10px] font-black bg-[#48a64b]/10 px-2 py-1 rounded'>
                        +{h.xp_ganho}
                      </span>
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
                      className='bg-[#050e22]/50 p-3 rounded-lg border border-red-500/30 flex justify-between items-center hover:border-red-500 transition-all'
                    >
                      <span className='text-white/80 text-sm font-bold'>
                        {h.nome}
                      </span>
                      <span className='text-red-500 text-[10px] font-black bg-red-500/10 px-2 py-1 rounded'>
                        -{h.xp_penalidade}
                      </span>
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
