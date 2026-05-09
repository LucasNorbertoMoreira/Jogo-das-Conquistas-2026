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
        {/* Título adaptativo */}
        <h1 className='text-3xl font-bold text-white mb-2 text-center'>
          {isLogin ? "Entrar no Sistema" : "Criar Nova Conta"}
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

        <div className='mt-8 flex flex-col items-center gap-3 border-t border-[#273b4a] pt-6'>
          <span className='text-[#a0aec0] text-sm'>
            {isLogin ? "Ainda não faz parte do sistema?" : "Já tem uma conta?"}
          </span>
          <button
            type='button'
            onClick={() => setIsLogin(!isLogin)}
            className='font-black text-[#ca8aef] text-sm uppercase tracking-widest [text-shadow:0_0_15px_rgba(202,138,239,0.9)] hover:text-white hover:[text-shadow:0_0_25px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105 border border-[#ca8aef]/30 px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(202,138,239,0.15)] bg-[#ca8aef]/5 w-full max-w-[200px]'
          >
            {isLogin ? "Registre-se" : "Faça Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
