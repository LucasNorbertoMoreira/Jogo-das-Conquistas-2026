import { createClient } from "@supabase/supabase-js";

// 1. CONEXÃO PRINCIPAL (Sistema, Auth, Financeiro)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. CONEXÃO SECUNDÁRIA (Apenas Treinos)
const supabaseTreinosUrl = import.meta.env.VITE_SUPABASE_TREINOS_URL;
const supabaseTreinosKey = import.meta.env.VITE_SUPABASE_TREINOS_ANON_KEY;
export const supabaseTreinos = createClient(
  supabaseTreinosUrl,
  supabaseTreinosKey,
);
