import { useState } from "react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert(
          "Verifique seu e-mail para confirmar o cadastro (se necessário) ou faça login.",
        );
      }
    } catch (error: any) {
      alert(error.message || "Erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#050e22] flex justify-center items-center p-4'>
      <div className='bg-[#121a27] border border-[#273b4a] w-full max-w-md rounded-2xl p-8 shadow-2xl'>
        <h1 className='text-3xl font-bold text-white mb-2 text-center'>
          {isLogin ? "Entrar no Sistema" : "Forjar Nova Conta"}
        </h1>
        <p className='text-[#a0aec0] text-center mb-8'>
          Sua disciplina convertida em XP.
        </p>

        <form onSubmit={handleAuth} className='flex flex-col gap-5'>
          <div>
            <label className='block text-[#b7b7b7] text-sm mb-1'>E-mail</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-3 focus:outline-none focus:border-[#ca8aef] transition-colors'
              required
            />
          </div>
          <div>
            <label className='block text-[#b7b7b7] text-sm mb-1'>Senha</label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full bg-[#050e22] text-white border border-[#273b4a] rounded-lg p-3 focus:outline-none focus:border-[#ca8aef] transition-colors'
              required
              minLength={6}
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full mt-2 bg-gradient-to-r from-[#ca8aef] to-[#a564d3] text-white font-bold py-3 rounded-lg hover:shadow-[0_0_15px_rgba(202,138,239,0.5)] transition-all disabled:opacity-50'
          >
            {loading ? "Acessando..." : isLogin ? "Entrar" : "Registrar"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className='w-full mt-6 text-[#b7b7b7] text-sm hover:text-white transition-colors'
        >
          {isLogin
            ? "Ainda não tem conta? Registre-se."
            : "Já tem uma conta? Entre aqui."}
        </button>
      </div>
    </div>
  );
}
