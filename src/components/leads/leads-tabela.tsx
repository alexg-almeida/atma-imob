"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { corEtapa } from "@/lib/leads/constants";
import { formatDate } from "@/lib/format";
import type { Lead, LeadEtapa } from "@/lib/supabase/types";

export type LeadTabelaItem = Lead & {
  corretor: { nome_completo: string } | null;
  imovel_interesse: { cidade: string | null; tipo: { nome: string } | null } | null;
};

function EtapaDot({ nome }: { nome: string }) {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: corEtapa(nome) }}
      aria-hidden
    />
  );
}

function EtapaCell({
  lead,
  etapas,
  podeEditar,
  onAlterar,
}: {
  lead: LeadTabelaItem;
  etapas: Pick<LeadEtapa, "id" | "nome">[];
  podeEditar: boolean;
  onAlterar: (leadId: string, etapaId: string) => void;
}) {
  const etapaAtual = etapas.find((e) => e.id === lead.etapa_id);
  const label = etapaAtual?.nome ?? "—";

  if (!podeEditar) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-ink">
        <EtapaDot nome={label} />
        {label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-sm text-sm text-ink outline-none transition-colors duration-150 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40">
        <EtapaDot nome={label} />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {etapas.map((etapa) => (
          <DropdownMenuItem
            key={etapa.id}
            onSelect={() => onAlterar(lead.id, etapa.id)}
          >
            <EtapaDot nome={etapa.nome} />
            {etapa.nome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LeadsTabela({
  etapas,
  leads: leadsIniciais,
  podeEditar,
}: {
  etapas: Pick<LeadEtapa, "id" | "nome" | "ordem">[];
  leads: LeadTabelaItem[];
  podeEditar: boolean;
}) {
  const [leads, setLeads] = useState(leadsIniciais);

  async function handleAlterarEtapa(leadId: string, etapaId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa_id === etapaId) return;

    const anterior = lead.etapa_id;
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, etapa_id: etapaId } : l)),
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({ etapa_id: etapaId })
      .eq("id", leadId);

    if (error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, etapa_id: anterior } : l)),
      );
      toast.error(`Não foi possível atualizar a etapa: ${error.message}`);
      return;
    }
    toast.success("Etapa atualizada.");
  }

  if (leads.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nenhum lead cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <th className="py-3 pr-3 font-semibold">Lead</th>
            <th className="px-3 py-3 font-semibold max-md:hidden">Contato</th>
            <th className="px-3 py-3 font-semibold max-lg:hidden">
              Imóvel de interesse
            </th>
            <th className="px-3 py-3 font-semibold max-md:hidden">Corretor</th>
            <th className="px-3 py-3 font-semibold">Etapa</th>
            <th className="py-3 pl-3 font-semibold max-sm:hidden">
              Atualizado
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="group border-b border-line transition-colors duration-150 last:border-0 hover:bg-surface"
            >
              <td className="py-4 pr-3">
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
                    {lead.foto_url ? (
                      <Image
                        src={lead.foto_url}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle
                        size={20}
                        className="text-strong-line"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span className="font-medium text-ink underline-offset-4 group-hover:underline">
                    {lead.nome_completo}
                  </span>
                </Link>
              </td>
              <td className="px-3 py-4 font-mono text-xs text-muted-foreground max-md:hidden">
                {lead.whatsapp ?? lead.telefone_1 ?? "—"}
              </td>
              <td className="px-3 py-4 text-ink max-lg:hidden">
                {lead.imovel_interesse
                  ? `${lead.imovel_interesse.tipo?.nome ?? "Imóvel"}${
                      lead.imovel_interesse.cidade
                        ? ` · ${lead.imovel_interesse.cidade}`
                        : ""
                    }`
                  : "—"}
              </td>
              <td className="px-3 py-4 text-ink max-md:hidden">
                {lead.corretor?.nome_completo ?? "—"}
              </td>
              <td className="px-3 py-4">
                <EtapaCell
                  lead={lead}
                  etapas={etapas}
                  podeEditar={podeEditar}
                  onAlterar={handleAlterarEtapa}
                />
              </td>
              <td className="py-4 pl-3 font-mono text-xs text-muted-foreground max-sm:hidden">
                {formatDate(lead.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
