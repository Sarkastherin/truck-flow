import { statusOptionsPedidos, statusOptionsOT } from "~/types/pedido";
import { statusOptionsCheques } from "~/types/cuentas-corrientes";
import { statusOptionsCarroceriaUsada } from "~/types/carroceria-usada";
import { Badge } from "flowbite-react";
import type {Role, UsersTable} from "~/types/users";
import { optionsRoles } from "~/types/users";
const statusColorsPedido: { [key: string]: string } = {
  nuevo: "purple",
  en_produccion: "yellow",
  en_pintura: "indigo",
  pintada: "lime",
  en_montaje: "blue",
  finalizada: "green",
  cancelado: "red",
};
const statusColorsOT: { [key: string]: string } = {
  generada: "yellow",
  completada: "green",
  cancelada: "red",
};
const statusColorsCheques: { [key: string]: string } = {
  "en_cartera": "yellow",
  depositado: "blue",
  acreditado: "green",
  endosado: "indigo",
  anulado: "red",
  rechazado: "gray",
};
const statusColorsCarroceriaUsada: { [key: string]: string } = {
  disponible: "green",
  vendida: "red",
  prestada: "yellow",
};
const statusColorsUsuarioRole: { [key in Role]: string } = {
  ADMIN: "purple",
  SUPERVISOR: "blue",
  SELLER: "green",
  USER: "gray",
  DEV: "indigo",
};
export const BadgeStatusCheque = ({ status }: { status: string }) => {
  const label =
    statusOptionsCheques.find((s) => s.value === status)?.label || status;
  return <Badge color={statusColorsCheques[status] || "gray"}>{label}</Badge>;
};

export const BadgeStatusPedido = ({ status }: { status: string }) => {
  const label =
    statusOptionsPedidos.find((s) => s.value === status)?.label || status;
  return <Badge color={statusColorsPedido[status] || "gray"}>{label}</Badge>;
};
export const BadgeStatusOT = ({ status }: { status: string }) => {
  const label =
    statusOptionsOT.find((s) => s.value === status)?.label || status;
  return <Badge color={statusColorsOT[status] || "gray"}>{label}</Badge>;
};

export const BadgeStatusCarroceriaUsada = ({ status }: { status: string }) => {
  const label =
    statusOptionsCarroceriaUsada.find((s) => s.value === status)?.label || status;
  return <Badge color={statusColorsCarroceriaUsada[status] || "gray"}>{label}</Badge>;
};

export const BadgeStatusUsuarioRole = ({ role }: { role: string }) => {
  const label =
    optionsRoles.find((option) => option.value === role)?.label || role;
  return <Badge color={statusColorsUsuarioRole[role as Role] || "gray"}>{label}</Badge>;
};
