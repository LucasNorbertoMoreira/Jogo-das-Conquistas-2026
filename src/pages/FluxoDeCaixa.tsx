import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  created_at: string;
}

export function FluxoDeCaixa() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Busca dados apenas do mês atual
      const inicioDoMes = new Date();
      inicioDoMes.setDate(1);
      inicioDoMes.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", inicioDoMes.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const entradas = transacoes.filter((t) => t.tipo === "entrada");
  const saidas = transacoes.filter((t) => t.tipo === "saida");

  const totalEntradas = entradas.reduce(
    (acc, curr) => acc + Number(curr.valor),
    0,
  );
  const totalSaidas = saidas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoAtual = totalEntradas - totalSaidas;

  return (
    <div className='flex flex-col gap-6 max-w-4xl mx-auto pb-20 mt-8'>
      <div className='flex justify-between items-center border-b border-[#273b4a] pb-4'>
        <div>
          <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
            Fluxo de Caixa
          </h2>
          <p className='text-[#a0aec0] text-xs font-bold uppercase tracking-widest'>
            {new Date().toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={carregarDados}
          className='text-[#ca8aef] text-sm font-bold uppercase hover:underline'
        >
          Atualizar Dados
        </button>
      </div>

      {/* DASHBOARD DE MÉTRICAS */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-[#050e22] border border-[#273b4a] p-5 rounded-2xl shadow-xl flex flex-col justify-center items-center'>
          <span className='text-[10px] text-[#48a64b] font-black uppercase tracking-widest flex items-center gap-1 mb-2'>
            <TrendingUp size={14} /> Entradas
          </span>
          <span className='text-2xl font-black text-white'>
            R$ {totalEntradas.toFixed(2)}
          </span>
        </div>

        <div className='bg-[#050e22] border border-[#273b4a] p-5 rounded-2xl shadow-xl flex flex-col justify-center items-center'>
          <span className='text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 mb-2'>
            <TrendingDown size={14} /> Saídas
          </span>
          <span className='text-2xl font-black text-white'>
            R$ {totalSaidas.toFixed(2)}
          </span>
        </div>

        <div
          className={`border p-5 rounded-2xl shadow-xl flex flex-col justify-center items-center ${saldoAtual >= 0 ? "bg-[#48a64b]/10 border-[#48a64b]/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <span className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest flex items-center gap-1 mb-2'>
            <DollarSign size={14} /> Saldo Líquido
          </span>
          <span
            className={`text-3xl font-black ${saldoAtual >= 0 ? "text-[#48a64b]" : "text-red-500"}`}
          >
            R$ {saldoAtual.toFixed(2)}
          </span>
        </div>
      </div>

      {/* LISTAGEM DE TRANSAÇÕES */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-4'>
        {/* COLUNA ENTRADAS */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-xs font-black text-white uppercase tracking-widest bg-[#121a27] py-2 px-4 rounded-lg border border-[#273b4a]'>
            Registros de Entrada
          </h3>
          {loading ? (
            <p className='text-[#5a6b7a] text-xs font-bold uppercase p-4 text-center'>
              Carregando...
            </p>
          ) : entradas.length === 0 ? (
            <p className='text-[#5a6b7a] text-xs font-bold uppercase tracking-widest p-4 text-center border border-dashed border-[#273b4a] rounded-xl'>
              Sem entradas
            </p>
          ) : (
            entradas.map((t) => (
              <div
                key={t.id}
                className='bg-[#050e22] border border-[#48a64b]/30 p-3 rounded-xl flex justify-between items-center shadow-sm'
              >
                <div className='flex flex-col'>
                  <span className='text-white text-sm font-bold'>
                    {t.descricao}
                  </span>
                  <span className='text-[#5a6b7a] text-[10px] uppercase font-black'>
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <span className='text-[#48a64b] font-black text-sm bg-[#48a64b]/10 px-2 py-1 rounded-md'>
                  + R$ {Number(t.valor).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* COLUNA SAÍDAS */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-xs font-black text-white uppercase tracking-widest bg-[#121a27] py-2 px-4 rounded-lg border border-[#273b4a]'>
            Registros de Saída
          </h3>
          {loading ? (
            <p className='text-[#5a6b7a] text-xs font-bold uppercase p-4 text-center'>
              Carregando...
            </p>
          ) : saidas.length === 0 ? (
            <p className='text-[#5a6b7a] text-xs font-bold uppercase tracking-widest p-4 text-center border border-dashed border-[#273b4a] rounded-xl'>
              Sem saídas
            </p>
          ) : (
            saidas.map((t) => (
              <div
                key={t.id}
                className='bg-[#050e22] border border-red-500/30 p-3 rounded-xl flex justify-between items-center shadow-sm'
              >
                <div className='flex flex-col'>
                  <span className='text-white text-sm font-bold'>
                    {t.descricao}
                  </span>
                  <span className='text-[#5a6b7a] text-[10px] uppercase font-black'>
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <span className='text-red-500 font-black text-sm bg-red-500/10 px-2 py-1 rounded-md'>
                  - R$ {Number(t.valor).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
