import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;

        // Busca os clientes do Loyverse (limitado aos primeiros 250)
        const res = await fetch(`https://api.loyverse.com/v1.0/customers?limit=250`, {
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });

        if (!res.ok) return NextResponse.json({ error: "Erro na API" }, { status: res.status });

        const data = await res.json();

        // Mapeia apenas o que nos interessa para o terminal
        const listaSimplificada = data.customers.map((c: any) => ({
            nome: c.name,
            email: c.email,
            id_real_uuid: c.id, // ESTE É O QUE PRECISAS
            codigo_antigo: c.customer_code
        }));

        console.table(listaSimplificada); // Imprime uma tabela linda no teu terminal

        return NextResponse.json({
            message: "Verifica o teu terminal (consola do VS Code/CMD)",
            total: listaSimplificada.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}