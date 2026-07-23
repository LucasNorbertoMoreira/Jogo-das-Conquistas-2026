import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Trash2,
  Plus,
  Save,
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

  // Novos States para Gestão de Hoje e CRUD
  const [sessaoHoje, setSessaoHoje] = useState<any>(null);
  const [notasHoje, setNotasHoje] = useState<string>("");
  const [salvandoNotas, setSalvandoNotas] = useState(false);

  useEffect(() => {
    carregarExercicios();
    verificarSessaoDeHoje();
  }, []);

  const carregarExercicios = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setExercicios(data || []);
    } catch (error) {
      console.error("Erro ao carregar lista:", error);
    }
  };

  const verificarSessaoDeHoje = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia

    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, notes, started_at")
        .gte("started_at", hoje.toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSessaoHoje(data);
        setNotasHoje(data.notes || "");
      }
    } catch (error: any) {
      if (error.code !== "PGRST116")
        console.error("Erro ao buscar sessão de hoje:", error);
    }
  };

  const salvarNotasDaSessao = async () => {
    if (!sessaoHoje) return;
    setSalvandoNotas(true);
    try {
      const { error } = await supabase
        .from("workout_sessions")
        .update({ notes: notasHoje })
        .eq("id", sessaoHoje.id);
      if (error) throw error;
      alert("Contexto de combate registrado.");
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    } finally {
      setSalvandoNotas(false);
    }
  };

  // Função para deletar um dado contaminado
  const deletarSerie = async (setId: string) => {
    if (
      !window.confirm(
        "Isso vai apagar este registro permanentemente. Prosseguir?",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("workout_sets")
        .delete()
        .eq("id", setId);
      if (error) throw error;
      carregarHistorico(); // Recarrega a tela
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  // Aqui você deve manter o seu useEffect atual de carregarHistorico,
  // mas adicione o "id" no select do supabase:
  // .select('id, set_number, reps, weight, rpe, workout_sessions!inner(started_at)')

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
          id,
          set_number,
          reps,
          weight,
          rpe,
          workout_sessions!inner(started_at)
        `,
        )
        .eq("exercise_id", exercicioSelecionado)
        .order("set_number", { ascending: true });

      if (error) throw error;

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
              seriesDetalhas: [],
            };
          }

          acc[dataSessao].sets += 1;
          acc[dataSessao].volumeTotal += curr.reps;
          acc[dataSessao].cargaMaxima = Math.max(
            acc[dataSessao].cargaMaxima,
            curr.weight || 0,
          );
          acc[dataSessao].volumeLoad += curr.reps * (curr.weight || 0);
          acc[dataSessao].rpeSoma += curr.rpe || 0;

          acc[dataSessao].seriesDetalhas.push({
            id: curr.id, // ID Necessário para o Delete/Update
            set_number: curr.set_number,
            reps: curr.reps,
            weight: curr.weight,
            rpe: curr.rpe,
          });

          return acc;
        },
        {} as Record<string, any>,
      );

      const historicoOrdenado = Object.values(agrupadoPorDia).sort(
        (a: any, b: any) => a.timestamp - b.timestamp,
      );

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

      setHistorico(historicoComDeltas.reverse());
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [exercicioSelecionado]);

  const toggleExpandir = (dataSessao: string) => {
    setSessoesExpandidas((prev) => ({
      ...prev,
      [dataSessao]: !prev[dataSessao],
    }));
  };

  const chartData = [...historico].reverse().slice(-10);

  return (
    <div className='p-6 bg-[#121a27] rounded-2xl border border-[#273b4a] space-y-8'>
      {/* 1. Painel de Contexto do Dia (Sessão Atual) */}
      {sessaoHoje && (
        <div className='bg-[#050e22] border border-[#273b4a] rounded-xl p-5 relative overflow-hidden'>
          <div className='absolute top-0 left-0 w-1 h-full bg-[#ca8aef]'></div>
          <h3 className='text-white font-bold text-lg mb-3 flex items-center gap-2'>
            Relatório de Batalha (Hoje)
          </h3>
          <textarea
            value={notasHoje}
            onChange={(e) => setNotasHoje(e.target.value)}
            placeholder='Ex: Sinusite atacada. Dormi mal. Volume reduzido de propósito para não fritar o SNC...'
            className='w-full bg-[#121a27] border border-[#273b4a] rounded-lg p-3 text-sm text-[#a0aec0] focus:outline-none focus:border-[#ca8aef] min-h-[80px]'
          />
          <button
            onClick={salvarNotasDaSessao}
            disabled={salvandoNotas}
            className='mt-3 bg-[#273b4a] hover:bg-[#ca8aef] hover:text-[#050e22] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2'
          >
            <Save size={16} />
            {salvandoNotas ? "Consolidando..." : "Gravar Contexto"}
          </button>
        </div>
      )}

      {/* 2. Seletor de Alvo Operacional (Mantido igual) */}
      <div>
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
          Extraindo métricas...
        </div>
      ) : historico.length > 0 ? (
        <>
          {/* Sparkline (Mantido igual) */}
          <div className='h-24 bg-[#050e22] p-4 rounded-xl border border-[#273b4a]'>
            <p className='text-xs text-[#a0aec0] mb-2 uppercase font-bold tracking-wider'>
              Tendência de Volume
            </p>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
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

          {/* Lista de Sessões com Botões de CRUD embutidos */}
          <div className='space-y-4'>
            {historico.map((dia) => (
              <div
                key={dia.data}
                className='bg-[#050e22] rounded-xl border border-[#273b4a] overflow-hidden'
              >
                {/* Header do Card (Mantido igual) */}
                <div
                  className='p-5 flex justify-between items-center cursor-pointer hover:bg-[#1a2536]'
                  onClick={() => toggleExpandir(dia.data)}
                >
                  {/* ... conteúdo do header igual ao anterior ... */}
                  <div>
                    <p className='text-white font-bold text-lg'>{dia.data}</p>
                    <span className='text-xs px-2 py-0.5 rounded-md bg-[#273b4a] text-[#a0aec0]'>
                      Vol: {dia.volumeTotal} reps
                    </span>
                  </div>
                  {sessoesExpandidas[dia.data] ? (
                    <ChevronUp className='text-[#ca8aef]' />
                  ) : (
                    <ChevronDown className='text-[#a0aec0]' />
                  )}
                </div>

                {/* Corpo do Card: Anatomia da Fadiga + CRUD */}
                {sessoesExpandidas[dia.data] && (
                  <div className='px-5 pb-5 pt-2 border-t border-[#273b4a] bg-[#0c131e]'>
                    <h4 className='text-xs uppercase text-[#a0aec0] font-bold tracking-wider mb-3'>
                      Anatomia das Séries
                    </h4>
                    <div className='space-y-2'>
                      {dia.seriesDetalhas.map((serie: any) => (
                        <div
                          key={serie.id}
                          className='flex justify-between items-center bg-[#121a27] p-3 rounded-lg border border-[#273b4a]/50 group'
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
                            className={`text-sm px-2 py-1 rounded font-bold ${serie.rpe >= 9 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                          >
                            RPE {serie.rpe}
                          </span>

                          {/* Ações Visíveis apenas no Hover da linha */}
                          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button
                              onClick={() =>
                                alert(
                                  "Para editar, construa um modal ou apague a série e recrie.",
                                )
                              }
                              className='text-[#a0aec0] hover:text-white'
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deletarSerie(serie.id)}
                              className='text-red-400 hover:text-red-300'
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Botão de Adicionar Manual Rápido */}
                    <button className='mt-4 w-full border border-dashed border-[#273b4a] text-[#a0aec0] hover:text-white hover:border-[#ca8aef] rounded-lg p-2 text-sm flex items-center justify-center gap-2 transition-colors'>
                      <Plus size={16} /> Corrigir Omissão da Máquina
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
