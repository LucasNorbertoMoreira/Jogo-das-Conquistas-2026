import { useState } from "react";
import { habitService } from "../services/habitService";
import { supabase } from "../lib/supabase";
import { X, Flame, Zap, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type NivelHabito = "baixa" | "media" | "alta";

const CONFIG_NIVEIS = {
  baixa: { xp: 10, dano: 20, cor: "#48A64B", label: "Simples" },
  media: { xp: 25, dano: 50, cor: "#E2B34B", label: "Padrão" },
  alta: { xp: 50, dano: 100, cor: "#ca8aef", label: "Mestre" },
};

export function FormCriarHabito({ isOpen, onClose, onSuccess }: Props) {
  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState<NivelHabito>("baixa");
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const config = CONFIG_NIVEIS[nivel];
      await habitService.criarHabito(nome, user.id, config.xp, config.dano);

      setNome("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar hábito:", error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4'>
      <div className='bg-[#121a27] border border-[#273b4a] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl'>
        <div className='p-6 border-b border-[#273b4a] flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <Flame
              style={{ color: CONFIG_NIVEIS[nivel].cor }}
              size={20}
              className='transition-colors duration-300'
            />
            <h2 className='text-xl font-bold text-white uppercase tracking-tight'>
              Novo Hábito {CONFIG_NIVEIS[nivel].label}
            </h2>
          </div>
          <button onClick={onClose} className='text-[#a0aec0] hover:text-white'>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-6'>
          <div>
            <label className='block text-[#b7b7b7] text-xs font-black uppercase mb-2'>
              O que você vai dominar?
            </label>
            <input
              type='text'
              placeholder='Ex: Treino de Planche ou Meditação'
              className='w-full bg-[#050e22] border border-[#273b4a] rounded-xl p-4 text-white focus:border-[#ca8aef] outline-none transition-all'
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className='block text-[#b7b7b7] text-xs font-black uppercase mb-3 text-center'>
              Nível de Importância
            </label>
            <div className='flex gap-2 p-1 bg-[#050e22] rounded-xl border border-[#273b4a]'>
              {(Object.keys(CONFIG_NIVEIS) as NivelHabito[]).map((n) => (
                <button
                  key={n}
                  type='button'
                  onClick={() => setNivel(n)}
                  className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${
                    nivel === n
                      ? "bg-[#273b4a] text-white shadow-lg"
                      : "text-[#5a6b7a] hover:text-[#a0aec0]"
                  }`}
                  style={
                    nivel === n
                      ? { borderBottom: `3px solid ${CONFIG_NIVEIS[n].cor}` }
                      : {}
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Preview de Pontuação */}
          <div className='grid grid-cols-2 gap-4 bg-[#050e22]/50 p-4 rounded-xl border border-[#273b4a]/50'>
            <div className='flex flex-col items-center border-r border-[#273b4a]'>
              <span className='text-[#48a64b] text-[10px] font-black uppercase flex items-center gap-1'>
                <Zap size={10} /> Recompensa
              </span>
              <span className='text-white font-bold text-xl'>
                +{CONFIG_NIVEIS[nivel].xp} XP
              </span>
            </div>
            <div className='flex flex-col items-center'>
              <span className='text-red-500 text-[10px] font-black uppercase flex items-center gap-1'>
                <AlertTriangle size={10} /> Penalidade
              </span>
              <span className='text-white font-bold text-xl'>
                -{CONFIG_NIVEIS[nivel].dano} XP
              </span>
            </div>
          </div>

          <button
            type='submit'
            disabled={enviando}
            className='w-full bg-gradient-to-r from-[#ca8aef] to-[#a564d3] text-white font-black py-4 rounded-xl uppercase tracking-widest hover:shadow-[0_0_20px_rgba(202,138,239,0.4)] transition-all disabled:opacity-50 mt-2'
          >
            {enviando ? "Sincronizando..." : "Fixar na Rotina"}
          </button>
        </form>
      </div>
    </div>
  );
}
