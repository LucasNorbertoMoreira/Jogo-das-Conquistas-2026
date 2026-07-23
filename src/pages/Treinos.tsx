import { useState, useEffect } from "react";
import { supabase, supabaseTreinos } from "../lib/supabase";
import { Activity, Dumbbell, Timer, TrendingUp, Weight } from "lucide-react";

interface Exercicio {
  id: string;
  name: string;
}

interface SetRecord {
  reps: number;
  weight: number;
  rpe: number;
  workout_sessions: {
    started_at: string;
  };
}

interface DiaDeTreino {
  data: string;
  sets: number;
  volumeTotal: number; // Reps totais ou Segundos totais
  cargaMaxima: number;
  rpeMedio: number;
}

export function Treinos() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [historico, setHistorico] = useState<DiaDeTreino[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega a lista de exercícios disponíveis no banco
  useEffect(() => {
    const carregarExercicios = async () => {
      const { data, error } = await supabaseTreinos
        .from("exercises")
        .select("id, name")
        .order("name");

      if (data) {
        setExercicios(data);
        if (data.length > 0) setExercicioSelecionado(data[0].id);
      }
      if (error) console.error("Erro ao carregar exercícios:", error);
    };
    carregarExercicios();
  }, []);

  // Busca o histórico sempre que o exercício selecionado mudar
  useEffect(() => {
    if (!exercicioSelecionado) return;

    const carregarHistorico = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Faz um Join nas 3 tabelas para trazer os sets, a data da sessão e filtrar pelo exercício
        const { data, error } = await supabaseTreinos
          .from("workout_sets")
          .select(
            `
            reps,
            weight,
            rpe,
            workout_sessions!inner(started_at, user_id)
          `,
          )
          .eq("exercise_id", exercicioSelecionado)
          .eq("workout_sessions.user_id", user.id);

        if (error) throw error;

        // Regra de negócio: Agrupar os sets por dia (Sessão)
        const agrupadoPorDia = (data as unknown as SetRecord[]).reduce(
          (acc, curr) => {
            const dataSessao = new Date(
              curr.workout_sessions.started_at,
            ).toLocaleDateString("pt-BR");

            if (!acc[dataSessao]) {
              acc[dataSessao] = {
                data: dataSessao,
                sets: 0,
                volumeTotal: 0,
                cargaMaxima: 0,
                rpeSoma: 0,
              };
            }

            acc[dataSessao].sets += 1;
            acc[dataSessao].volumeTotal += curr.reps;
            acc[dataSessao].cargaMaxima = Math.max(
              acc[dataSessao].cargaMaxima,
              curr.weight || 0,
            );
            acc[dataSessao].rpeSoma += curr.rpe || 0;

            return acc;
          },
          {} as Record<string, any>,
        );

        // Formata os dados para o array final
        const historicoFormatado: DiaDeTreino[] = Object.values(
          agrupadoPorDia,
        ).map((dia: any) => ({
          data: dia.data,
          sets: dia.sets,
          volumeTotal: dia.volumeTotal,
          cargaMaxima: dia.cargaMaxima,
          rpeMedio: Number((dia.rpeSoma / dia.sets).toFixed(1)),
        }));

        // Ordena do mais recente para o mais antigo (baseado na string da data - requer ajuste dependendo do seu formato local)
        historicoFormatado.sort((a, b) => {
          const [diaA, mesA, anoA] = a.data.split("/");
          const [diaB, mesB, anoB] = b.data.split("/");
          return (
            new Date(`${anoB}-${mesB}-${diaB}`).getTime() -
            new Date(`${anoA}-${mesA}-${diaA}`).getTime()
          );
        });

        setHistorico(historicoFormatado);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [exercicioSelecionado]);

  // Detector de Isometria (Estáticos)
  const nomeExercicioAtual =
    exercicios.find((e) => e.id === exercicioSelecionado)?.name || "";
  const isEstatico = /lever|planche|handstand|hold|L-sit/i.test(
    nomeExercicioAtual,
  );
  const unidadeMetrica = isEstatico ? "Segundos" : "Reps";
  const IconeMetrica = isEstatico ? Timer : Activity;

  return (
    <div className='flex flex-col gap-6 max-w-4xl mx-auto pb-20 mt-8'>
      {/* CABEÇALHO E SELETOR */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#273b4a] pb-4 gap-4'>
        <div>
          <h2 className='text-2xl font-black text-white uppercase tracking-tighter mb-2'>
            Performance
          </h2>
          <select
            value={exercicioSelecionado}
            onChange={(e) => setExercicioSelecionado(e.target.value)}
            className='bg-[#121a27] border border-[#273b4a] text-white p-2 rounded-lg outline-none focus:border-[#ca8aef] text-sm font-bold uppercase tracking-widest cursor-pointer'
          >
            {exercicios.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className='bg-[#121a27] px-4 py-2 rounded-lg border border-[#273b4a]'>
          <span className='text-xs text-[#a0aec0] font-black uppercase tracking-widest flex items-center gap-2'>
            Métrica: <span className='text-[#ca8aef]'>{unidadeMetrica}</span>
          </span>
        </div>
      </div>

      {/* LISTA DE HISTÓRICO DE PROGRESSÃO */}
      <div className='flex flex-col gap-4'>
        {loading ? (
          <p className='text-[#5a6b7a] text-xs font-bold uppercase p-4 text-center'>
            Analisando dados...
          </p>
        ) : historico.length === 0 ? (
          <p className='text-[#5a6b7a] text-xs font-bold uppercase tracking-widest p-4 text-center border border-dashed border-[#273b4a] rounded-xl'>
            Nenhum registro encontrado para este exercício.
          </p>
        ) : (
          historico.map((sessao, index) => {
            // Calcula se houve evolução em relação ao treino anterior (que está no index + 1)
            const sessaoAnterior = historico[index + 1];
            const evolucaoVolume = sessaoAnterior
              ? sessao.volumeTotal - sessaoAnterior.volumeTotal
              : 0;
            const evolucaoCarga = sessaoAnterior
              ? sessao.cargaMaxima - sessaoAnterior.cargaMaxima
              : 0;

            return (
              <div
                key={sessao.data}
                className='bg-[#050e22] border border-[#273b4a] p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-[#ca8aef]/50 transition-colors'
              >
                {/* DATA E SÉRIES */}
                <div className='flex flex-col items-center md:items-start w-full md:w-auto border-b md:border-b-0 border-[#273b4a] pb-4 md:pb-0'>
                  <span className='text-[#5a6b7a] text-[10px] font-black uppercase tracking-widest mb-1'>
                    Sessão
                  </span>
                  <span className='text-lg font-black text-white'>
                    {sessao.data}
                  </span>
                  <span className='text-xs text-[#ca8aef] font-bold mt-1'>
                    {sessao.sets} Séries
                  </span>
                </div>

                {/* MÉTRICAS DE PROGRESSÃO */}
                <div className='flex gap-6 md:gap-12 w-full md:w-auto justify-center'>
                  {/* VOLUME TOTAL */}
                  <div className='flex flex-col items-center'>
                    <span className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest flex items-center gap-1 mb-1'>
                      <IconeMetrica size={14} /> Vol. Total
                    </span>
                    <div className='flex items-end gap-2'>
                      <span className='text-2xl font-black text-white'>
                        {sessao.volumeTotal}
                      </span>
                      {evolucaoVolume !== 0 && (
                        <span
                          className={`text-[10px] font-black mb-1 flex items-center ${evolucaoVolume > 0 ? "text-[#48a64b]" : "text-red-500"}`}
                        >
                          {evolucaoVolume > 0 ? (
                            <TrendingUp size={10} className='mr-0.5' />
                          ) : (
                            <TrendingUp
                              size={10}
                              className='mr-0.5 rotate-180'
                            />
                          )}
                          {Math.abs(evolucaoVolume)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CARGA MÁXIMA / LASTRO */}
                  <div className='flex flex-col items-center'>
                    <span className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest flex items-center gap-1 mb-1'>
                      <Weight size={14} /> Lastro Máx
                    </span>
                    <div className='flex items-end gap-2'>
                      <span className='text-2xl font-black text-white'>
                        {sessao.cargaMaxima}kg
                      </span>
                      {evolucaoCarga !== 0 && (
                        <span
                          className={`text-[10px] font-black mb-1 flex items-center ${evolucaoCarga > 0 ? "text-[#48a64b]" : "text-red-500"}`}
                        >
                          {evolucaoCarga > 0 ? "+" : "-"}
                          {Math.abs(evolucaoCarga)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RPE MÉDIO */}
                  <div className='flex flex-col items-center'>
                    <span className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest flex items-center gap-1 mb-1'>
                      <Dumbbell size={14} /> RPE Médio
                    </span>
                    <span className='text-2xl font-black text-white'>
                      {sessao.rpeMedio}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
