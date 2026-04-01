import { NextResponse } from 'next/server'

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Endpoint indisponível.' }, { status: 404 })
    }

    const res = await fetch(`https://api.loyverse.com/v1.0/payment_types`, {
        headers: { 'Authorization': `Bearer ${process.env.LOYVERSE_ACCESS_TOKEN}` }
    });
    const data = await res.json();
    console.table(data.payment_types);
    return NextResponse.json(data);
}
