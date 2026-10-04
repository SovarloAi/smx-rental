import DefinitiefContract from "@/components/contract/DefinitiefContract";

export const runtime = "edge";

export default function DefinitiefPagina({ params }: { params: { token: string } }) {
  return <DefinitiefContract token={params.token} />;
}
