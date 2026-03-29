'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 1. BUSCAR O REPERTÓRIO DE UM EVENTO ESPECÍFICO
export async function getRepertorioByEvento(eventoId: number) {
    try {
        const repertorio = await prisma.repertorioEvento.findMany({
            where: { evento_id: eventoId },
            include: {
                musica: true // Traz os dados da música junto (título, link, bpm)
            },
            orderBy: {
                ordem: 'asc' // Garante que a lista vem na ordem certa do culto
            }
        });
        return { success: true, data: repertorio };
    } catch (error: any) {
        return { success: false, error: 'Erro ao buscar repertório: ' + error.message };
    }
}

// 2. BUSCAR MÚSICAS NO CATÁLOGO (Para a barra de pesquisa ao adicionar)
export async function buscarMusicasCatalogo(busca: string = '') {
    try {
        const musicas = await prisma.musica.findMany({
            where: {
                OR: [
                    { titulo: { contains: busca, mode: 'insensitive' } },
                    { artista: { contains: busca, mode: 'insensitive' } }
                ]
            },
            orderBy: { titulo: 'asc' },
            take: 10 // Limita a 10 para não pesar a busca
        });
        return { success: true, data: musicas };
    } catch (error: any) {
        return { success: false, error: 'Erro ao buscar músicas: ' + error.message };
    }
}

// 3. ADICIONAR MÚSICA AO EVENTO (Cria a ligação e define a ordem)
export async function adicionarMusicaAoRepertorio(eventoId: number, musicaId: string, tomTocado: string) {
    try {
        // Primeiro, descobre qual é a última ordem para colocar a nova no final
        const ultimaMusica = await prisma.repertorioEvento.findFirst({
            where: { evento_id: eventoId },
            orderBy: { ordem: 'desc' }
        });

        const proximaOrdem = ultimaMusica ? ultimaMusica.ordem + 1 : 1;

        const novoItem = await prisma.repertorioEvento.create({
            data: {
                evento_id: eventoId,
                musica_id: musicaId,
                tom_tocado: tomTocado,
                ordem: proximaOrdem
            }
        });

        // Atualiza a página onde o repertório está a ser exibido
        revalidatePath('/membros/dashboard');
        revalidatePath(`/eventos/${eventoId}`);

        return { success: true, data: novoItem };
    } catch (error: any) {
        // Tratamento especial para o erro de música duplicada (Unique constraint)
        if (error.code === 'P2002') {
            return { success: false, error: 'Esta música já está no repertório deste culto.' };
        }
        return { success: false, error: 'Erro ao adicionar música: ' + error.message };
    }
}

// 4. REMOVER MÚSICA DO REPERTÓRIO
export async function removerMusicaDoRepertorio(repertorioId: string) {
    try {
        await prisma.repertorioEvento.delete({
            where: { id: repertorioId }
        });

        revalidatePath('/membros/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Erro ao remover música: ' + error.message };
    }
}

// 5. CADASTRAR UMA MÚSICA NOVA NO BANCO (Caso não exista no catálogo)
export async function criarNovaMusica(titulo: string, artista?: string, bpm?: number, link_video?: string) {
    try {
        const novaMusica = await prisma.musica.create({
            data: {
                titulo,
                artista,
                bpm,
                link_video
            }
        });
        return { success: true, data: novaMusica };
    } catch (error: any) {
        return { success: false, error: 'Erro ao criar música no catálogo: ' + error.message };
    }
}

// Adicione esta função no seu actions/louvor-actions.ts
export async function adicionarMusicaRapidaAoEvento(eventoId: number, titulo: string, tom: string, link: string) {
    try {
        // 1. Procura se a música já existe ou cria uma nova na hora
        let musica = await prisma.musica.findFirst({
            where: { titulo: { equals: titulo, mode: 'insensitive' } }
        });

        if (!musica) {
            musica = await prisma.musica.create({
                data: { titulo, link_video: link }
            });
        } else if (link && !musica.link_video) {
            // Se a música já existia mas não tinha link, atualiza com o novo link
            musica = await prisma.musica.update({
                where: { id: musica.id },
                data: { link_video: link }
            });
        }

        // 2. Define a ordem (coloca no final da lista)
        const ultimaMusica = await prisma.repertorioEvento.findFirst({
            where: { evento_id: eventoId },
            orderBy: { ordem: 'desc' }
        });
        const proximaOrdem = ultimaMusica ? ultimaMusica.ordem + 1 : 1;

        // 3. Salva a música na escala do culto
        const novoItem = await prisma.repertorioEvento.create({
            data: {
                evento_id: eventoId,
                musica_id: musica.id,
                tom_tocado: tom,
                ordem: proximaOrdem
            }
        });

        revalidatePath('/membros/dashboard');
        return { success: true, data: novoItem };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: 'Esta música já está nesta escala.' };
        }
        return { success: false, error: 'Erro ao adicionar música: ' + error.message };
    }
}

