import type { Metadata } from "next";
import EigenHandtekening from "@/components/beheer/EigenHandtekening";
import KopRegel from "@/components/beheer/KopRegel";

export const runtime = "edge";
export const metadata: Metadata = { title: "Instellingen" };

export default function InstellingenPagina() {
  return (
    <>
      <KopRegel eyebrow="Beheer" titel="Instellingen" />
      <EigenHandtekening />
    </>
  );
}
