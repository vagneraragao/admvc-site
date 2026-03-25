// actions/admin-actions.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { put } from "@vercel/blob";
import { Role } from "@prisma/client";
import { cookies } from 'next/headers'

export async function aprovarMembro(membroId: number, adminNome: string) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: {
                status: "ATIVO",
                data_admissao: new Date(),
                aprovado_por: adminNome
            }
        });

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/membros');
        return { sucesso: true };
    } catch (error) {
        return { erro: "Falha ao aprovar membro." };
    }
}

export async function removerMembroDepartamento(id: number) {
    await prisma.integranteDepartamento.delete({ where: { id } });
    revalidatePath("/admin/departamentos/gerenciar");
}

export async function buscarMembrosPorDepartamento(deptoId: number) {
    try {
        const integrantes = await prisma.integranteDepartamento.findMany({
            where: { departamento_id: deptoId },
            include: {
                membro: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    }
                }
            }
        });

        // Formatamos para facilitar o uso no Select
        return integrantes.map(i => ({
            id: i.membro.id,
            nome: `${i.membro.first_name} ${i.membro.last_name}`,
            funcaoPadrao: i.funcao
        }));
    } catch (error) {
        return [];
    }
}

export async function vincularMembroDepartamento(formData: FormData) {
    try {
        const membro_id = Number(formData.get("membro_id"));
        const departamento_id = Number(formData.get("departamento_id"));
        const funcao = formData.get("funcao") as string;

        // 1. Verifica se essa pessoa já tem EXATAMENTE essa função nesse depto
        const jaExiste = await prisma.integranteDepartamento.findFirst({
            where: {
                membro_id,
                departamento_id,
                funcao
            }
        });

        if (jaExiste) {
            return { ok: false, error: "Este membro já possui esta função neste setor." };
        }

        // 2. Cria um novo registro (vínculo)
        await prisma.integranteDepartamento.create({
            data: {
                membro_id,
                departamento_id,
                funcao,
            },
        });

        revalidatePath("/admin/configuracoes");
        return { ok: true };
    } catch (error) {
        console.error(error);
        return { ok: false, error: "Erro ao vincular membro." };
    }
}

export async function criarNovoMembroAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Verificação de e-mail duplicado
    const existe = await prisma.membro.findUnique({ where: { email } });
    if (existe) return { error: "Este e-mail já está registado em outro membro." };

    // 2. Hash da password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Helper para converter as strings de data do formulário em Objetos Date do JS
    const parseDate = (dateString: any) => {
        if (!dateString || dateString === "") return null;
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? null : d;
    };

    try {
        await prisma.membro.create({
            data: {
                // --- DADOS PESSOAIS ---
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                email: email,
                password: hashedPassword,
                phone_1: formData.get("phone_1") as string,
                gender: formData.get("gender") as string,
                marital_status: formData.get("marital_status") as string,
                birthdate: parseDate(formData.get("birthdate")),

                // --- CAMPOS QUE VOCÊ ADICIONOU ---
                profession: formData.get("profession") as string,
                father_name: formData.get("father_name") as string,
                mother_name: formData.get("mother_name") as string,

                // --- ENDEREÇO (PORTUGAL) ---
                address_1: formData.get("address_1") as string,
                address_number: formData.get("address_number") as string,
                postal_code: formData.get("postal_code") as string,
                state: formData.get("neighborhood") as string, // Usado para Distrito
                id_city: formData.get("city") as string,
                country: (formData.get("country") as string) || "Portugal",

                // --- ECLESIÁSTICO & ACESSO ---
                role: (formData.get("role") as Role) || Role.USER,
                status: (formData.get("status") as string) || "ATIVO",
                loyverse_id: formData.get("loyverse_id") as string,
                church_role: formData.get("church_role") as string,
                baptism_date: parseDate(formData.get("baptism_date")),
                data_admissao: parseDate(formData.get("admission_date")),
                notes: formData.get("notes") as string,

                // --- FAMÍLIA ---
                spouse_name: formData.get("spouse_name") as string,
                children_number: Number(formData.get("children_count")) || 0,

                is_active: true,
            }
        });
    } catch (error: any) {
        console.error("ERRO NO PRISMA:", error);

        // Se der erro de duplicidade (P2002), avisamos o user
        if (error.code === 'P2002') {
            return { error: "Erro: O E-mail ou o ID Loyverse já existem no sistema." };
        }

        return { error: "Não foi possível salvar o membro. Verifique os dados." };
    }

    // 4. Sucesso: Limpar cache e voltar para a lista
    revalidatePath("/admin/membros");
    redirect("/admin/membros");
}

