import { supabase } from "../lib/supabase";

export const habitService = {
  // Busca as definições dos hábitos
  async getHabitos() {
    const { data, error } = await supabase
      .from("habitos")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  // Busca o que foi feito HOJE
  async getRegistrosHoje() {
    const hoje = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("registros_habitos")
      .select("*")
      .eq("data", hoje);
    if (error) throw error;
    return data;
  },

  // Marca ou desmarca um hábito
  async toggleHabito(habitoId: string, concluido: boolean, userId: string) {
    const hoje = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("registros_habitos")
      .upsert(
        {
          habito_id: habitoId,
          user_id: userId,
          data: hoje,
          concluido: concluido,
        },
        { onConflict: "habito_id, data" },
      )
      .select();

    if (error) throw error;
    return data;
  },

  // CRIA UM NOVO HÁBITO
  async criarHabito(
    nome: string,
    userId: string,
    xpGanho: number,
    xpPenalidade: number,
  ) {
    const { data, error } = await supabase
      .from("habitos")
      .insert([
        {
          nome,
          user_id: userId,
          xp_ganho: xpGanho,
          xp_penalidade: xpPenalidade,
        },
      ])
      .select();

    if (error) {
      console.error("Erro no Supabase:", error);
      throw error;
    }
    return data[0];
  },
};
