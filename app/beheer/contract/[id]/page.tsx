import { Suspense } from "react";
import ContractDetail from "@/components/beheer/ContractDetail";

export const runtime = "edge";

export default function ContractDetailPagina({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink/50">Bezig met laden…</p>}>
      <ContractDetail id={params.id} />
    </Suspense>
  );
}
