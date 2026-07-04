import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Plus,
} from "lucide-react";

interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  created_at: string;
  date?: string;
}

export function FluxoDeCaixa() {
  const dataAtual = new Date();
  const mesAtualString = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}`;
  const dataHojeString = dataAtual.toISOString().split("T")[0];

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualString);

  // Estados do Modal de Edição
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | null>(
    null,
  );
  const [editDescricao, setEditDescricao] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editData, setEditData] = useState("");

  // Estados do Modal de Criação
  const [isCriando, setIsCriando] = useState(false);
  const [novoTipo, setNovoTipo] = useState<"entrada" | "saida">("entrada");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novaData, setNovaData] = useState(dataHojeString);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [ano, mes] = mesSelecionado.split("-");

      // 1. Gera strings limpas (YYYY-MM-DD) para comparar exatamente com a coluna 'date'
      const dataInicio = `${ano}-${mes}-01`;
      const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate();
      const dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, "0")}`;

      // 2. O filtro agora ataca a coluna 'date' em vez do 'created_at'
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", dataInicio) // CORREÇÃO AQUI
        .lte("date", dataFim) // CORREÇÃO AQUI
        .order("date", { ascending: false })
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
  }, [mesSelecionado]);

  const alterarMes = (direcao: "prev" | "next") => {
    const [ano, mes] = mesSelecionado.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);
    if (direcao === "prev") data.setMonth(data.getMonth() - 1);
    if (direcao === "next") data.setMonth(data.getMonth() + 1);
    setMesSelecionado(
      `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const obterNomeMesSelecionado = () => {
    const [ano, mes] = mesSelecionado.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);
    return data
      .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      .toUpperCase();
  };

  // CRUD - Deletar
  const deletarTransacao = async (id: string) => {
    if (
      !window.confirm(
        "Você tem certeza que deseja deletar este registro? Isso não pode ser desfeito.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .eq("id", id);
      if (error) throw error;
      carregarDados();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao deletar transação.");
    }
  };

  // CRUD - Editar
  const abrirModalEdicao = (t: Transacao) => {
    setTransacaoEmEdicao(t);
    setEditDescricao(t.descricao);
    setEditValor(t.valor.toString());
    const dataFormatada = t.date ? t.date : t.created_at.split("T")[0];
    setEditData(dataFormatada);
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transacaoEmEdicao) return;
    try {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .update({
          descricao: editDescricao,
          valor: parseFloat(editValor),
          date: editData,
        })
        .eq("id", transacaoEmEdicao.id);
      if (error) throw error;
      setTransacaoEmEdicao(null);
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  // CRUD - Criar
  const salvarNovaTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("transacoes_financeiras").insert([
        {
          user_id: user.id,
          tipo: novoTipo,
          descricao: novaDescricao,
          valor: parseFloat(novoValor),
          date: novaData,
        },
      ]);

      if (error) throw error;

      setIsCriando(false);
      setNovaDescricao("");
      setNovoValor("");
      setNovoTipo("entrada");
      carregarDados();
    } catch (error) {
      console.error("Erro ao criar:", error);
      alert("Erro ao registrar nova transação.");
    }
  };

  const entradas = transacoes.filter((t) => t.tipo === "entrada");
  const saidas = transacoes.filter((t) => t.tipo === "saida");
  const totalEntradas = entradas.reduce(
    (acc, curr) => acc + Number(curr.valor),
    0,
  );
  const totalSaidas = saidas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoAtual = totalEntradas - totalSaidas;

  return (
    <div className='flex flex-col gap-6 max-w-4xl mx-auto pb-20 mt-8 relative'>
      {/* CABEÇALHO */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#273b4a] pb-4 gap-4'>
        <div>
          <h2 className='text-2xl font-black text-white uppercase tracking-tighter mb-2'>
            Fluxo de Caixa
          </h2>

          <div className='flex items-center gap-4 bg-[#121a27] border border-[#273b4a] rounded-lg p-1 w-max'>
            <button
              onClick={() => alterarMes("prev")}
              className='p-1.5 text-[#5a6b7a] hover:text-[#ca8aef] hover:bg-[#273b4a] rounded-md transition-all'
            >
              <ChevronLeft size={18} />
            </button>
            <span className='text-[#a0aec0] text-xs font-black uppercase tracking-widest min-w-[120px] text-center'>
              {obterNomeMesSelecionado()}
            </span>
            <button
              onClick={() => alterarMes("next")}
              className='p-1.5 text-[#5a6b7a] hover:text-[#ca8aef] hover:bg-[#273b4a] rounded-md transition-all'
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={carregarDados}
            className='text-[#5a6b7a] text-xs font-bold uppercase hover:text-white transition-colors'
          >
            Atualizar
          </button>
          <button
            onClick={() => setIsCriando(true)}
            className='flex items-center gap-2 bg-[#ca8aef] text-[#050e22] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:scale-[1.02] transition-transform'
          >
            <Plus size={16} /> Novo Registro
          </button>
        </div>
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

      {/* COMPONENTE DE RENDERIZAÇÃO DE LISTA */}
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
                className='group bg-[#050e22] border border-[#48a64b]/30 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-[#48a64b] transition-colors'
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
                <div className='flex items-center gap-3'>
                  <span className='text-[#48a64b] font-black text-sm bg-[#48a64b]/10 px-2 py-1 rounded-md'>
                    + R$ {Number(t.valor).toFixed(2)}
                  </span>
                  <div className='flex md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1'>
                    <button
                      onClick={() => abrirModalEdicao(t)}
                      className='p-1.5 text-[#5a6b7a] hover:text-[#ca8aef] hover:bg-[#121a27] rounded'
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deletarTransacao(t.id)}
                      className='p-1.5 text-[#5a6b7a] hover:text-red-500 hover:bg-[#121a27] rounded'
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
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
                className='group bg-[#050e22] border border-red-500/30 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-red-500 transition-colors'
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
                <div className='flex items-center gap-3'>
                  <span className='text-red-500 font-black text-sm bg-red-500/10 px-2 py-1 rounded-md'>
                    - R$ {Number(t.valor).toFixed(2)}
                  </span>
                  <div className='flex md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1'>
                    <button
                      onClick={() => abrirModalEdicao(t)}
                      className='p-1.5 text-[#5a6b7a] hover:text-[#ca8aef] hover:bg-[#121a27] rounded'
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deletarTransacao(t.id)}
                      className='p-1.5 text-[#5a6b7a] hover:text-red-500 hover:bg-[#121a27] rounded'
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isCriando && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-[#050e22] border border-[#273b4a] rounded-2xl w-full max-w-md p-6 shadow-2xl relative'>
            <button
              onClick={() => setIsCriando(false)}
              className='absolute top-4 right-4 text-[#5a6b7a] hover:text-white transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='text-xl font-black text-white uppercase tracking-tighter mb-4'>
              Novo Registro
            </h3>

            <form
              onSubmit={salvarNovaTransacao}
              className='flex flex-col gap-4'
            >
              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Tipo de Transação
                </label>
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() => setNovoTipo("entrada")}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${novoTipo === "entrada" ? "bg-[#48a64b]/20 border border-[#48a64b] text-[#48a64b]" : "bg-[#121a27] border border-[#273b4a] text-[#5a6b7a] hover:border-[#48a64b]/50"}`}
                  >
                    ENTRADA (+)
                  </button>
                  <button
                    type='button'
                    onClick={() => setNovoTipo("saida")}
                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${novoTipo === "saida" ? "bg-red-500/20 border border-red-500 text-red-500" : "bg-[#121a27] border border-[#273b4a] text-[#5a6b7a] hover:border-red-500/50"}`}
                  >
                    SAÍDA (-)
                  </button>
                </div>
              </div>

              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Razão / Descrição
                </label>
                <input
                  type='text'
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder='Ex: Edição de vídeo'
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef]'
                  required
                />
              </div>

              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Valor (R$)
                </label>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  placeholder='0.00'
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef]'
                  required
                />
              </div>

              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Data Real
                </label>
                <input
                  type='date'
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef] color-scheme-dark'
                  required
                />
              </div>

              <button
                type='submit'
                className={`w-full font-black py-4 rounded-xl uppercase tracking-widest mt-2 hover:scale-[1.02] transition-transform text-[#050e22] ${novoTipo === "entrada" ? "bg-[#48a64b]" : "bg-red-500"}`}
              >
                Confirmar {novoTipo}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {transacaoEmEdicao && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-[#050e22] border border-[#273b4a] rounded-2xl w-full max-w-md p-6 shadow-2xl relative'>
            <button
              onClick={() => setTransacaoEmEdicao(null)}
              className='absolute top-4 right-4 text-[#5a6b7a] hover:text-white transition-colors'
            >
              <X size={20} />
            </button>
            <h3 className='text-xl font-black text-white uppercase tracking-tighter mb-4'>
              Editar Transação
            </h3>

            <form onSubmit={salvarEdicao} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Razão / Descrição
                </label>
                <input
                  type='text'
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef]'
                  required
                />
              </div>

              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Valor (R$)
                </label>
                <input
                  type='number'
                  step='0.01'
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef]'
                  required
                />
              </div>

              <div className='flex flex-col gap-1'>
                <label className='text-[10px] text-[#a0aec0] font-black uppercase tracking-widest'>
                  Data Real
                </label>
                <input
                  type='date'
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  className='bg-[#121a27] border border-[#273b4a] text-white p-3 rounded-xl outline-none focus:border-[#ca8aef] color-scheme-dark'
                  required
                />
              </div>

              <button
                type='submit'
                className='w-full bg-[#ca8aef] text-[#050e22] font-black py-4 rounded-xl uppercase tracking-widest mt-2 hover:scale-[1.02] transition-transform'
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
