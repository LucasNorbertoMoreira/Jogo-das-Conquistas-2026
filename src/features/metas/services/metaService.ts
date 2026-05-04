import { supabase } from "../../../lib/supabase";

const PONTOS_BASE = { metinha: 10, meta: 50, metona: 250 };
const MULTIPLICADORES = { baixa: 0.5, media: 1.0, alta: 2.0 };

export const metaService = {
  async getMetas() {
    const { data, error } = await supabase
      .from("metas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMeta(meta: any) {
    // 1. Pega o usuário que acabou de logar
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const xp_valor = Math.round(
      PONTOS_BASE[meta.tipo as keyof typeof PONTOS_BASE] *
        MULTIPLICADORES[meta.prioridade as keyof typeof MULTIPLICADORES],
    );

    // 2. Insere a meta no banco enviando o user_id obrigatório
    const { data, error } = await supabase
      .from("metas")
      .insert([{ ...meta, xp_valor, user_id: user.id }])
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  },

  async updateMeta(id: string, updates: any) {
    // Se a edição incluiu uma mudança de tipo ou prioridade, nós recalculamos o XP na hora
    if (updates.tipo && updates.prioridade) {
      updates.xp_valor = Math.round(
        PONTOS_BASE[updates.tipo as keyof typeof PONTOS_BASE] *
          MULTIPLICADORES[updates.prioridade as keyof typeof MULTIPLICADORES],
      );
    }

    const { data, error } = await supabase
      .from("metas")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  },

  async deleteMeta(id: string) {
    const { error } = await supabase.from("metas").delete().eq("id", id);

    if (error) {
      console.error("Erro Supabase:", error.message);
      throw error;
    }
    return true;
  },

  // --- NOVAS FUNÇÕES PARA TAGS ---
  async getTags() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createTag(nome: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("tags")
      .insert([{ nome, user_id: user.id }])
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  },

  async deleteTag(id: string) {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
  },
};
