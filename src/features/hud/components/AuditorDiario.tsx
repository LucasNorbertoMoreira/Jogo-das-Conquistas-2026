import { useEffect, useState } from "react";
import { habitService } from "../../../services/habitService";
import { supabase } from "../../../lib/supabase";
import { useRpgStore } from "../../../store/useRpgStore";
import { XCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

export function AuditorDiario() {
  const [relatorio, setRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [corrigindoId, setCorrigindoId] = useState<string | null>(null);
  const addXp = useRpgStore((state) => state.addXp);
  const removeXp = useRpgStore((state) => state.removeXp);

  useEffect(() => {
    auditarOntem();
  }, []);

  const auditarOntem = async () => {
    console.log("Iniciando auditoria..."); // Se isso não aparecer no console, o componente não carregou
    // 1. Calcula a data de ontem e hoje
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split("T")[0];
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const dataOntem = ontem.toISOString().split("T")[0];
    const diaDeOntem = new Date(dataOntem + "T12:00:00").getDay();

    // 2. Verifica se a auditoria já rodou hoje
    const ultimaAuditoria = localStorage.getItem("@rpg_last_audit");
    if (ultimaAuditoria === dataHoje) {
      setLoading(false);
      return; // Já foi auditado, libera o acesso
    }

    try {
      // 3. Busca todos os hábitos e os registros de ontem
      const [habitos, registrosOntem] = await Promise.all([
        habitService.getHabitos(),
        habitService.getRegistrosPorData(dataOntem),
      ]);

      if (habitos.length === 0) {
        localStorage.setItem("@rpg_last_audit", dataHoje);
        setLoading(false);
        return;
      }

      // 4. Matemática da Alta Performance
      const concluidos: any[] = [];
      const falhos: any[] = [];
      let xpGanhoOntem = 0;
      let danoAplicado = 0;

      habitos.forEach((habito) => {
        // 1. Extrai apenas o dia (YYYY-MM-DD) da criação do hábito, ignorando as horas
        const dataCriacaoHabito = new Date(habito.created_at)
          .toISOString()
          .split("T")[0];

        // 2. CORREÇÃO: Se a data de criação for MAIOR que a string de ontem, significa que foi criado hoje.
        // Se foi criado ontem (igual a dataOntem) ou antes, ele DEVE ser cobrado.
        if (dataCriacaoHabito > dataOntem) return;

        // 3. Regra dos dias da semana (continua igual)
        if (habito.dias_semana && !habito.dias_semana.includes(diaDeOntem))
          return;

        const registro = registrosOntem.find(
          (r: any) => r.habito_id === habito.id,
        );

        if (registro?.concluido) {
          concluidos.push(habito);
          xpGanhoOntem += habito.xp_ganho;
        } else {
          falhos.push(habito);
          danoAplicado += habito.xp_penalidade;
        }
      });
      // Se não teve falhas, apenas salva e segue. Sem punição.
      if (falhos.length === 0) {
        localStorage.setItem("@rpg_last_audit", dataHoje);
        setLoading(false);
        return;
      }

      // 5. Prepara o dossiê para jogar na tela
      setRelatorio({
        dataHoje,
        dataOntem,
        concluidos,
        falhos,
        xpGanhoOntem,
        danoAplicado,
        saldo: xpGanhoOntem - danoAplicado,
      });
    } catch (error) {
      console.error("Erro na auditoria:", error);
    } finally {
      setLoading(false);
    }
  };

  const corrigirHabitoOntem = async (habito: any) => {
    if (!relatorio) return;
    setCorrigindoId(habito.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Marca como concluído na data de ontem
      await habitService.toggleHabito(
        habito.id,
        true,
        user.id,
        relatorio.dataOntem,
      );

      // Como o dano da auditoria ainda não foi descontado, apenas adicionamos o XP ganho que faltou ontem
      addXp(habito.xp_ganho);

      const novosFalhos = relatorio.falhos.filter(
        (f: any) => f.id !== habito.id,
      );
      const novosConcluidos = [...relatorio.concluidos, habito];
      const novoXpGanho = relatorio.xpGanhoOntem + habito.xp_ganho;
      const novoDano = Math.max(
        0,
        relatorio.danoAplicado - habito.xp_penalidade,
      );

      if (novosFalhos.length === 0) {
        localStorage.setItem("@rpg_last_audit", relatorio.dataHoje);
        setRelatorio(null);
      } else {
        setRelatorio({
          ...relatorio,
          concluidos: novosConcluidos,
          falhos: novosFalhos,
          xpGanhoOntem: novoXpGanho,
          danoAplicado: novoDano,
          saldo: novoXpGanho - novoDano,
        });
      }
    } catch (error) {
      console.error("Erro ao corrigir hábito na auditoria:", error);
    } finally {
      setCorrigindoId(null);
    }
  };

  const aceitarConsequencias = () => {
    // Aplica o sangramento real no XP apenas para o que falhou
    if (relatorio.danoAplicado > 0) {
      removeXp(relatorio.danoAplicado);
    }

    // Assina a auditoria de hoje para não rodar de novo
    localStorage.setItem("@rpg_last_audit", relatorio.dataHoje);
    setRelatorio(null);
  };

  if (loading || !relatorio) return null;

  return (
    <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[999] p-4'>
      <div className='bg-[#050e22] border border-red-900/50 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] relative'>
        {/* Header Intimidador */}
        <div className='bg-gradient-to-r from-red-950 to-[#050e22] p-6 border-b border-red-900/30 flex items-center gap-4'>
          <ShieldAlert className='text-red-500' size={32} />
          <div>
            <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
              Auditoria Noturna
            </h2>
            <p className='text-red-400/80 text-xs font-bold uppercase tracking-widest mt-1'>
              Inconsistência Detectada
            </p>
          </div>
        </div>

        <div className='p-6 flex flex-col gap-6'>
          <p className='text-[#a0aec0] text-sm text-center'>
            Você ignorou obrigações críticas ontem. O sistema não perdoa falhas
            na base. Eis o saldo da sua negligência:
          </p>

          {/* Saldo Visual */}
          <div className='flex justify-between items-center bg-[#121a27] border border-[#273b4a] p-4 rounded-xl'>
            <div className='text-center flex-1 border-r border-[#273b4a]'>
              <span className='block text-[10px] text-[#48a64b] font-black uppercase mb-1'>
                XP Conquistado
              </span>
              <span className='text-xl font-bold text-white'>
                +{relatorio.xpGanhoOntem}
              </span>
            </div>
            <div className='text-center flex-1 border-r border-[#273b4a]'>
              <span className='block text-[10px] text-red-500 font-black uppercase mb-1'>
                Dano Recebido
              </span>
              <span className='text-xl font-bold text-red-500'>
                -{relatorio.danoAplicado}
              </span>
            </div>
            <div className='text-center flex-1'>
              <span className='block text-[10px] text-[#a0aec0] font-black uppercase mb-1'>
                Saldo Final
              </span>
              <span
                className={`text-2xl font-black ${relatorio.saldo < 0 ? "text-red-500" : "text-[#48a64b]"}`}
              >
                {relatorio.saldo > 0 ? "+" : ""}
                {relatorio.saldo}
              </span>
            </div>
          </div>

          {/* Lista de Falhas */}
          <div>
            <h3 className='text-red-500 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2'>
              <XCircle size={14} /> Missões Abandonadas
            </h3>
            <div className='flex flex-col gap-2 max-h-60 overflow-y-auto pr-1'>
              {relatorio.falhos.map((f: any) => (
                <div
                  key={f.id}
                  className='flex justify-between items-center bg-red-950/20 border border-red-900/30 p-3 rounded-lg gap-3'
                >
                  <div className='flex flex-col'>
                    <span className='text-white/90 text-sm font-bold'>
                      {f.nome}
                    </span>
                    <span className='text-red-500 text-xs font-black'>
                      -{f.xp_penalidade} HP (ou +{f.xp_ganho} XP se concluído)
                    </span>
                  </div>
                  <button
                    onClick={() => corrigirHabitoOntem(f)}
                    disabled={corrigindoId === f.id}
                    className='flex items-center gap-1.5 bg-[#48a64b]/20 hover:bg-[#48a64b] text-[#48a64b] hover:text-white border border-[#48a64b]/40 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 disabled:opacity-50'
                    title='Marcar que este hábito foi cumprido ontem'
                  >
                    <CheckCircle2 size={14} />
                    {corrigindoId === f.id ? "Salvando..." : "Eu Cumpri"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={aceitarConsequencias}
            className='w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
          >
            Aceitar Sangramento e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
