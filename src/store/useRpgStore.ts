import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RpgState {
  nivel: number;
  xpTotal: number;
  xpParaProximo: number;
  addXp: (valor: number) => void;
  removeXp: (valor: number) => void; // NOVO
}

export const useRpgStore = create<RpgState>()(
  persist(
    (set) => ({
      nivel: 1,
      xpTotal: 0,
      xpParaProximo: 500,
      addXp: (valor) =>
        set((state) => {
          const novoXp = state.xpTotal + valor;
          if (novoXp >= state.xpParaProximo) {
            const nivelNovo = state.nivel + 1;
            return {
              xpTotal: novoXp - state.xpParaProximo,
              nivel: nivelNovo,
              xpParaProximo: nivelNovo * 500,
            };
          }
          return { xpTotal: novoXp };
        }),
      removeXp: (valor) =>
        set((state) => {
          let novoXp = state.xpTotal - valor;
          let novoNivel = state.nivel;
          let novoXpParaProximo = state.xpParaProximo;

          // Lógica de Level Down: se o XP for negativo, volta um nível
          while (novoXp < 0 && novoNivel > 1) {
            novoNivel -= 1;
            novoXpParaProximo = novoNivel * 500;
            novoXp += novoXpParaProximo;
          }

          if (novoXp < 0 && novoNivel === 1) novoXp = 0;

          return {
            xpTotal: novoXp,
            nivel: novoNivel,
            xpParaProximo: novoXpParaProximo,
          };
        }),
    }),
    { name: "rpg-storage" },
  ),
);
