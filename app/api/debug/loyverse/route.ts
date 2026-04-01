import { NextResponse } from 'next/server'

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Endpoint indisponível.' }, { status: 404 })
    }

    try {
        const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;

        const res = await fetch(`https://api.loyverse.com/v1.0/customers?limit=250`, {
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });

        if (!res.ok) return NextResponse.json({ error: "Erro na API" }, { status: res.status });

        const data = await res.json();

        const listaSimplificada = data.customers.map((c: any) => ({
            nome: c.name,
            email: c.email,
            id_real_uuid: c.id,
            codigo_antigo: c.customer_code
        }));

        console.table(listaSimplificada);

        return NextResponse.json({
            message: "Verifica o teu terminal",
            total: listaSimplificada.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
