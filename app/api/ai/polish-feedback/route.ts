import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase.server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { draft, projectId } = await req.json();

    if (!draft || !draft.trim()) {
      return NextResponse.json({ error: "O rascunho de texto está vazio" }, { status: 400 });
    }

    const db = getAdminDb();
    let projectName = "Projeto de Software";
    let testInstructions = "Não fornecidas";

    if (projectId) {
      const projectSnap = await db.collection("projects").doc(projectId).get();
      if (projectSnap.exists) {
        const pData = projectSnap.data()!;
        projectName = pData.name || projectName;
        testInstructions = pData.testInstructions || testInstructions;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Gemini não configurada localmente" }, { status: 500 });
    }

    const prompt = `Você é o assistente oficial de Inteligência Artificial da plataforma GiveToGet (uma comunidade de feedback mútuo entre desenvolvedores de software).
Seu trabalho é polir, estruturar e melhorar o rascunho de uma avaliação/feedback escrito por um desenvolvedor sobre um projeto/produto.

Detalhes do contexto:
- Nome do Projeto: "${projectName || "Projeto de Software"}"
- Instruções originais de teste do Criador: "${testInstructions || "Não fornecidas"}"
- Rascunho escrito pelo Avaliador: "${draft}"

Instruções para a reescrita:
1. Reescreva o feedback em português (PT-BR) de forma extremamente construtiva, profissional, clara e amigável.
2. Estruture em seções curtas usando Markdown (ex: 🛠️ UX/UI, 🐛 Bugs encontrados, 🚀 Pontos fortes).
3. Seja honesto, técnico e direto, mas mantenha um tom de encorajamento para ajudar o desenvolvedor a melhorar.
4. Mantenha e destaque quaisquer detalhes técnicos originais do rascunho (como logs de erros ou fluxos de tela que falharam).
5. O resultado deve ser APENAS a mensagem polida pronta para publicação, formatada em markdown básico. Não inclua observações como "Aqui está o seu feedback", apenas o texto formatado.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://givetoget-2785d.firebaseapp.com/",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("[Gemini API Error]", errData);
      return NextResponse.json({ error: "Erro na comunicação com a API do Gemini" }, { status: 502 });
    }

    const data = await response.json();
    const polishedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ polishedText });
  } catch (error) {
    console.error("[polish-feedback] Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
