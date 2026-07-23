const carregarHistorico = async () => {
  setLoading(true);
  try {
    // A chamada supabase.auth.getUser() foi removida.
    // Vamos buscar os dados diretamente usando o seletor.

    const { data, error } = await supabaseTreinos
      .from("workout_sets")
      .select(
        `
        reps,
        weight,
        rpe,
        workout_sessions!inner(started_at)
      `,
      )
      .eq("exercise_id", exercicioSelecionado);

    if (error) throw error;

    // Regra de negócio: Agrupar os sets por dia (Sessão)
    const agrupadoPorDia = (data as any[]).reduce(
      (acc, curr) => {
        const dataSessao = new Date(
          curr.workout_sessions.started_at,
        ).toLocaleDateString("pt-BR");

        if (!acc[dataSessao]) {
          acc[dataSessao] = {
            data: dataSessao,
            sets: 0,
            volumeTotal: 0,
            cargaMaxima: 0,
            rpeSoma: 0,
          };
        }

        acc[dataSessao].sets += 1;
        acc[dataSessao].volumeTotal += curr.reps;
        acc[dataSessao].cargaMaxima = Math.max(
          acc[dataSessao].cargaMaxima,
          curr.weight || 0,
        );
        acc[dataSessao].rpeSoma += curr.rpe || 0;

        return acc;
      },
      {} as Record<string, any>,
    );

    // Formata e ordena...
    const historicoFormatado = Object.values(agrupadoPorDia).map(
      (dia: any) => ({
        data: dia.data,
        sets: dia.sets,
        volumeTotal: dia.volumeTotal,
        cargaMaxima: dia.cargaMaxima,
        rpeMedio: Number((dia.rpeSoma / dia.sets).toFixed(1)),
      }),
    );

    historicoFormatado.sort((a: any, b: any) => {
      const [diaA, mesA, anoA] = a.data.split("/");
      const [diaB, mesB, anoB] = b.data.split("/");
      return (
        new Date(`${anoB}-${mesB}-${diaB}`).getTime() -
        new Date(`${anoA}-${mesA}-${diaA}`).getTime()
      );
    });

    setHistorico(historicoFormatado);
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
  } finally {
    setLoading(false);
  }
};
