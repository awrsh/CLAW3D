import type { Metadata } from "next";
import { FactoryExperience } from "@/components/factory/PharmaceuticalFactory";

export const metadata: Metadata = {
  title: "Pharmaceutical Manufacturing Facility | Claw3D",
  description:
    "Interactive 3D biopharmaceutical manufacturing facility — production simulation, guided tour, digital twin.",
};

export default function FactoryPage() {
  return <FactoryExperience />;
}
