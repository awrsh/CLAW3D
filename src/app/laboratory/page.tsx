import type { Metadata } from "next";
import { LaboratoryExperience } from "@/components/laboratory/LaboratoryExperience";

export const metadata: Metadata = {
  title: "Pharmaceutical R&D Laboratory | Claw3D",
  description:
    "Interactive 3D pharmaceutical research laboratory — biotechnology, precision, innovation.",
};

export default function LaboratoryPage() {
  return <LaboratoryExperience />;
}