export async function criarDepartamento(formData: FormData) {


    const nome = formData.get('nome') as string;
    if (!nome) return;

    await prisma.departamento.create({ data: { nome } });
    revalidatePath('/admin/configuracoes');

}

export async function excluirDepartamento(id: number) {
    // Nota: Verifique se existem membros vinculados antes de excluir ou trate o erro
    await prisma.departamento.delete({ where: { id } });
    revalidatePath('/admin/configuracoes');
}

export async function criarCargo(formData: FormData) {
    const nome = formData.get('nome') as string;
    if (!nome) return;
    await prisma.cargo.create({ data: { nome } });
    revalidatePath('/admin/configuracoes');
}

export async function buscarCargos() {
    try {
        const cargos = await prisma.cargo.findMany({
            orderBy: { nome: 'asc' }
        });
        return cargos;
    } catch (error) {
        console.error("Erro ao buscar cargos:", error);
        return [];
    }
}

export async function excluirCargo(id: number) {
    await prisma.cargo.delete({ where: { id } });
    revalidatePath('/admin/configuracoes');
}

export async function criarGrupo(formData: FormData) {
    const departamento_id = formData.get('departamento_id');
    const data_abertura = formData.get('data_abertura') as string;
    const lideresIds = formData.getAll('lideres_ids').map(Number);
    const membrosIds = formData.getAll('membros_ids').map(Number);

    await prisma.grupo.create({
        data: {
            nome: formData.get('nome') as string,
            dia_semana: formData.get('dia_semana') as string,
            horario: formData.get('horario') as string,
            perfil: formData.get('perfil') as string,
            categoria: formData.get('categoria') as string,
            descricao: formData.get('descricao') as string,
            endereco: formData.get('endereco') as string,
            numero: formData.get('numero') as string,
            bairro: formData.get('bairro') as string,
            cidade: formData.get('cidade') as string,
            lideres: {
                // Se a lista de líderes vier vazia, enviamos um array vazio para o connect
                connect: lideresIds.map((id: number) => ({ id }))
            },
            membros: {
                connect: membrosIds.map((id: number) => ({ id }))
            },
            estado: formData.get('estado') as string,
            pais: (formData.get('pais') as string) || "Portugal",
            data_abertura: data_abertura ? new Date(data_abertura) : new Date(),
            departamento_id: departamento_id ? Number(departamento_id) : null,
        }
    });

    revalidatePath('/admin/configuracoes');
}

export async function excluirGrupo(id: number) {
    try {
        await prisma.grupo.delete({
            where: { id: id }
        });
        revalidatePath("/admin/configuracoes"); // Força o Next.js a atualizar a lista na tela
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao excluir grupo:", error);
        return { sucesso: false };
    }
}

export async function vincularMembrosAoGrupo(grupoId: number, membrosIds: number[], lideresIds: number[]) {
    try {
        await prisma.grupo.update({
            where: { id: grupoId },
            data: {
                // O operador 'set' limpa os antigos e adiciona os novos IDs enviados
                membros: {
                    set: membrosIds.map(id => ({ id }))
                },
                lideres: {
                    set: lideresIds.map(id => ({ id }))
                }
            }
        });

        revalidatePath("/admin/configuracoes");
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao vincular membros:", error);
        return { sucesso: false };
    }
}

