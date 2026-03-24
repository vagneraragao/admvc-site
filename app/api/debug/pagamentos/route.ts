import { NextResponse } from 'next/server'

export async function GET() {
    const res = await fetch(`https://api.loyverse.com/v1.0/payment_types`, {
        headers: { 'Authorization': `Bearer ${process.env.LOYVERSE_ACCESS_TOKEN}` }
    });
    const data = await res.json();
    console.table(data.payment_types); // Procure o ID de "Cash" ou "Dinheiro"
    return NextResponse.json(data);
}