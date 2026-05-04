import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { metaService } from "../services/metaService";
import { useRpgStore } from "../../../store/useRpgStore";
import { motion } from "framer-motion"; // NOVO

interface MetaCardProps {
  meta: any;
  onUpdate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// 1. MAPEAMENTO DE CORES POR PRIORIDADE
const coresPrioridade: Record<string, string> = {
  alta: "#ca8aef", // Roxo
  media: "#E2B34B", // Amarelo
  baixa: "#48A64B", // Verde
};

// Mapeamento para o Glow Neon no Hover (usando RGBA para transparência)
const sombrasGlow: Record<string, string> = {
  alta: "0 0 25px rgba(202, 138, 239, 0.4)",
  media: "0 0 25px rgba(226, 179, 75, 0.3)",
  baixa: "0 0 25px rgba(72, 166, 75, 0.3)",
};

export function MetaCard({ meta, onUpdate, onEdit, onDelete }: MetaCardProps) {
  const [loading, setLoading] = useState(false);
  const addXp = useRpgStore((state) => state.addXp);

  const prioridade = meta.prioridade || "baixa";
  const corBase = coresPrioridade[prioridade];
  const glowHover = sombrasGlow[prioridade];

  const handleConcluir = async () => {
    setLoading(true);
    try {
      await metaService.updateMeta(meta.id, { status: "concluida" });
      addXp(meta.xp_valor || 50);
      onUpdate();
    } catch (error) {
      console.error("Erro ao concluir:", error);
      setLoading(false);
    }
  };

  return (
    // 2. USANDO MOTION.DIV PARA ANIMAÇÃO PROFISSIONAL
    <motion.div
      className='bg-[#121a27] rounded-2xl flex overflow-hidden border border-[#273b4a] w-full cursor-pointer relative z-0'
      // CONFIGURAÇÃO DO ANIMAÇÃO NO HOVER
      whileHover={{
        scale: 1.02, // Aumenta sutilmente (sem quebrar layout)
        boxShadow: glowHover, // Adiciona o brilho neon
        borderColor: "rgba(255,255,255,0.2)", // Clareia a borda
        zIndex: 10, // Garante que fique por cima de outros cards
      }}
      transition={{
        duration: 0.3, // Velocidade da transição (suave)
        ease: "easeOut", // Tipo de curva
      }}
    >
      {/* Barra Lateral Dinâmica */}
      <div className='w-3 shrink-0' style={{ backgroundColor: corBase }}></div>

      {/* Área de Conteúdo */}
      <div className='flex flex-1 p-5'>
        {/* Lado Esquerdo: Textos e Tags */}
        <div className='flex flex-col flex-1 pr-4'>
          <span
            className='text-xs font-bold uppercase tracking-wider mb-1'
            style={{ color: corBase }}
          >
            {meta.tipo}
          </span>

          <h3 className='text-white font-bold text-xl leading-tight mb-4'>
            {meta.nome}
          </h3>

          <div className='flex flex-wrap gap-2 mb-4'>
            <span className='bg-[#273b4a] text-white text-xs font-bold px-2.5 py-1 rounded-md'>
              #{meta.categoria}
            </span>
            <span
              className='bg-[#273b4a] text-xs font-bold px-2.5 py-1 rounded-md'
              style={{ color: corBase }}
            >
              +{meta.xp_valor || 50} XP
            </span>
          </div>

          <div className='mt-auto pt-2'>
            <span className='text-[#a0aec0] text-xs font-medium'>
              Prazo:{" "}
              {meta.prazo
                ? new Date(meta.prazo).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })
                : "Sem prazo"}
            </span>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className='flex flex-col justify-between items-center shrink-0 w-12 border-l border-[#273b4a]/50 pl-4 py-1'>
          <button
            onClick={onEdit}
            className='text-[#b7b7b7] hover:text-white transition-colors p-1'
            title='Editar Meta'
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={handleConcluir}
            disabled={loading}
            className='hover:bg-[#3d8c40] text-white w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 cursor-pointer my-2'
            style={{
              backgroundColor: "#48a64b",
              boxShadow: "0 0 10px rgba(72,166,75,0.4)",
            }}
            title='Concluir Meta'
          >
            <Check size={20} strokeWidth={4} />
          </button>

          <button
            onClick={onDelete}
            className='text-red-500/70 hover:text-red-500 transition-colors p-1'
            title='Excluir Meta'
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
