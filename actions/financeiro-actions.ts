'use server'

//import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSessionData } from '@/lib/auth-utils'
import prismaGlobal, { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";




async function getDb() {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');
    if (!tenantId) throw new Error("Sessão inválida. Igreja não identificada.");
    return getTenantClient(Number(tenantId));
}

export async function criarCampanhaEmLoteAction(formData: FormData, membrosIds: number[]) {
    try {
        if (membrosIds.length === 0) {
            return { ok: false, error: 'Selecione pelo menos um membro.' };
        }

        const nome = formData.get('nome') as string;
        const valor_mensal = parseFloat(formData.get('valor_mensal') as string);
        const parcelas_total = parseInt(formData.get('parcelas_total') as string);
        const data_pagamento = parseInt(formData.get('data_pagamento') as string);

        const primeiroMembro = await prisma.membro.findUnique({
            where: { id: membrosIds[0] },
            select: { tenant_id: true }
        });

        if (!primeiroMembro) {
            return { ok: false, error: 'Membro inválido ou não encontrado.' };
        }

        // Cria o objetivo para CADA membro selecionado
        const dadosParaInserir = membrosIds.map(id => ({
            tenant_id: primeiroMembro.tenant_id,
            nome,
            valor_mensal,
            parcelas_total,
            data_pagamento,
            membro_id: id,
            status: "ATIVO"
        }));

        await prisma.objetivoFinanceiro.createMany({
            data: dadosParaInserir
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao criar campanha:", error);
        return { ok: false, error: 'Erro ao gerar os carnês.' };
    }
}


export async function venderNumeroRifaAction(formData: FormData) {
    try {
        const rifa_id = parseInt(formData.get('rifa_id') as string);
        const numero = parseInt(formData.get('numero') as string);
        const membro_id_str = formData.get('membro_id') as string;
        const nome_externo = formData.get('nome_externo') as string;

        const membro_id = membro_id_str ? parseInt(membro_id_str) : null;

        // 1. Verifica se o número já foi vendido por segurança
        const jaVendido = await prisma.rifaNumero.findUnique({
            where: { rifa_id_numero: { rifa_id, numero } }
        });

        if (jaVendido) {
            return { ok: false, error: 'Este número acabou de ser vendido!' };
        }

        const rifa = await prisma.rifa.findUnique({
            where: { id: rifa_id },
            select: { tenant_id: true }
        });

        if (!rifa) {
            return { ok: false, error: 'Rifa não encontrada.' };
        }

        // 2. Regista a venda do número
        await prisma.rifaNumero.create({
            data: {
                tenant_id: rifa.tenant_id,
                rifa_id,
                numero,
                membro_id,
                nome_externo: nome_externo || null,
                pago: true
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao vender número:", error);
        return { ok: false, error: 'Erro ao processar a venda do número.' };
    }
}

export async function criarRifaAction(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada.' };

        const membroLogado = await prisma.membro.findUnique({
            where: { id: session.membroId },
            select: { tenant_id: true }
        });

        if (!membroLogado) return { ok: false, error: 'Utilizador não encontrado.' };

        const nome = formData.get('nome') as string;
        const premio = formData.get('premio') as string;
        const valor_numero = parseFloat(formData.get('valor_numero') as string);
        const total_numeros = parseInt(formData.get('total_numeros') as string);

        // Cria a rifa vazia, pronta a ser vendida
        await prisma.rifa.create({
            data: {
                tenant_id: membroLogado.tenant_id,
                nome,
                premio,
                valor_numero,
                total_numeros,
                status: 'ATIVA'
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao criar rifa:", error);
        return { ok: false, error: 'Erro ao gerar a grelha da rifa.' };
    }
}

export async function atualizarCompradorRifaAction(formData: FormData) {
    try {
        const venda_id = parseInt(formData.get('venda_id') as string);
        const membro_id_str = formData.get('membro_id') as string;
        const nome_externo = formData.get('nome_externo') as string;

        const membro_id = membro_id_str ? parseInt(membro_id_str) : null;

        await prisma.rifaNumero.update({
            where: { id: venda_id },
            data: {
                membro_id,
                nome_externo: nome_externo || null,
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao atualizar comprador:", error);
        return { ok: false, error: 'Erro ao corrigir o dono do número.' };
    }
}

export async function venderNumerosRifaLoteAction(formData: FormData) {
    try {
        const rifa_id = parseInt(formData.get('rifa_id') as string);
        const numerosStr = formData.get('numeros') as string;
        const numeros = JSON.parse(numerosStr) as number[]; // Transforma o texto de volta num Array

        const membro_id_str = formData.get('membro_id') as string;
        const nome_externo = formData.get('nome_externo') as string;

        const membro_id = membro_id_str ? parseInt(membro_id_str) : null;

        if (!numeros || numeros.length === 0) {
            return { ok: false, error: 'Nenhum número selecionado.' };
        }

        // 1. Verificação de segurança: Alguém já comprou algum destes?
        const jaVendidos = await prisma.rifaNumero.findMany({
            where: { rifa_id, numero: { in: numeros } }
        });

        if (jaVendidos.length > 0) {
            const numVendidos = jaVendidos.map(v => v.numero).join(', ');
            return { ok: false, error: `Os números ${numVendidos} já foram vendidos entretanto!` };
        }

        const rifa = await prisma.rifa.findUnique({
            where: { id: rifa_id },
            select: { tenant_id: true }
        });

        if (!rifa) {
            return { ok: false, error: 'Rifa não encontrada.' };
        }

        // 2. Prepara os dados para inserir todos de uma vez
        const dadosParaInserir = numeros.map(num => ({
            tenant_id: rifa.tenant_id,
            rifa_id,
            numero: num,
            membro_id,
            nome_externo: nome_externo || null,
            pago: true
        }));

        // 3. Regista a venda em lote
        await prisma.rifaNumero.createMany({
            data: dadosParaInserir
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao vender números em lote:", error);
        return { ok: false, error: 'Erro ao processar a venda múltipla.' };
    }
}

export async function finalizarRifaAction(rifaId: number) {
    try {
        await prisma.rifa.update({
            where: { id: rifaId },
            data: { status: 'FINALIZADA' }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao finalizar rifa:", error);
        return { ok: false, error: 'Erro ao tentar encerrar a rifa.' };
    }
}

export async function solicitarSaldoCantinaAction(formData: FormData) {
    console.log(`\n======================================================`);
    console.log(`📝 [CANTINA] NOVO PEDIDO DE CARREGAMENTO RECEBIDO`);
    console.log(`⏰ Data/Hora: ${new Date().toISOString()}`);

    try {
        const membroId = Number(formData.get('membro_id'));
        const valorCru = String(formData.get('valor'));
        const formaPagamento = formData.get('forma_pagamento') as string;

        console.log(`👤 ID do Membro: ${membroId}`);
        console.log(`💳 Método de Pagamento: ${formaPagamento}`);
        console.log(`💶 Valor Original Digitado: "${valorCru}"`);

        // 1. TRUQUE DA VÍRGULA: Substitui vírgulas por pontos (Ex: 17,50 vira 17.50)
        const valorTratado = valorCru.replace(',', '.');
        const valor = Number(valorTratado);
        console.log(`💶 Valor Convertido P/ Sistema: €${valor}`);

        // Validação de segurança
        if (!membroId || !valor || isNaN(valor) || valor <= 0) {
            console.error(`❌ [ERRO] Valor inválido ou ID do membro em falta.`);
            console.log(`======================================================\n`);
            return { ok: false, error: "Valor inválido. Por favor, verifique o montante." };
        }

        const membroObj = await prisma.membro.findUnique({
            where: { id: membroId },
            select: { tenant_id: true }
        });

        if (!membroObj) {
            console.error(`❌ [ERRO] Membro não encontrado no sistema.`);
            console.log(`======================================================\n`);
            return { ok: false, error: "Membro não encontrado." };
        }

        // 2. GRAVAR COMO PENDENTE
        console.log(`💾 [PRISMA] A gravar o pedido na base de dados (Status: PENDENTE)...`);
        const novoPedido = await prisma.pedidoSaldoCantina.create({
            data: {
                tenant_id: membroObj.tenant_id,
                membro_id: membroId,
                valor: valor,
                forma_pagamento: formaPagamento,
                status: 'PENDENTE' // Garante que vai para o alerta laranja do tesoureiro
            }
        });

        console.log(`✅ [SUCESSO] Pedido #${novoPedido.id} registado no sistema!`);

        // 3. O SEGREDO DO CACHE: Mandar o Next.js atualizar as DUAS dashboards!
        console.log(`🔄 [CACHE] A limpar cache das dashboards do Membro e Tesoureiro...`);
        revalidatePath('/membros/dashboard');
        revalidatePath('/departamentos/financeiro/dashboard');

        console.log(`======================================================\n`);
        return { ok: true };
    } catch (error: any) {
        console.error(`🚨 [FALHA CRÍTICA AO SOLICITAR SALDO]`, error);
        console.log(`======================================================\n`);
        return { ok: false, error: "Erro interno ao processar o pedido." };
    }
}

export async function aprovarSaldoCantinaAction(pedidoId: number, loyverseId: string | null, valor: number) {
    console.log(`\n======================================================`);
    console.log(`[FINANCEIRO] INICIANDO APROVAÇÃO DE SALDO`);
    console.log(`-> Pedido ID: ${pedidoId}`);
    console.log(`-> Valor a carregar: €${valor}`);

    try {
        if (!loyverseId || loyverseId.trim() === '' || loyverseId === 'null') {
            console.error(`[ERRO CRÍTICO] O loyverseId está vazio ou nulo!`);
            throw new Error("O membro não tem um ID do Loyverse associado.");
        }

        const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;

        // ====================================================================
        // 1. OBTER STORE, PAYMENT E ITEM (Para gerar o recibo)
        // ====================================================================
        console.log(`[LOYVERSE] A obter IDs do sistema...`);
        const [storesRes, paymentRes, itemsRes] = await Promise.all([
            fetch('https://api.loyverse.com/v1.0/stores', { headers: { 'Authorization': `Bearer ${loyverseToken}` } }),
            fetch('https://api.loyverse.com/v1.0/payment_types', { headers: { 'Authorization': `Bearer ${loyverseToken}` } }),
            fetch('https://api.loyverse.com/v1.0/items', { headers: { 'Authorization': `Bearer ${loyverseToken}` } })
        ]);

        const storeId = (await storesRes.json()).stores[0]?.id;
        const paymentTypeId = (await paymentRes.json()).payment_types[0]?.id;
        const itemsData = await itemsRes.json();

        if (!storeId || !paymentTypeId) {
            throw new Error("Erro de configuração de loja no Loyverse.");
        }

        let recargaVariantId = null;
        let recargaItemId = null;

        if (itemsData.items) {
            const itemExistente = itemsData.items.find((i: any) =>
                i.item_name === 'Recarga Cantina' || i.item_name === 'Recarga de Saldo'
            );
            if (itemExistente && itemExistente.variants?.length > 0) {
                recargaItemId = itemExistente.id;
                recargaVariantId = itemExistente.variants[0].variant_id;
            }
        }

        if (!recargaVariantId) {
            console.log(`[LOYVERSE] A criar item "Recarga Cantina"...`);
            const novoItemRes = await fetch('https://api.loyverse.com/v1.0/items', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${loyverseToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_name: "Recarga Cantina", variants: [{ pricing_type: "VARIABLE" }] })
            });
            const novoItemData = await novoItemRes.json();
            recargaItemId = novoItemData.id;
            recargaVariantId = novoItemData.variants[0]?.variant_id;
        }

        // ====================================================================
        // 2. GERAR RECIBO E DEIXAR O LOYVERSE DAR OS PONTOS AUTOMATICAMENTE
        // ====================================================================
        console.log(`[LOYVERSE] A gerar recibo oficial. O Loyverse vai calcular os pontos sozinho...`);

        const receipt = {
            store_id: storeId,
            customer_id: loyverseId, // MANTEMOS O NOME DO MEMBRO PARA ELE RECEBER OS PONTOS
            order_type: 'SALES',
            source: 'API',
            receipt_type: 'SALE',
            total_money: valor,
            total_tax: 0,
            payments: [{ payment_type_id: paymentTypeId, money_amount: valor }],
            line_items: [{
                item_id: recargaItemId,
                variant_id: recargaVariantId,
                quantity: 1,
                price: valor,
                gross_total_money: valor,
                total_money: valor
            }]
        };

        const loyverseReceiptRes = await fetch(`https://api.loyverse.com/v1.0/receipts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loyverseToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(receipt)
        });

        if (!loyverseReceiptRes.ok) {
            const recErr = await loyverseReceiptRes.text();
            console.error(`[LOYVERSE ERRO] Falha ao gerar recibo:`, recErr);
            throw new Error("O Loyverse rejeitou o recibo.");
        }

        console.log(`✅ [LOYVERSE] Recibo aceite! Pontos atribuídos pelo Loyverse.`);

        // ====================================================================
        // 3. ATUALIZAR STATUS NO PRISMA
        // ====================================================================
        console.log(`[PRISMA] Pedido #${pedidoId} aprovado com sucesso!`);
        await prisma.pedidoSaldoCantina.update({
            where: { id: pedidoId },
            data: { status: 'APROVADO' }
        });

        console.log(`======================================================\n`);

        revalidatePath('/departamentos/financeiro/dashboard');
        revalidatePath('/membros/dashboard');

        return { ok: true };

    } catch (error: any) {
        console.error(`[ERRO FINAL]`, error);
        return { ok: false, error: error.message };
    }
}

export async function setVencedorRifaAction(rifaId: number, numero: number) {
    try {
        await prisma.rifa.update({
            where: { id: rifaId },
            data: {
                numero_sorteado: numero,
                status: "FINALIZADA"
            }
        });
        revalidatePath('/membros/dashboard');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function confirmarMBWayCarneAction(lancamentoId: number) {
    try {
        // Ao mudar a forma de pagamento, ele sai da lista de "pendentes" 
        // e entra no histórico e no cálculo final do carnê.
        await prisma.lancamentoFinanceiro.update({
            where: { id: lancamentoId },
            data: {
                forma_pagamento: 'MBWAY (Validado)' // Pode colocar 'Transferência' se preferir
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao validar MBWay:", error);
        return { error: "Falha ao validar o pagamento." };
    }
}

export async function setVencedoresRifaAction(formData: FormData) {
    try {
        const rifa_id = parseInt(formData.get('rifa_id') as string);
        const num1 = parseInt(formData.get('num1') as string);

        // O 2º e 3º lugar são opcionais, por isso verificamos se existem
        const num2Str = formData.get('num2') as string;
        const num3Str = formData.get('num3') as string;

        const num2 = num2Str ? parseInt(num2Str) : null;
        const num3 = num3Str ? parseInt(num3Str) : null;

        await prisma.rifa.update({
            where: { id: rifa_id },
            data: {
                numero_sorteado: num1,
                numero_sorteado_2: num2,
                numero_sorteado_3: num3,
                status: "FINALIZADA"
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao declarar vencedores:", error);
        return { ok: false, error: "Erro ao registar os vencedores da Rifa." };
    }
}

export async function getHistoricoComprasLoyverse(loyverseId: string) {
    if (!loyverseId) {
        throw new Error("O membro não tem um ID do Loyverse associado.");
    }
    const token = process.env.LOYVERSE_ACCESS_TOKEN;

    try {
        const res = await fetch(`https://api.loyverse.com/v1.0/receipts?limit=250`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        if (!res.ok) return { error: "Erro na API do Loyverse" };
        const data = await res.json();

        const todosOsRecibos = data.receipts || [];

        const recibosExclusivosDoMembro = todosOsRecibos.filter(
            (recibo: any) => recibo.customer_id === loyverseId
        );

        return { receipts: recibosExclusivosDoMembro };
    } catch (e) {
        console.error("Erro no fetch do Loyverse:", e);
        return { error: "Erro de conexão" };
    }
}

export async function lancarPagamentoCarne(carneId: number, qtdParcelas: number) {
    try {
        const carne = await prisma.objetivoFinanceiro.findUnique({
            where: { id: carneId }
        });

        if (!carne) throw new Error("Carnê não encontrado.");

        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada.' };

        const valorTotal = carne.valor_mensal * qtdParcelas;

        // 1. Atualiza o Carnê (Soma as parcelas pagas e o status)
        await prisma.objetivoFinanceiro.update({
            where: { id: carneId },
            data: {
                parcelas_pagas: { increment: qtdParcelas },
                status: (carne.parcelas_pagas + qtdParcelas) >= carne.parcelas_total ? 'CONCLUIDO' : 'ATIVO'
            }
        });

        // 2. Lança a Transação
        await prisma.lancamentoFinanceiro.create({
            data: {
                tenant_id: carne.tenant_id,
                objetivo_id: carneId,
                valor_pago: valorTotal,
                data_recebimento: new Date(),
                forma_pagamento: 'DINHEIRO',
                registrado_por_id: session.membroId
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function lancarPagamentoCarneAction(carneId: number, qtd: number) {
    try {
        const carne = await prisma.objetivoFinanceiro.findUnique({
            where: { id: carneId },
            include: { lancamentos: true }
        });

        if (!carne) throw new Error("Carnê não encontrado");

        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada.' };

        const valorTotal = carne.valor_mensal * qtd;

        // Criar o lançamento financeiro
        await prisma.lancamentoFinanceiro.create({
            data: {
                tenant_id: carne.tenant_id,
                objetivo_id: carneId,
                valor_pago: valorTotal,
                data_recebimento: new Date(),
                forma_pagamento: 'DINHEIRO', // Pode ser dinâmico
                registrado_por_id: session.membroId
            }
        });

        // Atualizar o contador de parcelas pagas no objetivo
        await prisma.objetivoFinanceiro.update({
            where: { id: carneId },
            data: {
                parcelas_pagas: { increment: qtd },
                status: (carne.parcelas_pagas + qtd) >= carne.parcelas_total ? 'CONCLUIDO' : 'ATIVO'
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}

export async function lancarContribuicaoAction(formData: FormData) {
    try {
        const membroId = Number(formData.get('membroId'));
        const valor = Number(formData.get('valor'));
        const tipo = formData.get('tipo') as string;
        const observacao = formData.get('observacao') as string;
        const data = formData.get('data') ? new Date(formData.get('data') as string) : new Date();

        const membro = await prisma.membro.findUnique({
            where: { id: membroId },
            select: { tenant_id: true }
        });

        if (!membro) {
            return { ok: false, error: "Membro não encontrado." };
        }

        await prisma.contribuicao.create({
            data: {
                tenant_id: membro.tenant_id,
                membro_id: membroId,
                tipo,
                valor,
                data,
                observacao
            }
        });

        // 🧹 LIMPEZA DE CACHE CORRETA!
        // Removemos aquele com o "[id]" que dava erro, e adicionamos o dashboard financeiro!
        revalidatePath('/membros/dashboard');
        revalidatePath('/departamentos/financeiro/dashboard'); // 👈 A mágica que atualiza a tua tela na hora!
        revalidatePath('/financeiro/dashboard'); // (Coloquei as duas variações de URL por segurança)

        return { ok: true };
    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function registrarPagamentoCampanhaAction(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada.' };

        const objetivo_id = parseInt(formData.get('objetivo_id') as string);
        const valor_pago = parseFloat(formData.get('valor_pago') as string);
        const forma_pagamento = formData.get('forma_pagamento') as string;

        const objetivo = await prisma.objetivoFinanceiro.findUnique({
            where: { id: objetivo_id },
            select: { tenant_id: true }
        });

        if (!objetivo) {
            return { ok: false, error: 'Campanha não encontrada.' };
        }

        // 1. Regista a entrada do dinheiro
        await prisma.lancamentoFinanceiro.create({
            data: {
                tenant_id: objetivo.tenant_id,
                objetivo_id,
                valor_pago,
                forma_pagamento,
                registrado_por_id: session.membroId // Quem recebeu o dinheiro (o Tesoureiro)
            }
        });

        // 2. Incrementa o número de parcelas pagas na campanha
        await prisma.objetivoFinanceiro.update({
            where: { id: objetivo_id },
            data: {
                parcelas_pagas: { increment: 1 }
            }
        });

        revalidatePath('/departamentos/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao registar pagamento:", error);
        return { ok: false, error: 'Erro ao processar o pagamento.' };
    }
}



export async function buscarRelatorioTesouraria(ano: number, mes: number, membroIdFiltro: string, tipoFiltro: string) {
    try {
        let dataInicio, dataFim;

        if (mes > 0) {
            dataInicio = new Date(ano, mes - 1, 1);
            dataFim = new Date(ano, mes, 0, 23, 59, 59);
        } else {
            dataInicio = new Date(ano, 0, 1);
            dataFim = new Date(ano, 11, 31, 23, 59, 59);
        }

        const membroId = membroIdFiltro && membroIdFiltro !== 'todos' ? Number(membroIdFiltro) : undefined;

        // 1. Busca Dízimos, Ofertas e Missões
        let whereContribuicoes: any = { data: { gte: dataInicio, lte: dataFim } };
        if (membroId) whereContribuicoes.membro_id = membroId;

        // Se escolheu um tipo específico que não é CAMPANHA
        if (tipoFiltro !== 'TODOS' && tipoFiltro !== 'CAMPANHA') {
            whereContribuicoes.tipo = tipoFiltro;
        } else if (tipoFiltro === 'CAMPANHA') {
            whereContribuicoes.id = -1; // Truque para não trazer contribuições se ele só quer ver Campanhas
        }

        const contribuicoes = await prisma.contribuicao.findMany({
            where: whereContribuicoes,
            include: { membro: true },
            orderBy: { data: 'asc' }
        });

        // 2. Busca Pagamentos de Carnês/Campanhas
        let whereLancamentos: any = { data_recebimento: { gte: dataInicio, lte: dataFim } };
        if (membroId) whereLancamentos.objetivo = { membro_id: membroId };

        // Se escolheu um tipo específico que não é CAMPANHA, não trazemos os carnês
        if (tipoFiltro !== 'TODOS' && tipoFiltro !== 'CAMPANHA') {
            whereLancamentos.id = -1;
        }

        const lancamentos = await prisma.lancamentoFinanceiro.findMany({
            where: whereLancamentos,
            include: { objetivo: { include: { membro: true } } },
            orderBy: { data_recebimento: 'asc' }
        });

        // 3. Unifica e formata tudo
        const transacoes = [
            ...contribuicoes.map((c: any) => ({
                id: `contrib-${c.id}`,
                data: c.data || c.createdAt,
                nome: c.membro ? `${c.membro.first_name} ${c.membro.last_name}` : 'Oferta Anónima',
                tipo: c.tipo,
                descricao: c.observacao || c.tipo,
                valor: c.valor
            })),
            ...lancamentos.map((l: any) => ({
                id: `carne-${l.id}`,
                data: l.data_recebimento,
                nome: `${l.objetivo.membro.first_name} ${l.objetivo.membro.last_name}`,
                tipo: 'CAMPANHA',
                descricao: `Campanha: ${l.objetivo.nome}`,
                valor: l.valor_pago
            }))
        ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        return { sucesso: true, transacoes };
    } catch (error) {
        console.error("Erro ao buscar relatório tesouraria:", error);
        return { sucesso: false, erro: "Falha ao carregar o relatório." };
    }
}



// NOVOS
// PATCH: actions/financeiro-actions.ts
// Substitui a funcao buscarExtratoFinanceiroMembro por esta versao corrigida

export async function buscarExtratoFinanceiroMembro(
    membroId: number,
    ano: number,
    mes: number   // 0 = ano inteiro, 1-12 = mes especifico
) {
    try {
        const inicio = mes === 0
            ? new Date(ano, 0, 1)
            : new Date(ano, mes - 1, 1)

        const fim = mes === 0
            ? new Date(ano, 11, 31, 23, 59, 59)
            : new Date(ano, mes, 0, 23, 59, 59)

        // CORRECAO: filtrar por createdAt (sempre preenchido) em vez de data (pode ser null)
        // e remover o OR que causava conflito
        const contribuicoes = await prisma.contribuicao.findMany({
            where: {
                membro_id: membroId,
                createdAt: { gte: inicio, lte: fim }
            },
            orderBy: { createdAt: 'desc' }
        })

        const lancamentos = await prisma.lancamentoFinanceiro.findMany({
            where: {
                NOT: { forma_pagamento: 'MBWAY' },
                objetivo: { membro_id: membroId },
                data_recebimento: { gte: inicio, lte: fim }
            },
            include: {
                objetivo: { select: { nome: true } }
            },
            orderBy: { data_recebimento: 'desc' }
        })

        const numerosRifa = await prisma.rifaNumero.findMany({
            where: {
                membro_id: membroId,
                createdAt: { gte: inicio, lte: fim }
            },
            include: {
                rifa: { select: { nome: true, valor_numero: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const transacoes = [
            ...contribuicoes.map(c => ({
                id: `contrib-${c.id}`,
                tipo: c.tipo,
                valor: c.valor,
                // usa data se existir, senao createdAt
                data: (c.data ?? c.createdAt).toISOString(),
                descricao: null
            })),
            ...lancamentos.map(l => ({
                id: `carne-${l.id}`,
                tipo: 'CARNE',
                valor: l.valor_pago,
                data: l.data_recebimento.toISOString(),
                descricao: l.objetivo?.nome ?? null
            })),
            ...numerosRifa.map(n => ({
                id: `rifa-${n.id}`,
                tipo: 'RIFA',
                valor: n.rifa.valor_numero,
                data: n.createdAt.toISOString(),
                descricao: n.rifa.nome
            }))
        ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        console.log('ACTION recebeu:', { membroId, tipo: typeof membroId, ano, mes })

        return { sucesso: true, transacoes }
    } catch (error: any) {
        console.error('Erro ao buscar extrato:', error)
        return { sucesso: false, transacoes: [] }
    }
}