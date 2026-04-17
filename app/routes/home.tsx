import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Inicio" },
    {
      name: "description",
      content: "Dashboard de inicio con accesos rapidos y resumen operativo.",
    },
  ];
}

export default function Home() {

  return <Welcome />;
}
