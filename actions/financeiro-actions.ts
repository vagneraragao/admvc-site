'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSessionData } from '@/lib/auth-utils'


export async function criarCampanhaEmLoteAction(formData: FormData, membrosIds: number[]) {
    try {
        if (membrosIds.length === 0) {
            return { ok: false, error: 'Selecione pelo menos um membro.' };
        }

        const nome = formData.get('nome') as string;
        const valor_mensal = parseFloat(formData.get('valor_mensal') as string);
        const parcelas_total = parseInt(formData.get('parcelas_total') as string);
        const data_pagamento = parseInt(formData.get('data_pagamento') as string);

        // Cria o objetivo para CADA membro selecionado
        const dadosParaInserir = membrosIds.map(id => ({
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

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao criar campanha:", error);
        return { ok: false, error: 'Erro ao gerar os carnês.' };
    }
}

export async function registrarPagamentoCampanhaAction(formData: FormData) {
    try {
        const session = await getSessionData();
        if (!session) return { ok: false, error: 'Sessão expirada.' };

        const objetivo_id = parseInt(formData.get('objetivo_id') as string);
        const valor_pago = parseFloat(formData.get('valor_pago') as string);
        const forma_pagamento = formData.get('forma_pagamento') as string;

        // 1. Regista a entrada do dinheiro
        await prisma.lancamentoFinanceiro.create({
            data: {
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

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao registar pagamento:", error);
        return { ok: false, error: 'Erro ao processar o pagamento.' };
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

        // 2. Regista a venda do número
        await prisma.rifaNumero.create({
            data: {
                rifa_id,
                numero,
                membro_id,
                nome_externo: nome_externo || null,
                pago: true
            }
        });

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao vender número:", error);
        return { ok: false, error: 'Erro ao processar a venda do número.' };
    }
}

export async function criarRifaAction(formData: FormData) {
    try {
        const nome = formData.get('nome') as string;
        const premio = formData.get('premio') as string;
        const valor_numero = parseFloat(formData.get('valor_numero') as string);
        const total_numeros = parseInt(formData.get('total_numeros') as string);

        // Cria a rifa vazia, pronta a ser vendida
        await prisma.rifa.create({
            data: {
                nome,
                premio,
                valor_numero,
                total_numeros,
                status: 'ATIVA'
            }
        });

        revalidatePath('/financeiro/dashboard');
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

        revalidatePath('/financeiro/dashboard');
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

        // 2. Prepara os dados para inserir todos de uma vez
        const dadosParaInserir = numeros.map(num => ({
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

        revalidatePath('/financeiro/dashboard');
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

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (error) {
        console.error("Erro ao finalizar rifa:", error);
        return { ok: false, error: 'Erro ao tentar encerrar a rifa.' };
    }
}

export async function solicitarSaldoCantinaAction(formData: FormData) {
    try {
        const membroId = Number(formData.get('membro_id'));

        // 1. TRUQUE DA VÍRGULA: Substitui vírgulas por pontos (Ex: 17,50 vira 17.50)
        // Isso evita que o Prisma rejeite o número e falhe a gravação
        const valorCru = String(formData.get('valor')).replace(',', '.');
        const valor = Number(valorCru);

        const formaPagamento = formData.get('forma_pagamento') as string;

        // Validação de segurança
        if (!membroId || !valor || isNaN(valor) || valor <= 0) {
            return { ok: false, error: "Valor inválido. Por favor, verifique o montante." };
        }

        // 2. GRAVAR COMO PENDENTE
        await prisma.pedidoSaldoCantina.create({
            data: {
                membro_id: membroId,
                valor: valor,
                forma_pagamento: formaPagamento,
                status: 'PENDENTE' // Garante que vai para o alerta laranja do tesoureiro
            }
        });

        // 3. O SEGREDO DO CACHE: Mandar o Next.js atualizar as DUAS dashboards!
        revalidatePath('/membros/dashboard');
        revalidatePath('/financeiro/dashboard'); // Faltava limpar o cache do tesoureiro!

        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao solicitar saldo:", error);
        return { ok: false, error: "Erro interno ao processar o pedido." };
    }
}

export async function aprovarSaldoCantinaAction(pedidoId: number, loyverseId: string | null, valor: number) {
    try {
        if (!loyverseId) {
            throw new Error("O membro não tem um ID do Loyverse associado.");
        }

        const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;

        // ====================================================================
        // 1. FORÇA BRUTA: INJETAR OS PONTOS DIRETAMENTE NA CONTA DO CLIENTE
        // ====================================================================
        // A) Primeiro, lemos os dados completos que o cliente já tem lá
        const customerRes = await fetch(`https://api.loyverse.com/v1.0/customers/${loyverseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });

        if (!customerRes.ok) {
            const errGet = await customerRes.text();
            throw new Error(`Erro ao ler cliente no Loyverse: ${errGet}`);
        }

        const customerData = await customerRes.json();
        const currentPoints = Number(customerData.total_points || 0);
        const newPoints = currentPoints + Number(valor);

        // B) Atualizamos o saldo do cliente enviando o ID, os Pontos e o Nome (para evitar bloqueios)
        const updateCustomerRes = await fetch('https://api.loyverse.com/v1.0/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${loyverseToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: loyverseId,
                name: customerData.name || "Membro", // O Loyverse costuma exigir o nome nas atualizações
                total_points: newPoints
            })
        });

        if (!updateCustomerRes.ok) {
            // AGORA SIM! VAMOS VER O ERRO REAL DO LOYVERSE:
            const errorText = await updateCustomerRes.text();
            throw new Error(`O Loyverse bloqueou a injeção de pontos: ${errorText}`);
        }

        // ====================================================================
        // 2. OBTER LOJA, PAGAMENTO E PRODUTO (Como já tínhamos feito)
        // ====================================================================
        const storesRes = await fetch('https://api.loyverse.com/v1.0/stores', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });
        const storeId = (await storesRes.json()).stores[0].id;

        const paymentRes = await fetch('https://api.loyverse.com/v1.0/payment_types', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });
        const paymentTypeId = (await paymentRes.json()).payment_types[0].id;

        const itemsRes = await fetch('https://api.loyverse.com/v1.0/items', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${loyverseToken}` }
        });
        const itemsData = await itemsRes.json();

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
            const novoItemRes = await fetch('https://api.loyverse.com/v1.0/items', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${loyverseToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_name: "Recarga Cantina", variants: [{ pricing_type: "VARIABLE" }] })
            });
            const novoItemData = await novoItemRes.json();
            recargaItemId = novoItemData.id;
            recargaVariantId = novoItemData.variants[0].variant_id;
        }

        // ====================================================================
        // 3. GERAR O RECIBO CONTABILÍSTICO (Sem os pontos para não duplicar)
        // ====================================================================
        const receipt = {
            store_id: storeId,
            customer_id: loyverseId,
            order_type: 'SALES',
            source: 'API',
            receipt_type: 'SALE',
            total_money: valor,
            total_tax: 0,
            // Removi o 'points_earned' para evitar que o Loyverse dê pontos em duplicado.
            payments: [
                {
                    payment_type_id: paymentTypeId,
                    money_amount: valor
                }
            ],
            line_items: [
                {
                    item_id: recargaItemId,
                    variant_id: recargaVariantId,
                    quantity: 1,
                    price: valor,
                    gross_total_money: valor,
                    total_money: valor
                }
            ]
        };

        const loyverseRes = await fetch(`https://api.loyverse.com/v1.0/receipts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loyverseToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(receipt)
        });

        if (!loyverseRes.ok) throw new Error("Recibo rejeitado, mas pontos adicionados!");

        // ====================================================================
        // 4. ATUALIZAR STATUS NO BANCO E REVALIDAR
        // ====================================================================
        await prisma.pedidoSaldoCantina.update({
            where: { id: pedidoId },
            data: { status: 'APROVADO' }
        });

        revalidatePath('/financeiro/dashboard');
        revalidatePath('/membros/dashboard');

        return { ok: true };

    } catch (error: any) {
        return { ok: false, error: error.message };
    }
}

export async function lancarContribuicaoAction(formData: FormData) {
    try {
        const membroId = Number(formData.get('membroId'));
        const valor = Number(formData.get('valor'));
        const tipo = formData.get('tipo') as string; // "DIZIMO" ou "OFERTA"
        const observacao = formData.get('observacao') as string;
        const data = formData.get('data') ? new Date(formData.get('data') as string) : new Date();

        await prisma.contribuicao.create({
            data: {
                membro_id: membroId,
                tipo,
                valor,
                data,
                observacao
            }
        });

        revalidatePath('/admin/membros/editar/[id]');
        revalidatePath('/membros/dashboard');

        return { ok: true };
    } catch (error: any) {
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

        revalidatePath('/financeiro/dashboard');
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

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (error: any) {
        console.error("Erro ao declarar vencedores:", error);
        return { ok: false, error: "Erro ao registar os vencedores da Rifa." };
    }
}


export async function getHistoricoComprasLoyverse(loyverseId: string) {
    if (!loyverseId) return { error: "ID não encontrado" };
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
                objetivo_id: carneId,
                valor_pago: valorTotal,
                data_recebimento: new Date(),
                forma_pagamento: 'DINHEIRO',
                registrado_por_id: session.membroId
            }
        });

        revalidatePath('/financeiro/dashboard');
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

        revalidatePath('/financeiro/dashboard');
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e.message };
    }
}