// Adicione no final do arquivo actions/louvor-actions.ts
export async function atualizarOrdemRepertorio(itens: { id: string, ordem: number }[]) {
    try {
        // Usa uma transação para atualizar todas as ordens de uma vez com segurança
        await prisma.$transaction(
            itens.map(item =>
                prisma.repertorioEvento.update({
                    where: { id: item.id },
                    data: { ordem: item.ordem }
                })
            )
        );
        revalidatePath('/membros/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Erro ao reordenar: ' + error.message };
    }
}


// 2. Busca músicas APENAS no nosso banco de dados (Offline, super rápido)
export async function buscarMusicasLocalmente(busca: string) {
    try {
        const musicas = await prisma.musica.findMany({
            where: {
                OR: [
                    { titulo: { contains: busca, mode: 'insensitive' } },
                    { artista: { contains: busca, mode: 'insensitive' } }
                ]
            },
            take: 15, // Traz só as 15 primeiras para não pesar a tela
            orderBy: { titulo: 'asc' }
        });
        return { success: true, data: musicas };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 3. Adiciona a música na escala usando o ID do nosso banco
export async function adicionarMusicaLocalAoEvento(eventoId: number, musicaId: string, tom: string) {
    try {
        const ultimaMusica = await prisma.repertorioEvento.findFirst({
            where: { evento_id: eventoId },
            orderBy: { ordem: 'desc' }
        });
        const proximaOrdem = ultimaMusica ? ultimaMusica.ordem + 1 : 1;

        const novoItem = await prisma.repertorioEvento.create({
            data: { evento_id: eventoId, musica_id: musicaId, tom_tocado: tom, ordem: proximaOrdem }
        });

        revalidatePath('/membros/dashboard');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, error: 'Esta música já está na escala.' };
        return { success: false, error: 'Erro ao adicionar música.' };
    }
}


export async function sincronizarAcervoLocal(musicasHolyrics: any[]) {
    try {
        let inseridas = 0;
        let atualizadas = 0;

        for (const m of musicasHolyrics) {
            const existe = await prisma.musica.findUnique({ where: { holyrics_id: m.id } });

            if (existe) {
                await prisma.musica.update({
                    where: { id: existe.id },
                    data: { titulo: m.title, artista: m.artist || null }
                });
                atualizadas++;
            } else {
                await prisma.musica.create({
                    data: { holyrics_id: m.id, titulo: m.title, artista: m.artist || null }
                });
                inseridas++;
            }
        }
        // ATUALIZADO: Agora devolve as variáveis soltas para o frontend usar
        return { success: true, inseridas, atualizadas };
    } catch (error: any) {
        return { success: false, error: 'Erro ao sincronizar acervo: ' + error.message };
    }
}

export async function getEstatisticasEscalas(departamentoId: number) {
    try {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        // Busca todas as escalas passadas do departamento
        const historico = await prisma.escala.findMany({
            where: {
                departamento_id: departamentoId,
                evento: { data: { lte: new Date() } } // Apenas eventos que já passaram ou são hoje
            },
            include: {
                membro: true,
                evento: true
            },
            orderBy: { evento: { data: 'desc' } }
        });

        // Agrupar estatísticas por membro
        const estatisticasMembros = historico.reduce((acc: any, esc) => {
            const mId = esc.membro_id;
            if (!acc[mId]) {
                acc[mId] = {
                    nome: `${esc.membro.first_name} ${esc.membro.last_name}`,
                    total: 0,
                    funcoes: new Set(),
                    ultimaVez: esc.evento.data,
                    presencas: 0
                };
            }
            acc[mId].total += 1;
            acc[mId].funcoes.add(esc.funcao);
            if (new Date(esc.evento.data) > new Date(acc[mId].ultimaVez)) {
                acc[mId].ultimaVez = esc.evento.data;
            }
            return acc;
        }, {});

        return {
            success: true,
            data: Object.values(estatisticasMembros).map((m: any) => ({ ...m, funcoes: Array.from(m.funcoes) })),
            historicoCompleto: historico.slice(0, 20) // Últimas 20 escalas para o log
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}