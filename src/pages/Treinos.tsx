import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function Treinos() {
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessoesExpandidas, setSessoesExpandidas] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const carregarExercicios = async () => {
      try {
        const { data, error } = await supabase
          .from("exercises")
          .select("id, name")
          .order("name");
        if (error) throw error;
        setExercicios(data || []);
      } catch (error) {
        console.error("Erro ao carregar lista de exercícios:", error);
      }
    };
    carregarExercicios();
  }, []);

  useEffect(() => {
    const carregarHistorico = async () => {
      if (!exercicioSelecionado) {
        setHistorico([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workout_sets")
          .select(
            `
            set_number,
            reps,
            weight,
            rpe,
            workout_sessions!inner(started_at)
          `,
          )
          .eq("exercise_id", exercicioSelecionado)
          .order("set_number", { ascending: true }); // Garante a ordem correta das séries

        if (error) throw error;

        // 1. Agrupamento e Quebra de Séries (Anatomia da Fadiga)
        const agrupadoPorDia = (data as any[]).reduce(
          (acc, curr) => {
            const dataSessao = new Date(
              curr.workout_sessions.started_at,
            ).toLocaleDateString("pt-BR");

            if (!acc[dataSessao]) {
              acc[dataSessao] = {
                data: dataSessao,
                timestamp: new Date(curr.workout_sessions.started_at).getTime(),
                sets: 0,
                volumeTotal: 0,
                cargaMaxima: 0,
                volumeLoad: 0,
                rpeSoma: 0,
                seriesDetalhas: [], // Guarda a anatomia da fadiga
              };
            }

            acc[dataSessao].sets += 1;
            acc[dataSessao].volumeTotal += curr.reps;
            acc[dataSessao].cargaMaxima = Math.max(
              acc[dataSessao].cargaMaxima,
              curr.weight || 0,
            );
            acc[dataSessao].volumeLoad += curr.reps * (curr.weight || 0); // Resalva feita acima
            acc[dataSessao].rpeSoma += curr.rpe || 0;

            acc[dataSessao].seriesDetalhas.push({
              set_number: curr.set_number,
              reps: curr.reps,
              weight: curr.weight,
              rpe: curr.rpe,
            });

            return acc;
          },
          {} as Record<string, any>,
        );

        // 2. Ordenação Cronológica (Mais antigo pro mais novo) para calcular os Deltas
        const historicoOrdenado = Object.values(agrupadoPorDia).sort(
          (a: any, b: any) => a.timestamp - b.timestamp,
        );

        // 3. O Fator Delta (Comparação Imediata)
        const historicoComDeltas = historicoOrdenado.map(
          (dia: any, index: number, array: any[]) => {
            const sessaoAnterior = index > 0 ? array[index - 1] : null;

            return {
              ...dia,
              rpeMedio: Number((dia.rpeSoma / dia.sets).toFixed(1)),
              deltaVolume: sessaoAnterior
                ? dia.volumeTotal - sessaoAnterior.volumeTotal
                : 0,
              deltaCarga: sessaoAnterior
                ? dia.cargaMaxima - sessaoAnterior.cargaMaxima
                : 0,
            };
          },
        );

        // Inverte para exibir o mais recente no topo
        setHistorico(historicoComDeltas.reverse());
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [exercicioSelecionado]);

  const toggleExpandir = (dataSessao: string) => {
    setSessoesExpandidas((prev) => ({
      ...prev,
      [dataSessao]: !prev[dataSessao],
    }));
  };

  // Prepara dados do Sparkline (cronológico, limite de 10 sessões)
  const chartData = [...historico].reverse().slice(-10);

  return (
    <div className='p-6 bg-[#121a27] rounded-2xl border border-[#273b4a]'>
      {/* Seletor */}
      <div className='mb-8'>
        <label className='block text-[#a0aec0] mb-2 text-sm font-semibold tracking-wide uppercase'>
          Catálogo de Exercícios
        </label>
        <select
          className='w-full bg-[#050e22] border border-[#273b4a] rounded-xl p-4 text-white focus:outline-none focus:border-[#ca8aef] transition-colors'
          value={exercicioSelecionado}
          onChange={(e) => setExercicioSelecionado(e.target.value)}
        >
          <option value=''>Selecione o alvo operacional...</option>
          {exercicios.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className='text-[#ca8aef] animate-pulse font-medium'>
          Extraindo métricas de performance...
        </div>
      ) : historico.length > 0 ? (
        <>
          {/* Sparkline de Tendência */}
          <div className='mb-8 h-24 bg-[#050e22] p-4 rounded-xl border border-[#273b4a]'>
            <p className='text-xs text-[#a0aec0] mb-2 uppercase font-bold tracking-wider'>
              Tendência de Volume (Últ. 10 Sessões)
            </p>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                {/* Sparkline de Tendência */}
                <div className='mb-8 h-24 bg-[#050e22] p-4 rounded-xl border border-[#273b4a]'>
                  <p className='text-xs text-[#a0aec0] mb-2 uppercase font-bold tracking-wider'>
                    Tendência de Volume (Últ. 10 Sessões)
                  </p>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={chartData}>
                      {/* A CORREÇÃO ENTRA AQUI: Define a data como título, mas esconde a linha */}
                      <XAxis dataKey='data' hide={true} />

                      <Line
                        type='monotone'
                        dataKey='volumeTotal'
                        stroke='#ca8aef'
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ca8aef" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121a27",
                          borderColor: "#273b4a",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                        itemStyle={{ color: "#ca8aef" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Line
                  type='monotone'
                  dataKey='volumeTotal'
                  stroke='#ca8aef'
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ca8aef" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121a27",
                    borderColor: "#273b4a",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#ca8aef" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de Sessões */}
          <div className='space-y-4'>
            {historico.map((dia) => (
              <div
                key={dia.data}
                className='bg-[#050e22] rounded-xl border border-[#273b4a] overflow-hidden transition-all'
              >
                {/* Header do Card (Resumo) */}
                <div
                  className='p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-[#1a2536] transition-colors gap-4'
                  onClick={() => toggleExpandir(dia.data)}
                >
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='text-white font-bold text-lg'>{dia.data}</p>
                      <span className='text-xs px-2 py-0.5 rounded-md bg-[#273b4a] text-[#a0aec0]'>
                        {dia.sets} séries • RPE {dia.rpeMedio}
                      </span>
                    </div>
                    {/* Fator Delta Renderizado */}
                    <div className='flex items-center gap-4 text-sm mt-2 md:mt-0'>
                      <div className='flex items-center gap-1'>
                        <span className='text-[#a0aec0]'>
                          Vol:{" "}
                          <strong className='text-white'>
                            {dia.volumeTotal} reps
                          </strong>
                        </span>
                        {dia.deltaVolume > 0 ? (
                          <span className='text-green-400 flex items-center text-xs'>
                            <TrendingUp size={12} className='mr-0.5' />+
                            {dia.deltaVolume}
                          </span>
                        ) : dia.deltaVolume < 0 ? (
                          <span className='text-red-400 flex items-center text-xs'>
                            <TrendingDown size={12} className='mr-0.5' />
                            {dia.deltaVolume}
                          </span>
                        ) : (
                          <span className='text-[#a0aec0] flex items-center text-xs'>
                            <Minus size={12} />
                          </span>
                        )}
                      </div>

                      {dia.cargaMaxima > 0 && (
                        <div className='flex items-center gap-1'>
                          <span className='text-[#a0aec0]'>
                            Carga:{" "}
                            <strong className='text-white'>
                              {dia.cargaMaxima}kg
                            </strong>
                          </span>
                          {dia.deltaCarga > 0 ? (
                            <span className='text-green-400 flex items-center text-xs'>
                              <TrendingUp size={12} className='mr-0.5' />+
                              {dia.deltaCarga}
                            </span>
                          ) : dia.deltaCarga < 0 ? (
                            <span className='text-red-400 flex items-center text-xs'>
                              <TrendingDown size={12} className='mr-0.5' />
                              {dia.deltaCarga}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center gap-4 w-full md:w-auto justify-between md:justify-end'>
                    {dia.volumeLoad > 0 && (
                      <div className='text-right'>
                        <p className='text-[#ca8aef] font-black text-lg'>
                          {dia.volumeLoad}kg
                        </p>
                        <p className='text-[10px] text-[#a0aec0] uppercase tracking-wider'>
                          Volume Load Adicional
                        </p>
                      </div>
                    )}
                    {sessoesExpandidas[dia.data] ? (
                      <ChevronUp className='text-[#ca8aef]' />
                    ) : (
                      <ChevronDown className='text-[#a0aec0]' />
                    )}
                  </div>
                </div>

                {/* Corpo do Card: Anatomia da Fadiga (Accordion) */}
                {sessoesExpandidas[dia.data] && (
                  <div className='px-5 pb-5 pt-2 border-t border-[#273b4a] bg-[#0c131e]'>
                    <h4 className='text-xs uppercase text-[#a0aec0] font-bold tracking-wider mb-3'>
                      Anatomia das Séries
                    </h4>
                    <div className='space-y-2'>
                      {dia.seriesDetalhas.map((serie: any, idx: number) => (
                        <div
                          key={idx}
                          className='flex justify-between items-center bg-[#121a27] p-3 rounded-lg border border-[#273b4a]/50'
                        >
                          <span className='text-[#a0aec0] text-sm font-medium w-16'>
                            Série {serie.set_number}
                          </span>
                          <span className='text-white font-bold'>
                            {serie.reps} reps
                          </span>
                          <span className='text-white w-16 text-center'>
                            {serie.weight ? `+${serie.weight}kg` : "BW"}
                          </span>
                          <span
                            className={`text-sm px-2 py-1 rounded font-bold ${serie.rpe >= 9 ? "bg-red-500/20 text-red-400" : serie.rpe >= 7 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}
                          >
                            RPE {serie.rpe}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        exercicioSelecionado && (
          <div className='text-center p-8 border border-dashed border-[#273b4a] rounded-xl'>
            <p className='text-[#a0aec0] text-lg'>
              Sem dados de combate para este alvo.
            </p>
            <p className='text-sm text-[#a0aec0]/70 mt-2'>Vá treinar.</p>
          </div>
        )
      )}
    </div>
  );
}