export async function salvarEvento(formData: FormData) {
    try {
        const id = formData.get("id") as string | null;
        const nome = formData.get("nome") as string;
        const dataStr = formData.get("data") as string; // Formato YYYY-MM-DDTHH:mm
        const descricao = formData.get("descricao") as string;

        const dados = {
            nome,
            data: new Date(dataStr),
            descricao,
        };

        if (id) {
            await prisma.evento.update({
                where: { id: Number(id) },
                data: dados,
            });
        } else {
            await prisma.evento.create({
                data: dados,
            });
        }

        revalidatePath("/admin/escalas"); // Ou a rota onde os eventos aparecem
        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        return { sucesso: false };
    }
}

export async function removerEscala(id: number) {
    try {
        await prisma.escala.delete({ where: { id } });
        revalidatePath("/admin/escalas");
        return { sucesso: true };
    } catch (error) {
        return { sucesso: false };
    }
}

export async function gerarLinkWhatsapp(escalaId: number) {
    const escala = await prisma.escala.findUnique({
        where: { id: escalaId },
        include: {
            membro: true,
            evento: true,
            departamento: true
        }
    });

    if (!escala || !escala.membro.phone_1) return null;

    const dataFormatada = new Date(escala.evento.data).toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    });

    const horaFormatada = new Date(escala.evento.data).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Mensagem Personalizada e "Premium"
    const mensagem = `Olá, *${escala.membro.first_name}*! 👋%0A%0A` +
        `Passamos para lembrar que você está escalado para servir na *ADMVC*:%0A%0A` +
        `📅 *Data:* ${dataFormatada}%0A` +
        `⏰ *Hora:* ${horaFormatada}%0A` +
        `📍 *Local:* Auditório Principal%0A` +
        `🎸 *Departamento:* ${escala.departamento.nome}%0A` +
        `💪 *Função:* ${escala.funcao}%0A%0A` +
        `Poderia confirmar sua presença no nosso portal?%0A` +
        `🔗 https://seusite.com/membros`;

    // Limpar o número de telefone (remover espaços e parênteses)
    const telefone = escala.membro.phone_1.replace(/\D/g, '');

    return `https://wa.me/${telefone}?text=${mensagem}`;
}

export async function salvarGrupo(formData: FormData) {
    try {
        const id = formData.get("id") ? Number(formData.get("id")) : null;

        // Captura arrays de IDs dos checkboxes
        const lideresIds = formData.getAll("lideres_ids").map(Number);
        const membrosIds = formData.getAll("membros_ids").map(Number);

        const data: any = {
            nome: formData.get("nome") as string,
            categoria: formData.get("categoria") as string,
            dia_semana: formData.get("dia_semana") as string,
            horario: formData.get("horario") as string,
            perfil: formData.get("perfil") as string,
            endereco: formData.get("endereco") as string,
            numero: formData.get("numero") as string,
            bairro: formData.get("bairro") as string,
            cidade: formData.get("cidade") as string,
            estado: formData.get("estado") as string,
            pais: formData.get("pais") as string,
            descricao: formData.get("descricao") as string,
            departamento_id: formData.get("departamento_id") ? Number(formData.get("departamento_id")) : null,

            // Gestão de Relações N-N (Líderes e Membros)
            // O 'set' limpa os antigos e adiciona os novos IDs enviados para o UPDATE
            lideres: {
                set: lideresIds.map(id => ({ id }))
            },
            membros: {
                set: membrosIds.map(id => ({ id }))
            }
        };

        if (id) {
            // ATUALIZAR
            await prisma.grupo.update({
                where: { id },
                data: data
            });
        } else {
            // CRIAR NOVO (Não podemos usar 'set' no create)
            const createData = {
                ...data,
                lideres: { connect: lideresIds.map(id => ({ id })) },
                membros: { connect: membrosIds.map(id => ({ id })) }
            };

            await prisma.grupo.create({
                data: createData
            });
        }

        revalidatePath('/admin/configuracoes');
        return { sucesso: true };
    } catch (error: any) {
        console.error("Erro ao salvar grupo:", error);
        return { sucesso: false, erro: error.message };
    }
}

