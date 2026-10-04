import KlantPagina from "@/components/contract/KlantPagina";

export const runtime = "edge";

export default function ContractPagina({ params }: { params: { token: string } }) {
  return <KlantPagina token={params.token} />;
}
