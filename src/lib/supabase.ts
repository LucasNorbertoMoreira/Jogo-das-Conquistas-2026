import { createClient } from "@supabase/supabase-js";

// Agora ele busca do .env de forma segura
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "As chaves do Supabase não foram configuradas no arquivo .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
