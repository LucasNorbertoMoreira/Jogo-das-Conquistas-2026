import { useRpgStore } from "../../../store/useRpgStore";
import { motion } from "framer-motion";

export function HudUsuario() {
  // Puxamos os dados em tempo real da Store
  const { nivel, xpTotal, xpParaProximo } = useRpgStore();

  // Calculamos a porcentagem da barra (limitada a 100%)
  const percentual = Math.min((xpTotal / xpParaProximo) * 100, 100);

  return (
    <div className='relative md:absolute md:top-8 md:right-10 w-full md:w-64 bg-[#121a27] p-4 rounded-xl border border-[#273b4a] shadow-lg z-50 mb-6 md:mb-0'>
      <div className='flex justify-between text-sm font-bold mb-2'>
        <span className='text-[#ca8aef]'>Nível {nivel}</span>
        <span className='text-[#b7b7b7]'>
          {xpTotal} / {xpParaProximo} XP
        </span>
      </div>

      {/* Container da barra vazia */}
      <div className='w-full h-3 bg-[#050e22] rounded-full overflow-hidden'>
        {/* Barra preenchida com animação de alta performance */}
        <motion.div
          className='h-full bg-linear-to-r from-[#ca8aef] to-[#a564d3] rounded-full origin-left'
          initial={{ scaleX: 0 }}
          animate={{ scaleX: percentual / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
