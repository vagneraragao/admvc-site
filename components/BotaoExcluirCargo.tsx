"use client"

interface BotaoExcluirProps {
    id: number;
    nome: string;
    onExcluir: (id: number) => Promise<void>;
}

export default function BotaoExcluirCargo({ id, nome, onExcluir }: BotaoExcluirProps) {
    const handleExcluir = async () => {
        const confirmou = confirm(`Tem certeza que deseja excluir o cargo "${nome.toUpperCase()}"?`);

        if (confirmou) {
            try {
                await onExcluir(id);
            } catch (error) {
                alert("Erro ao excluir o cargo. Verifique se existem membros vinculados.");
            }
        }
    };

    return (
        <button
            onClick={handleExcluir}
            className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-red-500 uppercase px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
        >
            Excluir
        </button>
    );
}