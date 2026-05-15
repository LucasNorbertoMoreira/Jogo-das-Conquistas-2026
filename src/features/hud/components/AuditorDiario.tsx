import { useEffect, useState } from "react";
import { habitService } from "../../../services/habitService";
import { useRpgStore } from "../../../store/useRpgStore";
import { AlertOctagon, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export function AuditorDiario() {
  const [relatorio, setRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        // Ignora hábitos criados hoje (não seria justo cobrar por ontem)
        if (new Date(habito.created_at) > ontem) return;

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
            <div className='flex flex-col gap-2'>
              {relatorio.falhos.map((f: any) => (
                <div
                  key={f.id}
                  className='flex justify-between bg-red-950/20 border border-red-900/30 p-3 rounded-lg'
                >
                  <span className='text-white/80 text-sm font-bold'>
                    {f.nome}
                  </span>
                  <span className='text-red-500 text-sm font-black'>
                    -{f.xp_penalidade} HP
                  </span>
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