export async function salvarEscala(formData: FormData) {
    try {
        const membro_id = Number(formData.get("membro_id"));
        const evento_id = Number(formData.get("evento_id"));
        const departamento_id = Number(formData.get("departamento_id"));
        const funcao = formData.get("funcao") as string;

        await prisma.escala.create({
            data: {
                membro_id,
                evento_id,
                departamento_id,
                funcao
            }
        });

        revalidatePath('/admin/escalas'); // Ajuste o caminho se for diferente
        return { ok: true }; // IMPORTANTE: Retornar o 'ok' aqui!

    } catch (error) {
        console.error(error);
        return { ok: false, error: "Erro ao salvar" };
    }
}

export async function adicionarFuncaoAoDepartamento(formData: FormData) {
    const nome = formData.get("nome") as string;
    const departamento_id = Number(formData.get("departamento_id"));

    await prisma.funcaoDepartamento.create({
        data: { nome, departamento_id }
    });
    revalidatePath("/admin/configuracoes");
}

export async function removerFuncaoDoDepartamento(id: number) {
    await prisma.funcaoDepartamento.delete({ where: { id } });
    revalidatePath("/admin/configuracoes");
}

export async function atualizarDepartamento(formData: FormData) {
    try {
        const id = Number(formData.get("id"));
        const nome = formData.get("nome") as string;
        const descricao = formData.get("descricao") as string;

        // Se o valor for vazio (string vazia), salvamos como null
        const liderInput = formData.get("lider_id");
        const lider_id = liderInput ? Number(liderInput) : null;

        await prisma.departamento.update({
            where: { id },
            data: {
                nome,
                descricao,
                lider_id: lider_id === 0 ? null : lider_id // Garante que o 0 do option vazio vire null
            }
        });

        revalidatePath("/admin/configuracoes");
        return { ok: true };
    } catch (error) {
        console.error(error);
        return { ok: false };
    }
}

export async function adicionarFuncaoAoDepto(formData: FormData) {
    const nome = formData.get("nome") as string;
    const departamento_id = Number(formData.get("departamento_id"));

    await prisma.funcaoDepartamento.create({
        data: { nome, departamento_id }
    });

    revalidatePath("/admin/configuracoes");
}

export async function removerFuncaoDoDepto(id: number) {
    await prisma.funcaoDepartamento.delete({ where: { id } });
    revalidatePath("/admin/configuracoes");
    return { ok: true };
}

export async function gerarEventosLote(formData: FormData) {
    const nome = formData.get('nome') as string;
    const diaDaSemana = Number(formData.get('diaDaSemana')); // 0 = Domingo, 6 = Sábado
    const mesesDuracao = Number(formData.get('meses')); // Ex: 3 meses

    const hoje = new Date();
    const dataFim = new Date();
    dataFim.setMonth(hoje.getMonth() + mesesDuracao);

    const eventosParaCriar = [];
    let dataAtual = new Date(hoje);

    // Encontra o próximo dia da semana correspondente
    while (dataAtual.getDay() !== diaDaSemana) {
        dataAtual.setDate(dataAtual.getDate() + 1);
    }

    // Loop até atingir a data limite
    while (dataAtual <= dataFim) {
        eventosParaCriar.push({
            nome: nome,
            data: new Date(dataAtual), // Salva a data exata
            // horario, local, etc...
        });
        // Avança 7 dias para o próximo evento
        dataAtual.setDate(dataAtual.getDate() + 7);
    }

    // Cria tudo de uma vez no banco de dados!
    await prisma.evento.createMany({
        data: eventosParaCriar
    });
}

