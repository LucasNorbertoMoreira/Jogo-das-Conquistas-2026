import { useState, useEffect } from "react";
import { metaService } from "../services/metaService";
import { Calendar, Plus } from "lucide-react";

interface FormCriarMetaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  metaInicial?: any | null;
}

export function FormCriarMeta({
  isOpen,
  onClose,
  onSuccess,
  metaInicial,
}: FormCriarMetaProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"metinha" | "meta" | "metona">("metinha");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">(
    "media",
  );
  const [categoria, setCategoria] = useState("");
  const [prazo, setPrazo] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados das Tags Dinâmicas
  const [tagsDb, setTagsDb] = useState<any[]>([]);
  const [novaTag, setNovaTag] = useState("");
  const [carregandoTags, setCarregandoTags] = useState(false);

  const isEdit = !!metaInicial;

  useEffect(() => {
    if (isOpen) carregarTags();
  }, [isOpen]);

  const carregarTags = async () => {
    try {
      const data = await metaService.getTags();
      setTagsDb(data);
      if (data.length > 0 && !categoria && !isEdit) {
        setCategoria(data[0].nome);
      }
    } catch (error) {
      console.error("Erro ao carregar tags", error);
    }
  };

  useEffect(() => {
    if (metaInicial) {
      setNome(metaInicial.nome);
      setTipo(metaInicial.tipo);
      setPrioridade(metaInicial.prioridade);
      setCategoria(metaInicial.categoria);
      setPrazo(metaInicial.prazo ? metaInicial.prazo.split("T")[0] : "");
    } else {
      setNome("");
      setTipo("metinha");
      setPrioridade("media");
      setPrazo("");
      // Mantém a categoria se já tiver selecionado uma da lista
    }
  }, [metaInicial, isOpen]);

  const handleCriarTag = async () => {
    if (!novaTag.trim()) return;
    try {
      setCarregandoTags(true);
      const tagCriada = await metaService.createTag(novaTag.trim());
      setTagsDb([...tagsDb, tagCriada]);
      setCategoria(tagCriada.nome);
      setNovaTag("");
    } catch (error) {
      console.error("Erro ao criar tag", error);
    } finally {
      setCarregandoTags(false);
    }
  };

  const handleExcluirTag = async (tagId: string, tagNome: string) => {
    if (!window.confirm(`Destruir a tag #${tagNome} permanentemente?`)) return;
    try {
      await metaService.deleteTag(tagId);
      setTagsDb(tagsDb.filter((t) => t.id !== tagId));
      if (categoria === tagNome) setCategoria("");
    } catch (error) {
      console.error("Erro ao excluir tag", error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("A meta precisa de um nome.");
    if (!categoria) return alert("Crie ou selecione uma categoria.");

    setLoading(true);
    try {
      const payload = {
        nome,
        tipo,
        prioridade,
        categoria,
        prazo: prazo || null,
      };

      if (isEdit) {
        await metaService.updateMeta(metaInicial.id, payload);
      } else {
        await metaService.createMeta({ ...payload, status: "pendente" });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Falha de conexão com a base de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]'>
      <div className='bg-[#121a27] border border-[#273b4a] w-full max-w-md rounded-2xl p-6 shadow-2xl relative'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-[#b7b7b7] hover:text-white text-xl font-bold transition-colors'
        >
          ✕
        </button>

        <h2 className='text-2xl font-bold text-white mb-6'>
          {isEdit ? "Recalibrar Meta" : "Forjar Nova Meta"}
        </h2>

        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <div>
            <label className='block text-[#b7b7b7] text-sm font-semibold mb-1'>
              Objetivo
            </label>
            <input
              type='text'
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder='Ex: 50 Flexões sem parar'
              className='w-full bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-3 focus:border-[#ca8aef] outline-none transition-colors'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-[#b7b7b7] text-sm font-semibold mb-1'>
                Tipo (XP)
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className='w-full bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-3 outline-none cursor-pointer'
              >
                <option value='metinha'>Metinha (10 XP)</option>
                <option value='meta'>Meta (50 XP)</option>
                <option value='metona'>Metona (250 XP)</option>
              </select>
            </div>
            <div>
              <label className='block text-[#b7b7b7] text-sm font-semibold mb-1'>
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className='w-full bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-3 outline-none cursor-pointer'
              >
                <option value='baixa'>Baixa (x0.5)</option>
                <option value='media'>Média (x1.0)</option>
                <option value='alta'>Alta (x2.0)</option>
              </select>
            </div>
          </div>

          {/* NOVO SISTEMA DE CATEGORIAS */}
          <div>
            <label className='block text-[#b7b7b7] text-sm font-semibold mb-2'>
              Categoria
            </label>

            <div className='flex flex-wrap gap-2 mb-3'>
              {tagsDb.map((tag) => (
                <div key={tag.id} className='relative group flex items-center'>
                  <button
                    type='button'
                    onClick={() => setCategoria(tag.nome)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      categoria === tag.nome
                        ? "bg-[#ca8aef] text-white shadow-[0_0_10px_rgba(202,138,239,0.3)]"
                        : "bg-[#273b4a] text-[#b7b7b7] hover:bg-[#050e22] hover:text-white"
                    }`}
                  >
                    #{tag.nome}
                  </button>
                  <button
                    type='button'
                    onClick={() => handleExcluirTag(tag.id, tag.nome)}
                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity'
                    title='Excluir Tag'
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className='flex gap-2'>
              <input
                type='text'
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                placeholder='Nova tag...'
                className='bg-[#050e22] text-white border border-[#273b4a] rounded-lg px-3 py-2 text-sm focus:border-[#ca8aef] outline-none flex-1'
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleCriarTag())
                }
              />
              <button
                type='button'
                onClick={handleCriarTag}
                disabled={carregandoTags || !novaTag.trim()}
                className='bg-[#273b4a] hover:bg-[#ca8aef] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center'
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className='block text-[#b7b7b7] text-sm font-semibold mb-1'>
              Prazo Final
            </label>
            <div className='relative flex items-center bg-[#050e22] border border-[#273b4a] rounded-lg focus-within:border-[#ca8aef] transition-colors overflow-hidden'>
              <div className='pl-3 text-[#ca8aef]'>
                <Calendar size={20} />
              </div>
              <input
                type='date'
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className='w-full bg-transparent text-white p-3 outline-none cursor-pointer [color-scheme:dark]'
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full mt-2 bg-[#ca8aef] hover:bg-[#a564d3] text-white font-black text-lg py-3.5 rounded-lg transition-colors disabled:opacity-50 shadow-[0_4px_14px_rgba(202,138,239,0.25)]'
          >
            {loading
              ? "Processando..."
              : isEdit
                ? "Salvar Ajustes"
                : "Criar Meta"}
          </button>
        </form>
      </div>
    </div>
  );
}
