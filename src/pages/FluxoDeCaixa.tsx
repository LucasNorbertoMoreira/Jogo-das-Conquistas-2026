import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  created_at: string;
  date?: string;
}

export function FluxoDeCaixa() {
  // Configura o mês atual como padrão no formato YYYY-MM
  const dataAtual = new Date();
  const mesAtualString = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}`;

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualString);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Quebra a string "YYYY-MM" para calcular os limites do mês
      const [ano, mes] = mesSelecionado.split("-");

      // Primeiro milissegundo do mês selecionado
      const dataInicio = new Date(
        Number(ano),
        Number(mes) - 1,
        1,
      ).toISOString();
      // Último milissegundo do mês selecionado (dia 0 do próximo mês = último dia do mês atual)
      const dataFim = new Date(
        Number(ano),
        Number(mes),
        0,
        23,
        59,
        59,
        999,
      ).toISOString();

      // Busca na tabela filtrando exatamente pelo intervalo de tempo do mês escolhido
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", dataInicio)
        .lte("created_at", dataFim)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  };

  // O useEffect agora observa o mesSelecionado. Se você trocar o mês no menu, ele recarrega sozinho.
  useEffect(() => {
    carregarDados();
  }, [mesSelecionado]);

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
      {/* CABEÇALHO COM O MENU DE MÊS */}
      <div className='flex justify-between items-end border-b border-[#273b4a] pb-4'>
        <div>
          <h2 className='text-2xl font-black text-white uppercase tracking-tighter'>
            Fluxo de Caixa
          </h2>

          {/* Seletor de Data Interativo */}
          <div className='flex items-center gap-2 mt-2 bg-[#121a27] border border-[#273b4a] rounded-lg px-3 py-1.5 w-max hover:border-[#ca8aef] transition-colors'>
            <Calendar size={14} className='text-[#ca8aef]' />
            <input
              type='month'
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className='bg-transparent text-[#a0aec0] text-xs font-bold uppercase tracking-widest outline-none cursor-pointer focus:text-white transition-colors'
            />
          </div>
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
          className={`border p-5 rounded-2xl shadow-xl flex flex-col justify-center items-center transition-colors ${saldoAtual >= 0 ? "bg-[#48a64b]/10 border-[#48a64b]/30" : "bg-red-500/10 border-red-500/30"}`}
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
              Sem entradas neste mês
            </p>
          ) : (
            entradas.map((t) => (
              <div
                key={t.id}
                className='bg-[#050e22] border border-[#48a64b]/30 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-[#48a64b] transition-colors'
              >
                <div className='flex flex-col'>
                  <span className='text-white text-sm font-bold'>
                    {t.descricao}
                  </span>
                  <span className='text-[#5a6b7a] text-[10px] uppercase font-black'>
                    {/* Se a coluna date existir no banco, usa ela, senão pega do created_at */}
                    {t.date
                      ? new Date(t.date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })
                      : new Date(t.created_at).toLocaleDateString("pt-BR")}
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
              Sem saídas neste mês
            </p>
          ) : (
            saidas.map((t) => (
              <div
                key={t.id}
                className='bg-[#050e22] border border-red-500/30 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-red-500 transition-colors'
              >
                <div className='flex flex-col'>
                  <span className='text-white text-sm font-bold'>
                    {t.descricao}
                  </span>
                  <span className='text-[#5a6b7a] text-[10px] uppercase font-black'>
                    {t.date
                      ? new Date(t.date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })
                      : new Date(t.created_at).toLocaleDateString("pt-BR")}
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
