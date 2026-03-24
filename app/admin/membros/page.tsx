// app/admin/membros/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image' // Importante para otimização de imagens no Next.js
import Breadcrumbs from '@/components/Breadcrumbs';
export const dynamic = 'force-dynamic' // Garante que a lista esteja sempre atualizada

export default async function ListaMembrosAdmin() {
    // 1. Buscar todos os membros ordenados pelos mais recentes
    const membros = await prisma.membro.findMany({
        orderBy: {
            created_at: 'desc'
        },
        // Opcional: Selecionar apenas os campos necessários para a tabela para performance
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_1: true,
            gender: true,
            baptism_status: true,
            id_city: true,
            avatar_file: true, // Buscamos a URL da foto
            created_at: true,
        }
    })

    return (
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
            {/* HEADER DO PAINEL */}
            <div className="max-w-7xl mx-auto pt-8 px-6">
                <Breadcrumbs items={[{ label: "Membros" }]} />
                {/*<h1 className="text-3xl font-black italic uppercase tracking-tighter">Gestão de Membros</h1>*/}
            </div>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-soft pb-10">

                <div>
                    <span className="text-figueira font-black text-xs uppercase tracking-[0.3em]">Gestão de Registos</span>
                    <h1 className="text-5xl font-black text-fg italic tracking-tighter uppercase leading-tight">Membros <span className="text-muted">ADMVC</span></h1>
                    <p className="text-sm text-muted font-medium uppercase tracking-widest mt-1">Total de {membros.length} registos ativos no sistema</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/membros/cadastro" className="bg-figueira text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-figueira/20">
                        + Novo Cadastro
                    </Link>
                    <button className="bg-bg2 border border-soft text-fg px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-soft transition-all">
                        Exportar Dados
                    </button>
                </div>
            </header>

            {/* TABELA DE DADOS (Com Foto) */}
            <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-soft/10 border-b border-soft">
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em] md:pl-10">Membro</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Contacto</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Batismo</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Cidade</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Cadastro</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right md:pr-10">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft">
                            {membros.map((membro) => (
                                <tr key={membro.id} className="hover:bg-figueira/[0.02] transition-colors group">

                                    {/* COLUNA NOME COM FOTOGRAFIA (AVATAR) */}
                                    <td className="p-6 md:pl-10">
                                        <div className="flex items-center gap-5">

                                            {/* COMPONENTE DE AVATAR NA LISTA */}
                                            {membro.avatar_file ? (
                                                // Exibe a foto se ela existir (otimizada com Next Image)
                                                <Image
                                                    src={membro.avatar_file}
                                                    alt={`Foto de ${membro.first_name}`}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-soft group-hover:border-figueira transition-all"
                                                />
                                            ) : (
                                                // Iniciais se não houver foto (layout igual ao Portal do Membro)
                                                <div className="w-12 h-12 rounded-full bg-figueira/10 flex items-center justify-center text-figueira font-black text-base border-2 border-soft group-hover:border-figueira/20 transition-all">
                                                    {membro.first_name[0]}{membro.last_name[0]}
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-bold text-fg leading-tight">
                                                    {membro.first_name} {membro.last_name}
                                                </p>
                                                <p className="text-[10px] text-muted font-bold uppercase tracking-tight">
                                                    ID #{membro.id} — {membro.gender}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* COLUNA CONTACTO */}
                                    <td className="p-6">
                                        <p className="text-sm font-semibold text-fg">{membro.phone_1}</p>
                                        <p className="text-xs text-muted truncate">{membro.email}</p>
                                    </td>

                                    {/* COLUNA BATISMO (Com Badge Visual) */}
                                    <td className="p-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-soft/50 rounded-full border border-soft/50">
                                            <span className={`w-2 h-2 rounded-full ${membro.baptism_status === 'Batizado' ? 'bg-green-500' : (membro.baptism_status === 'Não Batizado' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                                            <span className="text-xs font-bold text-fg">{membro.baptism_status}</span>
                                        </div>
                                    </td>

                                    {/* COLUNA CIDADE */}
                                    <td className="p-6 text-sm font-semibold text-muted">
                                        {membro.id_city || '---'}
                                    </td>

                                    {/* COLUNA DATA CADASTRO */}
                                    <td className="p-6 text-sm font-medium text-muted">
                                        {new Date(membro.created_at).toLocaleDateString('pt-PT')}
                                    </td>

                                    {/* COLUNA AÇÕES */}
                                    <td className="p-6 text-right md:pr-10">
                                        <div className="flex items-center justify-end gap-2">

                                            {/* BOTÃO DE EDIÇÃO COMPLETA (O NOVO BOTÃO) */}
                                            <Link
                                                href={`/admin/membros/editar/${membro.id}`}
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-figueira text-white hover:bg-fg transition-all shadow-lg shadow-figueira/20"
                                                title="Editar Ficha e Associações"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>

                                            {/* BOTÃO DE VISUALIZAÇÃO (O QUE JÁ EXISTIA) */}
                                            <Link
                                                //href={`/admin/membros/cadastro/confirmacao?id=${membro.id}`}
                                                href={`/admin/membros/visualizar/${membro.id}`}
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-soft text-muted hover:text-figueira hover:border-figueira hover:bg-figueira/5 transition-all"
                                                title="Ver Ficha Completa"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {membros.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center space-y-4">
                                        <p className="text-xl font-bold text-muted italic">Ainda não há membros registados no sistema ADMVC.</p>
                                        <Link href="/admin/membros/cadastro" className="bg-figueira/10 text-figueira px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-figueira/20 transition-all">
                                            Fazer o primeiro cadastro agora
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}