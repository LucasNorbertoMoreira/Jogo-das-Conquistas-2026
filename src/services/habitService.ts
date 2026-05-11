import { supabase } from "../lib/supabase";

export const habitService = {
  async getHabitos() {
    const { data, error } = await supabase
      .from("habitos")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getRegistrosHoje() {
    const hoje = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("registros_habitos")
      .select("*")
      .eq("data", hoje);
    if (error) throw error;
    return data;
  },

  // FUNÇÃO REESCRITA: CIRÚRGICA E INFALÍVEL
  async toggleHabito(habitoId: string, concluido: boolean, userId: string) {
    const hoje = new Date().toISOString().split("T")[0];

    // 1. Verifica se o usuário já clicou neste hábito hoje
    const { data: existente, error: erroBusca } = await supabase
      .from("registros_habitos")
      .select("id")
      .eq("habito_id", habitoId)
      .eq("data", hoje)
      .maybeSingle(); // Retorna 1 registro ou nulo, sem dar erro

    if (erroBusca) throw erroBusca;

    if (existente) {
      // 2. Se já existe, apenas atualiza o status de concluído
      const { data, error } = await supabase
        .from("registros_habitos")
        .update({ concluido })
        .eq("id", existente.id)
        .select();
      if (error) throw error;
      return data;
    } else {
      // 3. Se não existe, insere o novo registro do dia
      const { data, error } = await supabase
        .from("registros_habitos")
        .insert([
          {
            habito_id: habitoId,
            user_id: userId,
            data: hoje,
            concluido,
          },
        ])
        .select();
      if (error) throw error;
      return data;
    }
  },

  async criarHabito(
    nome: string,
    userId: string,
    tipo: string,
    xpGanho: number,
    xpPenalidade: number,
  ) {
    const { data, error } = await supabase
      .from("habitos")
      .insert([
        {
          nome,
          user_id: userId,
          tipo,
          xp_ganho: xpGanho,
          xp_penalidade: xpPenalidade,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteHabito(id: string) {
    const { error } = await supabase.from("habitos").delete().eq("id", id);
    if (error) throw error;
  },
};
