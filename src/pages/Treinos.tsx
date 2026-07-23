import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function Treinos() {
  // 1. Declaração dos Estados do React
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<string>("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 2. Carregar o catálogo de exercícios ao abrir a tela
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
  }, []); // Array vazio garante que rode apenas uma vez na montagem

  // 3. Carregar o histórico sempre que o exercício selecionado mudar
  useEffect(() => {
    const carregarHistorico = async () => {
      if (!exercicioSelecionado) {
        setHistorico([]); // Limpa a tela se nada estiver selecionado
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workout_sets")
          .select(
            `
            reps,
            weight,
            rpe,
            workout_sessions!inner(started_at)
          `,
          )
          .eq("exercise_id", exercicioSelecionado);

        if (error) throw error;

        // Regra de negócio: Agrupar os sets por dia (Sessão)
        const agrupadoPorDia = (data as any[]).reduce(
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

        // Formata e ordena
        const historicoFormatado = Object.values(agrupadoPorDia).map(
          (dia: any) => ({
            data: dia.data,
            sets: dia.sets,
            volumeTotal: dia.volumeTotal,
            cargaMaxima: dia.cargaMaxima,
            rpeMedio: Number((dia.rpeSoma / dia.sets).toFixed(1)),
          }),
        );

        historicoFormatado.sort((a: any, b: any) => {
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
  }, [exercicioSelecionado]); // Executa sempre que essa variável mudar

  // 4. Renderização da Interface
  return (
    <div className='p-6 bg-[#121a27] rounded-2xl border border-[#273b4a]'>
      <div className='mb-6'>
        <label className='block text-[#a0aec0] mb-2 text-sm'>
          Selecione o Exercício
        </label>
        <select
          className='w-full bg-[#050e22] border border-[#273b4a] rounded-xl p-3 text-white focus:outline-none focus:border-[#ca8aef]'
          value={exercicioSelecionado}
          onChange={(e) => setExercicioSelecionado(e.target.value)}
        >
          <option value=''>Selecione...</option>
          {exercicios.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className='text-[#a0aec0]'>Buscando dados de performance...</div>
      ) : historico.length > 0 ? (
        <div className='space-y-4'>
          {historico.map((dia, index) => (
            <div
              key={index}
              className='bg-[#050e22] p-4 rounded-xl border border-[#273b4a] flex justify-between items-center'
            >
              <div>
                <p className='text-white font-bold'>{dia.data}</p>
                <p className='text-sm text-[#a0aec0]'>
                  {dia.sets} séries • RPE Médio: {dia.rpeMedio}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-[#ca8aef] font-bold'>
                  Vol: {dia.volumeTotal} reps
                </p>
                <p className='text-sm text-[#a0aec0]'>
                  Carga Máx: {dia.cargaMaxima}kg
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        exercicioSelecionado && (
          <div className='text-[#a0aec0]'>
            Nenhum registro encontrado para este exercício.
          </div>
        )
      )}
    </div>
  );
}
