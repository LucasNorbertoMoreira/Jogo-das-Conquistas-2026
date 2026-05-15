import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { habitService } from "../services/habitService";

type NivelHabito = "baixa" | "media" | "alta";

const CONFIG_NIVEIS = {
  baixa: { xp: 5, dano: 15, cor: "#48A64B", label: "Prioridade Baixa" },
  media: { xp: 15, dano: 45, cor: "#E2B34B", label: "Prioridade Média" },
  alta: { xp: 30, dano: 100, cor: "#ca8aef", label: "Prioridade Alta" },
};

const DIAS_SEMANA = [
  { id: 0, label: "D" },
  { id: 1, label: "S" },
  { id: 2, label: "T" },
  { id: 3, label: "Q" },
  { id: 4, label: "Q" },
  { id: 5, label: "S" },
  { id: 6, label: "S" },
];

export function FormCriarHabito({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState<NivelHabito>("baixa");
  // O padrão é começar com todos os dias selecionados (Hábito Diário)
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleDia = (id: number) => {
    setDiasSelecionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((d) => d !== id); // Remove o dia
      } else {
        return [...prev, id].sort(); // Adiciona e mantém a ordem
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert("A missão precisa de um nome.");
      return;
    }
    if (diasSelecionados.length === 0) {
      alert("Selecione pelo menos um dia para a execução da missão.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const config = CONFIG_NIVEIS[nivel];
      // A quinta entrada agora é a lista de dias
      await habitService.criarHabito(
        nome,
        user.id,
        nivel,
        config.xp,
        config.dano,
        diasSelecionados,
      );

      // Resetar o formulário
      setNome("");
      setNivel("baixa");
      setDiasSelecionados([0, 1, 2, 3, 4, 5, 6]);

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-[#050e22] border border-[#273b4a] w-full max-w-md rounded-2xl shadow-2xl relative'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-[#a0aec0] hover:text-white transition-colors'
        >
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-6'>
          <div>
            <h2 className='text-xl font-black text-white uppercase tracking-tighter mb-1'>
              Nova Missão
            </h2>
            <p className='text-[#a0aec0] text-xs font-bold uppercase tracking-widest'>
              Configure os parâmetros operacionais
            </p>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
              Nome da Missão
            </label>
            <input
              type='text'
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder='Ex: Treino de Front Lever'
              className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef] transition-colors'
              autoFocus
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
              Dias de Execução
            </label>
            <div className='flex justify-between gap-1'>
              {DIAS_SEMANA.map((dia) => {
                const ativo = diasSelecionados.includes(dia.id);
                return (
                  <button
                    key={dia.id}
                    type='button'
                    onClick={() => toggleDia(dia.id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${
                      ativo
                        ? "bg-[#ca8aef] text-white shadow-[0_0_10px_rgba(202,138,239,0.3)]"
                        : "bg-[#121a27] text-[#5a6b7a] border border-[#273b4a] hover:border-[#ca8aef]/50"
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
              Classe de Prioridade
            </label>
            <div className='grid grid-cols-1 gap-2'>
              {(
                Object.entries(CONFIG_NIVEIS) as [
                  NivelHabito,
                  (typeof CONFIG_NIVEIS)[NivelHabito],
                ][]
              ).map(([chave, config]) => (
                <label
                  key={chave}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    nivel === chave
                      ? `bg-[${config.cor}]/10 border-[${config.cor}]`
                      : "bg-[#121a27] border-[#273b4a] hover:bg-[#162131]"
                  }`}
                  style={
                    nivel === chave
                      ? {
                          borderColor: config.cor,
                          backgroundColor: `${config.cor}15`,
                        }
                      : {}
                  }
                >
                  <div className='flex items-center gap-3'>
                    <input
                      type='radio'
                      name='nivel'
                      value={chave}
                      checked={nivel === chave}
                      onChange={() => setNivel(chave)}
                      className='hidden'
                    />
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: config.cor }}
                    ></div>
                    <span className='text-white font-bold text-sm'>
                      {config.label}
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <span className='text-[10px] font-black text-[#48a64b]'>
                      +{config.xp} XP
                    </span>
                    <span className='text-[10px] font-black text-red-500'>
                      -{config.dano} HP
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest mt-2 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50'
          >
            {loading ? "Registrando..." : "Cadastrar Missão"}
          </button>
        </form>
      </div>
    </div>
  );
}
