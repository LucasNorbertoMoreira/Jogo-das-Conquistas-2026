import { useEffect, useState } from "react";
import { metaService } from "../features/metas/services/metaService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Trophy, Zap, Trash2, Filter } from "lucide-react";
import { useRpgStore } from "../store/useRpgStore"; // Importe a store

export function Historico() {
  const [metasOriginais, setMetasOriginais] = useState<any[]>([]);
  const [metasFiltradas, setMetasFiltradas] = useState<any[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // EXTRAI A FUNÇÃO DA STORE AQUI NO TOPO (Regra do React)
  const removeXp = useRpgStore((state) => state.removeXp);

  // Estados dos Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<"tudo" | "semana" | "mes">(
    "tudo",
  );
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>(
    [],
  );

  useEffect(() => {
    carregarHistorico();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroPeriodo, filtroCategoria, metasOriginais]);

  const carregarHistorico = async () => {
    try {
      const data = await metaService.getMetas();
      const concluidas = data.filter((m: any) => m.status === "concluida");

      concluidas.sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime(),
      );
      setMetasOriginais(concluidas);

      // Extrai categorias únicas para o select
      const categoriasUnicas = Array.from(
        new Set(concluidas.map((m) => m.categoria || "Outros")),
      ) as string[];
      setCategoriasDisponiveis(categoriasUnicas);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrado = [...metasOriginais];
    const hoje = new Date();

    // 1. Filtro de Tempo
    if (filtroPeriodo === "mes") {
      filtrado = filtrado.filter((m) => {
        const dataMeta = new Date(m.updated_at || m.created_at);
        return (
          dataMeta.getMonth() === hoje.getMonth() &&
          dataMeta.getFullYear() === hoje.getFullYear()
        );
      });
    } else if (filtroPeriodo === "semana") {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      filtrado = filtrado.filter(
        (m) => new Date(m.updated_at || m.created_at) >= seteDiasAtras,
      );
    }

    // 2. Filtro de Categoria
    if (filtroCategoria !== "todas") {
      filtrado = filtrado.filter((m) => m.categoria === filtroCategoria);
    }

    setMetasFiltradas(filtrado);
    atualizarGrafico(filtrado);
  };

  const atualizarGrafico = (dados: any[]) => {
    const agrupado = dados.reduce((acc: any, meta: any) => {
      const cat = meta.categoria || "Outros";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += meta.xp_valor || 0;
      return acc;
    }, {});

    const dadosFormatados = Object.keys(agrupado)
      .map((key) => ({
        nome: key,
        xp: agrupado[key],
      }))
      .sort((a, b) => b.xp - a.xp);

    setDadosGrafico(dadosFormatados);
  };

  const handleExcluir = async (id: string) => {
    if (
      !window.confirm("Isso apagará o registro e reduzirá seu XP. Confirmar?")
    )
      return;

    try {
      // 1. Encontra a meta para saber quanto XP subtrair
      const metaParaDeletar = metasOriginais.find((m) => m.id === id);

      // 2. Deleta no Supabase
      await metaService.deleteMeta(id);

      // 3. Punição justa: Remove o XP da meta excluída
      if (metaParaDeletar && metaParaDeletar.xp_valor) {
        removeXp(metaParaDeletar.xp_valor);
      }

      // 4. Atualiza a lista na tela imediatamente
      setMetasOriginais((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao sincronizar com o banco de dados.");
    }
  };

  if (loading)
    return (
      <div className='text-[#a0aec0] font-bold'>Carregando auditoria...</div>
    );

  return (
    <div className='flex flex-col h-full w-full gap-8 overflow-y-auto pb-10'>
      {/* BARRA DE FILTROS */}
      <div className='bg-[#121a27] border border-[#273b4a] rounded-xl p-4 flex gap-4 items-center shadow-md'>
        <div className='flex items-center gap-2 text-[#b7b7b7] border-r border-[#273b4a] pr-4'>
          <Filter size={20} />
          <span className='font-bold text-sm uppercase tracking-wider'>
            Filtros
          </span>
        </div>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value as any)}
          className='bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-2 outline-none text-sm cursor-pointer'
        >
          <option value='tudo'>Todo o Histórico</option>
          <option value='semana'>Últimos 7 Dias</option>
          <option value='mes'>Este Mês</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className='bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-2 outline-none text-sm cursor-pointer'
        >
          <option value='todas'>Todas as Tags</option>
          {categoriasDisponiveis.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className='ml-auto text-[#a0aec0] text-sm font-bold'>
          {metasFiltradas.length} metas encontradas
        </div>
      </div>

      {/* GRÁFICO DE PERFORMANCE */}
      <div className='bg-[#121a27] border border-[#273b4a] rounded-2xl p-6 shadow-lg'>
        <div className='flex items-center gap-3 mb-6'>
          <Trophy className='text-[#ca8aef]' size={28} />
          <h2 className='text-2xl font-bold text-white'>
            Rendimento por Categoria
          </h2>
        </div>

        <div className='h-75 w-full'>
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={dadosGrafico}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey='nome'
                  stroke='#a0aec0'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke='#a0aec0'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#273b4a", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "#050e22",
                    borderColor: "#273b4a",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#ca8aef", fontWeight: "bold" }}
                />
                <Bar dataKey='xp' radius={[6, 6, 0, 0]}>
                  {dadosGrafico.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#ca8aef" : "#273b4a"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex h-full items-center justify-center text-[#a0aec0]'>
              Nenhum dado encontrado para estes filtros.
            </div>
          )}
        </div>
      </div>

      {/* COFRE DE CONQUISTAS (Lista) */}
      <div className='flex flex-col gap-4'>
        <h2 className='text-xl font-bold text-[#b7b7b7] sticky top-0 bg-[#050e22] py-2 z-10'>
          Cofre de Conquistas
        </h2>

        {metasFiltradas.length === 0 ? (
          <p className='text-[#a0aec0]'>Lista vazia.</p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {metasFiltradas.map((meta) => (
              <div
                key={meta.id}
                className='bg-[#121a27] border border-[#273b4a]/50 rounded-xl p-4 flex flex-col opacity-80 hover:opacity-100 transition-opacity group'
              >
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-[#48a64b] text-xs font-bold uppercase tracking-wider'>
                    Concluída
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='text-[#a0aec0] text-xs font-semibold'>
                      #{meta.categoria}
                    </span>
                    <button
                      onClick={() => handleExcluir(meta.id)}
                      className='text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all'
                      title='Excluir do Histórico'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className='text-white font-bold text-lg leading-tight mb-3 line-through decoration-[#273b4a] decoration-2'>
                  {meta.nome}
                </h3>
                <div className='mt-auto flex items-center justify-between'>
                  <div className='flex items-center gap-1.5 text-[#ca8aef] font-bold text-sm'>
                    <Zap size={16} fill='currentColor' /> +{meta.xp_valor} XP
                  </div>
                  <span className='text-xs text-[#a0aec0]'>
                    {new Date(
                      meta.updated_at || meta.created_at,
                    ).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
