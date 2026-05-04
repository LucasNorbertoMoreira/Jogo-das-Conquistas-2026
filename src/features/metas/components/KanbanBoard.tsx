import { useEffect, useState } from "react";
import { metaService } from "../services/metaService";
import { MetaCard } from "./MetaCard";
import { FormCriarMeta } from "./FormCriarMeta";
import { Plus } from "lucide-react";

type FiltroTipo = "metinha" | "meta" | "metona";

export function KanbanBoard() {
  const [metas, setMetas] = useState<any[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>("metinha");
  const [modalAberto, setModalAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<any>(null);

  const carregarMetas = async () => {
    try {
      const data = await metaService.getMetas();
      // Filtra apenas as metas que não foram concluídas
      setMetas(data.filter((m: any) => m.status === "pendente"));
    } catch (error) {
      console.error("Erro ao carregar banco:", error);
    }
  };

  // Roda uma vez quando a tela abre
  useEffect(() => {
    carregarMetas();
  }, []);

  // Aplica o filtro da aba superior (metinha, meta, metona)
  const metasFiltradas = metas.filter((m) => m.tipo === filtroAtivo);

  const handleExcluirMeta = async (id: string) => {
    if (!window.confirm("Deseja realmente eliminar esta meta do seu quadro?"))
      return;

    // Atualização Otimista: Remove o card da tela IMEDIATAMENTE
    setMetas((prevMetas) => prevMetas.filter((m) => m.id !== id));

    try {
      // Manda a ordem de exclusão silenciosamente nos bastidores
      await metaService.deleteMeta(id);
    } catch (error) {
      console.error("Falha ao deletar no servidor:", error);
      // Apenas se der erro no banco (sem internet, etc), nós recarregamos a tela para corrigir
      carregarMetas();
    }
  };

  return (
    <div className='flex flex-col h-full w-full'>
      {/* HEADER DO KANBAN: Responsivo Mobile/Desktop */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-8 gap-4'>
        {/* Espaçador invisível (Some no celular, mantém alinhamento no PC) */}
        <div className='hidden md:block w-[160px]'></div>

        {/* Abas de Filtro: Scroll horizontal no celular */}
        <div className='flex justify-center mx-auto gap-2 bg-[#121a27] border border-[#273b4a] rounded-xl p-2 w-full md:w-auto overflow-x-auto overflow-y-hidden'>
          {(["metinha", "meta", "metona"] as FiltroTipo[]).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroAtivo(tipo)}
              className={`px-6 py-2 md:px-8 md:py-3 rounded-lg text-sm md:text-lg font-semibold capitalize transition-all whitespace-nowrap ${
                filtroAtivo === tipo
                  ? "bg-[#ca8aef] text-white shadow-[0_0_10px_rgba(202,138,239,0.5)]"
                  : "text-[#b7b7b7] bg-transparent hover:bg-[#273b4a] hover:text-white"
              }`}
            >
              {tipo}s
            </button>
          ))}
        </div>

        {/* Botão de Criar Meta: Ocupa a tela toda no celular, tamanho normal no PC */}
        <button
          onClick={() => setModalAberto(true)}
          className='flex items-center justify-center gap-2 bg-[#48a64b] hover:bg-[#3d8c40] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-[1.02] shrink-0 w-full md:w-auto'
        >
          <Plus size={20} />
          Nova Meta
        </button>
      </div>

      {/* GRID DO KANBAN: 3 Colunas baseadas na prioridade (Já estava responsivo) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 grow'>
        {/* COLUNA: Prioridade Alta */}
        <div className='flex flex-col gap-5 overflow-y-auto px-4 pb-4 -mx-4 pt-2'>
          <h2 className='text-xl font-bold text-[#b7b7b7] sticky top-0 bg-[#050e22] py-2 z-10'>
            Prioridade Alta
          </h2>
          {metasFiltradas
            .filter((m) => m.prioridade === "alta")
            .map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onUpdate={carregarMetas}
                onEdit={() => {
                  setMetaEmEdicao(meta);
                  setModalAberto(true);
                }}
                onDelete={() => handleExcluirMeta(meta.id)}
              />
            ))}
        </div>

        {/* COLUNA: Prioridade Média */}
        <div className='flex flex-col gap-5 overflow-y-auto px-4 pb-4 -mx-4 pt-2'>
          <h2 className='text-xl font-bold text-[#b7b7b7] sticky top-0 bg-[#050e22] py-2 z-10'>
            Prioridade Média
          </h2>
          {metasFiltradas
            .filter((m) => m.prioridade === "media")
            .map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onUpdate={carregarMetas}
                onEdit={() => {
                  setMetaEmEdicao(meta);
                  setModalAberto(true);
                }}
                onDelete={() => handleExcluirMeta(meta.id)}
              />
            ))}
        </div>

        {/* COLUNA: Prioridade Baixa */}
        <div className='flex flex-col gap-5 overflow-y-auto px-4 pb-4 -mx-4 pt-2'>
          <h2 className='text-xl font-bold text-[#b7b7b7] sticky top-0 bg-[#050e22] py-2 z-10'>
            Prioridade Baixa
          </h2>
          {metasFiltradas
            .filter((m) => m.prioridade === "baixa")
            .map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onUpdate={carregarMetas}
                onEdit={() => {
                  setMetaEmEdicao(meta);
                  setModalAberto(true);
                }}
                onDelete={() => handleExcluirMeta(meta.id)}
              />
            ))}
        </div>
      </div>

      {/* MODAL: Janela flutuante para criação */}
      <FormCriarMeta
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setMetaEmEdicao(null);
        }}
        onSuccess={carregarMetas}
        metaInicial={metaEmEdicao}
      />
    </div>
  );
}
