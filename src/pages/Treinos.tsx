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
  X,
  Check,
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

  // States para Gestão de Hoje
  const [sessaoHoje, setSessaoHoje] = useState<any>(null);
  const [notasHoje, setNotasHoje] = useState<string>("");
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const [feedbackNotas, setFeedbackNotas] = useState(false);

  // States para Edição Inline de uma Série Existente
  const [editandoSerieId, setEditandoSerieId] = useState<string | null>(null);
  const [formEdicao, setFormEdicao] = useState<{
    set_number: string;
    reps: string;
    weight: string;
    rpe: string;
  }>({ set_number: "", reps: "", weight: "", rpe: "" });

  // States para Adicionar Série Manualmente ("Corrigir Omissão da Máquina")
  const [adicionandoNaSessaoId, setAdicionandoNaSessaoId] = useState<
    string | null
  >(null);
  const [formNovaSerie, setFormNovaSerie] = useState<{
    set_number: string;
    reps: string;
    weight: string;
    rpe: string;
  }>({ set_number: "", reps: "", weight: "", rpe: "" });
  const [salvandoSerie, setSalvandoSerie] = useState(false);

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
    // Define exatamente a meia-noite de hoje no fuso horário local e converte para ISO (UTC)
    const inicioDeHoje = new Date();
    inicioDeHoje.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, notes, started_at, status")
        .gte("started_at", inicioDeHoje.toISOString())
        .order("started_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setSessaoHoje(data[0]);
        setNotasHoje(data[0].notes || "");
      }
    } catch (error) {
      console.error("Erro ao buscar relatório de hoje:", error);
    }
  };

  const salvarNotasDaSessao = async () => {
    if (!sessaoHoje) return;
    setSalvandoNotas(true);
    setFeedbackNotas(false);
    try {
      const { error } = await supabase
        .from("workout_sessions")
        .update({ notes: notasHoje })
        .eq("id", sessaoHoje.id);
      if (error) throw error;
      setFeedbackNotas(true);
      setTimeout(() => setFeedbackNotas(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    } finally {
      setSalvandoNotas(false);
    }
  };

  // --- FUNÇÕES DE CRUD DAS SÉRIES ---

  const iniciarEdicao = (serie: any) => {
    setEditandoSerieId(serie.id);
    setFormEdicao({
      set_number: String(serie.set_number ?? 1),
      reps:
        serie.reps !== null && serie.reps !== undefined
          ? String(serie.reps)
          : "",
      weight:
        serie.weight !== null && serie.weight !== undefined
          ? String(serie.weight)
          : "0",
      rpe:
        serie.rpe !== null && serie.rpe !== undefined ? String(serie.rpe) : "",
    });
  };

  const salvarEdicaoSerie = async (setId: string) => {
    setSalvandoSerie(true);
    try {
      const payload = {
        set_number: parseInt(formEdicao.set_number, 10) || 1,
        reps: formEdicao.reps !== "" ? parseInt(formEdicao.reps, 10) : null,
        weight: formEdicao.weight !== "" ? Number(formEdicao.weight) : 0,
        rpe: formEdicao.rpe !== "" ? Number(formEdicao.rpe) : null,
      };

      const { error } = await supabase
        .from("workout_sets")
        .update(payload)
        .eq("id", setId);

      if (error) throw error;
      setEditandoSerieId(null);
      await carregarHistorico();
    } catch (error) {
      console.error("Erro ao atualizar série:", error);
    } finally {
      setSalvandoSerie(false);
    }
  };

  const abrirFormularioNovaSerie = (dia: any) => {
    const proximoNumero =
      dia.seriesDetalhas.length > 0
        ? Math.max(
            ...dia.seriesDetalhas.map((s: any) => Number(s.set_number) || 0),
          ) + 1
        : 1;

    setAdicionandoNaSessaoId(dia.sessionId);
    setFormNovaSerie({
      set_number: String(proximoNumero),
      reps: "",
      weight: "0",
      rpe: "",
    });
  };

  const salvarNovaSerie = async (sessionId: string) => {
    if (!exercicioSelecionado || !sessionId) return;
    setSalvandoSerie(true);
    try {
      const payload = {
        session_id: sessionId,
        exercise_id: exercicioSelecionado,
        set_number: parseInt(formNovaSerie.set_number, 10) || 1,
        reps:
          formNovaSerie.reps !== "" ? parseInt(formNovaSerie.reps, 10) : null,
        weight: formNovaSerie.weight !== "" ? Number(formNovaSerie.weight) : 0,
        rpe: formNovaSerie.rpe !== "" ? Number(formNovaSerie.rpe) : null,
      };

      const { error } = await supabase.from("workout_sets").insert([payload]);

      if (error) throw error;
      setAdicionandoNaSessaoId(null);
      await carregarHistorico();
    } catch (error) {
      console.error("Erro ao adicionar série manual:", error);
    } finally {
      setSalvandoSerie(false);
    }
  };

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
      await carregarHistorico();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

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
          session_id,
          set_number,
          reps,
          weight,
          rpe,
          workout_sessions!inner(id, started_at)
        `,
        )
        .eq("exercise_id", exercicioSelecionado)
        .order("set_number", { ascending: true });

      if (error) throw error;

      // Agrupa por session_id para evitar colisões se houver 2 treinos no mesmo dia
      const agrupadoPorSessao = (data as any[]).reduce(
        (acc, curr) => {
          const sessaoObj = Array.isArray(curr.workout_sessions)
            ? curr.workout_sessions[0]
            : curr.workout_sessions;

          const sessionId = curr.session_id || sessaoObj.id;
          const dataSessao = new Date(sessaoObj.started_at).toLocaleDateString(
            "pt-BR",
          );

          if (!acc[sessionId]) {
            acc[sessionId] = {
              sessionId: sessionId,
              data: dataSessao,
              timestamp: new Date(sessaoObj.started_at).getTime(),
              sets: 0,
              setsComRpe: 0,
              volumeTotal: 0,
              cargaMaxima: 0,
              volumeLoad: 0,
              rpeSoma: 0,
              seriesDetalhas: [],
            };
          }

          const repsVal = Number(curr.reps) || 0;
          const weightVal = Number(curr.weight) || 0;
          const temRpe = curr.rpe !== null && curr.rpe !== undefined;

          acc[sessionId].sets += 1;
          acc[sessionId].volumeTotal += repsVal;
          acc[sessionId].cargaMaxima = Math.max(
            acc[sessionId].cargaMaxima,
            weightVal,
          );
          acc[sessionId].volumeLoad += repsVal * weightVal;

          if (temRpe) {
            acc[sessionId].rpeSoma += Number(curr.rpe);
            acc[sessionId].setsComRpe += 1;
          }

          acc[sessionId].seriesDetalhas.push({
            id: curr.id,
            set_number: curr.set_number,
            reps: curr.reps,
            weight: curr.weight,
            rpe: curr.rpe,
          });

          return acc;
        },
        {} as Record<string, any>,
      );

      const historicoOrdenado = Object.values(agrupadoPorSessao).sort(
        (a: any, b: any) => a.timestamp - b.timestamp,
      );

      const historicoComDeltas = historicoOrdenado.map(
        (dia: any, index: number, array: any[]) => {
          const sessaoAnterior = index > 0 ? array[index - 1] : null;
          // Ordena as séries internamente pelo set_number
          dia.seriesDetalhas.sort(
            (a: any, b: any) => (a.set_number || 0) - (b.set_number || 0),
          );

          return {
            ...dia,
            rpeMedio:
              dia.setsComRpe > 0
                ? Number((dia.rpeSoma / dia.setsComRpe).toFixed(1))
                : "-",
            deltaVolume: sessaoAnterior
              ? dia.volumeTotal - sessaoAnterior.volumeTotal
              : 0,
            deltaCarga: sessaoAnterior
              ? Number(
                  (dia.cargaMaxima - sessaoAnterior.cargaMaxima).toFixed(1),
                )
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

  const toggleExpandir = (sessionId: string) => {
    setSessoesExpandidas((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
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
          <div className='mt-3 flex items-center gap-3'>
            <button
              onClick={salvarNotasDaSessao}
              disabled={salvandoNotas}
              className='bg-[#273b4a] hover:bg-[#ca8aef] hover:text-[#050e22] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2'
            >
              <Save size={16} />
              {salvandoNotas ? "Consolidando..." : "Gravar Contexto"}
            </button>
            {feedbackNotas && (
              <span className='text-xs text-green-400 font-semibold flex items-center gap-1'>
                <Check size={14} /> Contexto de combate registrado.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Seletor de Alvo Operacional */}
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
          {/* Sparkline corrigida para evitar conflito de height do Recharts */}
          <div className='bg-[#050e22] p-4 rounded-xl border border-[#273b4a]'>
            <p className='text-xs text-[#a0aec0] mb-2 uppercase font-bold tracking-wider'>
              Tendência de Volume
            </p>
            <div className='h-20 w-full'>
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
          </div>

          {/* Lista de Sessões com CRUD completo */}
          <div className='space-y-4'>
            {historico.map((dia) => (
              <div
                key={dia.sessionId}
                className='bg-[#050e22] rounded-xl border border-[#273b4a] overflow-hidden'
              >
                {/* Header do Card */}
                <div
                  className='p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer hover:bg-[#1a2536] transition-colors gap-4'
                  onClick={() => toggleExpandir(dia.sessionId)}
                >
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='text-white font-bold text-lg'>{dia.data}</p>
                      <span className='text-xs px-2 py-0.5 rounded-md bg-[#273b4a] text-[#a0aec0]'>
                        {dia.sets} séries • RPE {dia.rpeMedio}
                      </span>
                    </div>
                    {/* Fator Delta */}
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
                          {Number(dia.volumeLoad.toFixed(1))}kg
                        </p>
                        <p className='text-[10px] text-[#a0aec0] uppercase tracking-wider'>
                          Volume Load Adicional
                        </p>
                      </div>
                    )}
                    {sessoesExpandidas[dia.sessionId] ? (
                      <ChevronUp className='text-[#ca8aef]' />
                    ) : (
                      <ChevronDown className='text-[#a0aec0]' />
                    )}
                  </div>
                </div>

                {/* Corpo do Card: Anatomia das Séries + CRUD Inline */}
                {sessoesExpandidas[dia.sessionId] && (
                  <div className='px-5 pb-5 pt-2 border-t border-[#273b4a] bg-[#0c131e]'>
                    <h4 className='text-xs uppercase text-[#a0aec0] font-bold tracking-wider mb-3'>
                      Anatomia das Séries
                    </h4>
                    <div className='space-y-2'>
                      {dia.seriesDetalhas.map((serie: any) => {
                        const estaEditando = editandoSerieId === serie.id;

                        return estaEditando ? (
                          <div
                            key={serie.id}
                            className='flex flex-wrap md:flex-nowrap justify-between items-center bg-[#1a2536] p-3 rounded-lg border border-[#ca8aef] gap-2'
                          >
                            <div className='flex items-center gap-1'>
                              <span className='text-xs text-[#a0aec0]'>#</span>
                              <input
                                type='number'
                                value={formEdicao.set_number}
                                onChange={(e) =>
                                  setFormEdicao({
                                    ...formEdicao,
                                    set_number: e.target.value,
                                  })
                                }
                                className='w-12 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                              />
                            </div>
                            <div className='flex items-center gap-1'>
                              <input
                                type='number'
                                value={formEdicao.reps}
                                onChange={(e) =>
                                  setFormEdicao({
                                    ...formEdicao,
                                    reps: e.target.value,
                                  })
                                }
                                placeholder='Reps'
                                className='w-16 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                              />
                              <span className='text-xs text-[#a0aec0]'>
                                reps
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <input
                                type='number'
                                step='0.5'
                                value={formEdicao.weight}
                                onChange={(e) =>
                                  setFormEdicao({
                                    ...formEdicao,
                                    weight: e.target.value,
                                  })
                                }
                                placeholder='Kg'
                                className='w-16 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                              />
                              <span className='text-xs text-[#a0aec0]'>kg</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <span className='text-xs text-[#a0aec0]'>
                                RPE
                              </span>
                              <input
                                type='number'
                                step='0.5'
                                max='10'
                                value={formEdicao.rpe}
                                onChange={(e) =>
                                  setFormEdicao({
                                    ...formEdicao,
                                    rpe: e.target.value,
                                  })
                                }
                                placeholder='-'
                                className='w-14 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                              />
                            </div>
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() => salvarEdicaoSerie(serie.id)}
                                disabled={salvandoSerie}
                                className='p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded'
                                title='Salvar'
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditandoSerieId(null)}
                                className='p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded'
                                title='Cancelar'
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={serie.id}
                            className='flex justify-between items-center bg-[#121a27] p-3 rounded-lg border border-[#273b4a]/50 group'
                          >
                            <span className='text-[#a0aec0] text-sm font-medium w-16'>
                              Série {serie.set_number}
                            </span>
                            <span className='text-white font-bold'>
                              {serie.reps ?? "?"} reps
                            </span>
                            <span className='text-white w-16 text-center'>
                              {serie.weight ? `+${serie.weight}kg` : "BW"}
                            </span>
                            <span
                              className={`text-sm px-2 py-1 rounded font-bold ${
                                serie.rpe >= 9
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              RPE {serie.rpe ?? "-"}
                            </span>

                            <div className='flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'>
                              <button
                                onClick={() => iniciarEdicao(serie)}
                                className='text-[#a0aec0] hover:text-white p-1'
                                title='Editar série'
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deletarSerie(serie.id)}
                                className='text-red-400 hover:text-red-300 p-1'
                                title='Apagar série'
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Formulário Inline para Adicionar Nova Série Manualmente */}
                    {adicionandoNaSessaoId === dia.sessionId ? (
                      <div className='mt-4 flex flex-wrap md:flex-nowrap justify-between items-center bg-[#121a27] p-3 rounded-lg border border-dashed border-[#ca8aef] gap-2'>
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-[#a0aec0]'>
                            Série #
                          </span>
                          <input
                            type='number'
                            value={formNovaSerie.set_number}
                            onChange={(e) =>
                              setFormNovaSerie({
                                ...formNovaSerie,
                                set_number: e.target.value,
                              })
                            }
                            className='w-12 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                          />
                        </div>
                        <div className='flex items-center gap-1'>
                          <input
                            type='number'
                            value={formNovaSerie.reps}
                            onChange={(e) =>
                              setFormNovaSerie({
                                ...formNovaSerie,
                                reps: e.target.value,
                              })
                            }
                            placeholder='Reps'
                            className='w-16 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                          />
                          <span className='text-xs text-[#a0aec0]'>reps</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <input
                            type='number'
                            step='0.5'
                            value={formNovaSerie.weight}
                            onChange={(e) =>
                              setFormNovaSerie({
                                ...formNovaSerie,
                                weight: e.target.value,
                              })
                            }
                            placeholder='Kg'
                            className='w-16 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                          />
                          <span className='text-xs text-[#a0aec0]'>kg</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-[#a0aec0]'>RPE</span>
                          <input
                            type='number'
                            step='0.5'
                            max='10'
                            value={formNovaSerie.rpe}
                            onChange={(e) =>
                              setFormNovaSerie({
                                ...formNovaSerie,
                                rpe: e.target.value,
                              })
                            }
                            placeholder='-'
                            className='w-14 bg-[#050e22] border border-[#273b4a] rounded px-2 py-1 text-white text-sm'
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => salvarNovaSerie(dia.sessionId)}
                            disabled={salvandoSerie}
                            className='px-3 py-1 bg-[#ca8aef] text-[#050e22] font-bold text-xs rounded hover:opacity-90 flex items-center gap-1'
                          >
                            <Check size={14} /> Inserir
                          </button>
                          <button
                            onClick={() => setAdicionandoNaSessaoId(null)}
                            className='p-1 bg-[#273b4a] text-[#a0aec0] hover:text-white rounded'
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => abrirFormularioNovaSerie(dia)}
                        className='mt-4 w-full border border-dashed border-[#273b4a] text-[#a0aec0] hover:text-white hover:border-[#ca8aef] rounded-lg p-2 text-sm flex items-center justify-center gap-2 transition-colors'
                      >
                        <Plus size={16} /> Corrigir Omissão da Máquina
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : exercicioSelecionado ? (
        <div className='text-center py-8 text-[#a0aec0] bg-[#050e22] rounded-xl border border-[#273b4a]'>
          Nenhum registro encontrado para este exercício ainda.
        </div>
      ) : null}
    </div>
  );
}
