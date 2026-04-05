import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Base Repo" },
    { name: "description", content: "Stack base para nuevos proyectos con React Router, Tailwind, Flowbite y más." },
  ];
}

export default function Home() {
  return <Welcome />;
}
