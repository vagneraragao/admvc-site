// app/louvor/setlist/[eventoId]/page.tsx
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SetlistPalco from '@/components/louvor/SetlistPalco'

export const revalidate = 45

export default async function SetlistPage({ params }: { params: { eventoId: string } }) {
    const eventoId = Number(params.eventoId)
    if (isNaN(eventoId)) notFound()

    const evento = await prisma.evento.findUnique({
        where: { id: eventoId },
        include: {
            repertorio: {
                include: {
                    musica: true
                },
                orderBy: { ordem: 'asc' }
            }
        }
    })

    if (!evento) notFound()

    // Serializa datas para o client
    const eventoSerializado = {
        id: evento.id,
        nome: evento.nome,
        data: evento.data.toISOString(),
        repertorio: evento.repertorio.map(r => ({
            id: r.id,
            ordem: r.ordem,
            tom_tocado: r.tom_tocado,
            musica: {
                id: r.musica.id,
                titulo: r.musica.titulo,
                artista: r.musica.artista,
                tom: r.musica.tom,
                bpm: r.musica.bpm,
                link_letra: r.musica.link_letra,
                link_cifra: r.musica.link_cifra,
                link_audio: r.musica.link_audio,
                link_video: r.musica.link_video,
                cifra_interna: r.musica.cifra_interna,
            }
        }))
    }

    return <SetlistPalco evento={eventoSerializado} />
}