export async function gerarEventosLoteAction(formData: FormData) {
    try {
        const nome = formData.get('nome') as string;
        const diaDaSemana = Number(formData.get('diaDaSemana')); // 0=Dom, 1=Seg...
        const frequencia = formData.get('frequencia') as string; // 'TODAS', '1', '2', '3', '4', 'ULTIMO'
        const horario = formData.get('horario') as string;
        const mesesDuracao = Number(formData.get('meses'));

        const hoje = new Date();
        const dataFim = new Date();
        dataFim.setMonth(hoje.getMonth() + mesesDuracao);

        const eventosParaCriar = [];
        let dataAtual = new Date(hoje);

        // Aplica o horário base à data de pesquisa
        const [horas, minutos] = horario.split(':');
        dataAtual.setHours(Number(horas), Number(minutos), 0, 0);

        // Percorre os dias até ao limite estabelecido
        while (dataAtual <= dataFim) {

            // Se o dia da semana bater com o pretendido (ex: Domingo)
            if (dataAtual.getDay() === diaDaSemana) {
                let isMatch = false;
                const diaDoMes = dataAtual.getDate();
                const semanaDoMes = Math.ceil(diaDoMes / 7); // Diz-nos se é o 1º, 2º, 3º...

                if (frequencia === 'TODAS') {
                    isMatch = true;
                } else if (frequencia === 'ULTIMO') {
                    // Verifica se ao somar 7 dias muda de mês. Se mudar, este é o último!
                    const proximaSemana = new Date(dataAtual);
                    proximaSemana.setDate(diaDoMes + 7);
                    if (proximaSemana.getMonth() !== dataAtual.getMonth()) {
                        isMatch = true;
                    }
                } else if (frequencia === semanaDoMes.toString()) {
                    isMatch = true;
                }

                if (isMatch) {
                    eventosParaCriar.push({
                        nome: nome,
                        data: new Date(dataAtual)
                    });
                }
            }

            // Avança para o dia seguinte
            dataAtual.setDate(dataAtual.getDate() + 1);
        }

        await prisma.evento.createMany({
            data: eventosParaCriar
        });

        revalidatePath('/admin/escalas');

        return { ok: true, totalCriado: eventosParaCriar.length };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function criarEventoUnificadoAction(formData: FormData) {
    try {
        const tipo = formData.get('tipo') as string; // 'UNICO' ou 'CONTINUO'
        const nome = formData.get('nome') as string;
        const horario = formData.get('horario') as string;
        const [horas, minutos] = horario.split(':');

        // ==========================================
        // CENÁRIO 1: EVENTO ÚNICO
        // ==========================================
        if (tipo === 'UNICO') {
            const dataString = formData.get('dataUnica') as string;
            const dataEvento = new Date(dataString);
            dataEvento.setHours(Number(horas), Number(minutos), 0, 0);

            await prisma.evento.create({
                data: {
                    nome: nome,
                    data: dataEvento
                }
            });

            revalidatePath('/admin/escalas');
            return { ok: true, totalCriado: 1 };
        }

        // ==========================================
        // CENÁRIO 2: EVENTOS CONTÍNUOS (LOTE)
        // ==========================================
        if (tipo === 'CONTINUO') {
            const diaDaSemana = Number(formData.get('diaDaSemana'));
            const frequencia = formData.get('frequencia') as string;
            const mesesDuracao = Number(formData.get('meses'));

            const hoje = new Date();
            const dataFim = new Date();
            dataFim.setMonth(hoje.getMonth() + mesesDuracao);

            const eventosParaCriar = [];
            let dataAtual = new Date(hoje);
            dataAtual.setHours(Number(horas), Number(minutos), 0, 0);

            while (dataAtual <= dataFim) {
                if (dataAtual.getDay() === diaDaSemana) {
                    let isMatch = false;
                    const diaDoMes = dataAtual.getDate();
                    const semanaDoMes = Math.ceil(diaDoMes / 7);

                    if (frequencia === 'TODAS') {
                        isMatch = true;
                    } else if (frequencia === 'ULTIMO') {
                        const proximaSemana = new Date(dataAtual);
                        proximaSemana.setDate(diaDoMes + 7);
                        if (proximaSemana.getMonth() !== dataAtual.getMonth()) isMatch = true;
                    } else if (frequencia === semanaDoMes.toString()) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        eventosParaCriar.push({ nome: nome, data: new Date(dataAtual) });
                    }
                }
                dataAtual.setDate(dataAtual.getDate() + 1);
            }

            await prisma.evento.createMany({
                data: eventosParaCriar
            });

            revalidatePath('/admin/escalas');
            return { ok: true, totalCriado: eventosParaCriar.length };
        }

        return { ok: false, error: "Tipo de evento inválido." };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function apagarEventoAction(eventoId: number) {
    try {
        // 1. Limpa todas as escalas (voluntários) associadas a este evento primeiro
        await prisma.escala.deleteMany({
            where: { evento_id: eventoId }
        });

        // 2. Apaga o evento
        await prisma.evento.delete({
            where: { id: eventoId }
        });

        revalidatePath('/admin/escalas');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: "Erro ao apagar evento. Tente novamente." };
    }
}

export async function criarEscala(formData: FormData) {
    try {
        const evento_id = Number(formData.get('evento_id'));
        const departamento_id = Number(formData.get('departamento_id'));
        const membro_id = Number(formData.get('membro_id'));
        const funcao = formData.get('funcao') as string;
        const horario = formData.get('horario') as string;

        // ========================================================
        // 🛡️ BARREIRA DE SEGURANÇA: Verificar se já está escalado
        // ========================================================
        const escalaExistente = await prisma.escala.findFirst({
            where: {
                evento_id: evento_id,
                membro_id: membro_id
            }
        });

        if (escalaExistente) {
            // Se já existir, bloqueamos e devolvemos o erro!
            return {
                ok: false,
                error: "⚠️ Este voluntário já está escalado para este evento!"
            };
        }
        // ========================================================

        // Se passar na barreira, criamos a escala normalmente:
        await prisma.escala.create({
            data: {
                evento_id,
                departamento_id,
                membro_id,
                funcao,
                horario
            }
        });

        revalidatePath('/admin/escalas');
        return { ok: true };

    } catch (error: any) {
        return { ok: false, error: "Erro interno ao criar escala." };
    }
}

export async function atualizarMembroAdmin(id: number, formData: FormData) {
    try {
        const membroId = Number(id);
        console.log(`\n=============================================`);
        console.log(`🔎 [DEBUG EDIÇÃO] A atualizar Membro ID: ${membroId}`);

        // 1. Extração e conversão de dados básicos
        const deptoIds = formData.getAll('deptos').map(id => Number(id));
        const grupoIds = formData.getAll('grupos').map(id => Number(id));

        // Se vier vazio, transforma em null
        const escolaridadeRaw = formData.get('escolaridade_id');
        const escolaridade_id = escolaridadeRaw ? Number(escolaridadeRaw) : null;

        // Tratamento de Datas
        const conversion_date = formData.get('conversion_date') ? new Date(formData.get('conversion_date') as string) : null;
        const entry_date = formData.get('entry_date') ? new Date(formData.get('entry_date') as string) : null;
        const baptism_date = formData.get('baptism_date') ? new Date(formData.get('baptism_date') as string) : null;
        const birthdate = formData.get('birthdate') ? new Date(formData.get('birthdate') as string) : null;

        // Tratamento do Checkbox de Acesso
        const isActiveMarcado = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

        // Tratamento do Loyverse (Prevenção do erro de duplicação P2002)
        const loyverseIdRaw = formData.get('loyverse_id') as string;
        const loyverseIdTratado = loyverseIdRaw && loyverseIdRaw.trim() !== '' ? loyverseIdRaw.trim() : null;

        // 🛡️ A LISTA COMPLETA DE CAMPOS A ATUALIZAR
        const dataToUpdate: any = {
            // Pessoal
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: (formData.get('email') as string).toLowerCase().trim(),
            phone_1: formData.get('phone_1') as string,
            birthdate: birthdate,
            gender: formData.get('gender') as string,
            profession: formData.get('profession') as string,
            father_name: formData.get('father_name') as string,
            mother_name: formData.get('mother_name') as string,

            // Relação Oficial do Prisma para Escolaridade
            escolaridade: escolaridade_id
                ? { connect: { id: escolaridade_id } }
                : { disconnect: true },

            conversion_date: conversion_date,

            // Endereço
            postal_code: formData.get('postal_code') as string,
            address_1: formData.get('address_1') as string,
            address_number: formData.get('address_number') as string,
            //neighborhood: formData.get('neighborhood') as string,
            id_city: formData.get('id_city') as string,
            country: formData.get('country') as string || 'Portugal',

            // Eclesiástico e Acesso
            is_active: isActiveMarcado,
            role: formData.get('role') as any,
            loyverse_id: loyverseIdTratado,
            entry_date: entry_date,
            baptism_date: baptism_date,
            church_role: formData.get('church_role') as string,
            status: formData.get('status') as string,

            // Família
            spouse_name: formData.get('spouse_name') as string,
            children_number: parseInt(formData.get('children_number') as string || "0"),

            // Grupos N-N
            grupos: { set: grupoIds.map(gid => ({ id: gid })) }
        };

        // Lógica da senha
        const novaSenha = formData.get('nova_senha') as string;
        if (novaSenha && novaSenha.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(novaSenha.trim(), 10);
            console.log(`🔐 Nova senha encriptada com sucesso.`);
        }

        // Executa o update principal
        await prisma.membro.update({
            where: { id: membroId },
            data: dataToUpdate
        });

        // Atualização de departamentos (Limpa os antigos e recria)
        await prisma.integranteDepartamento.deleteMany({
            where: { membro_id: membroId }
        });

        if (deptoIds.length > 0) {
            await prisma.integranteDepartamento.createMany({
                data: deptoIds.map(dId => ({
                    membro_id: membroId,
                    departamento_id: dId,
                    funcao: "Membro"
                }))
            });
        }

        console.log(`💾 Membro gravado com sucesso! (Incluindo Loyverse e Escolaridade)`);
        console.log(`=============================================\n`);

        revalidatePath('/admin/membros');
        revalidatePath(`/admin/membros/editar/${id}`);
        return { ok: true };

    } catch (error: any) {
        console.error("❌ ERRO NO PRISMA:", error);

        // Tratamento de erros amigável (Impede a aplicação de rebentar)
        if (error.code === 'P2002') {
            const target = error.meta?.target?.[0] || 'campo';
            if (target === 'loyverse_id') {
                return { ok: false, error: "Erro: Este ID do Loyverse já está atribuído a outro membro!" };
            }
            if (target === 'email') {
                return { ok: false, error: "Erro: Este E-mail já está a ser utilizado por outro membro!" };
            }
            return { ok: false, error: `Erro de duplicação: Já existe um registo com este ${target}.` };
        }

        return { ok: false, error: "Ocorreu um erro ao guardar. Verifique os dados e tente novamente." };
    }
}

export async function associarMembroAFamilia(membroId: number, familiaId: number, parentesco: string) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: {
                familia_id: familiaId,
                parentesco: parentesco
            }
        });
        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Falha ao associar membro." };
    }
}

export async function editarEventoAction(formData: FormData) {
    try {
        const id = formData.get('id') as string;
        const nome = formData.get('nome') as string;
        const dataStr = formData.get('data') as string; // YYYY-MM-DD
        const horaStr = formData.get('horario') as string; // HH:MM

        if (!id || !nome || !dataStr || !horaStr) {
            return { ok: false, error: "Preencha todos os campos obrigatórios." };
        }

        // Fundir a data e a hora no formato ISO que o Prisma exige
        const dataCompleta = new Date(`${dataStr}T${horaStr}:00`);

        await prisma.evento.update({
            where: { id: Number(id) },
            data: {
                nome,
                data: dataCompleta,
            }
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/escalas');
        revalidatePath('/membros/dashboard');

        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao editar evento:", error);
        return { ok: false, error: "Erro ao atualizar o evento na base de dados." };
    }
}