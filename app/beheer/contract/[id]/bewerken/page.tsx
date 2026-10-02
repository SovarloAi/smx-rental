import type { Metadata } from "next";
import BewerkContract from "@/components/beheer/BewerkContract";

export const runtime = "edge";
export const metadata: Metadata = { title: "Contract bewerken" };

export default function BewerkenPagina({ params }: { params: { id: string } }) {
  return <BewerkContract id={params.id} />;
}
