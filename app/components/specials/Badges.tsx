import { statusOptionsPedidos, statusOptionsOT } from "~/types/pedido";
import { statusOptionsCheques } from "~/types/cuentas-corrientes";
import { statusOptionsCarroceriaUsada } from "~/types/carroceria-usada";
import { Badge, type BadgeProps } from "flowbite-react";
import { optionsRoles, type Role } from "~/types/users";
import { optionSector, type SectorTypes, type TipoPago } from "~/types/rrhh";
import { optionsStatusLiq, type StatusLiquidacion } from "~/types/liquidaciones";
const statusColorsPedido: { [key: string]: BadgeProps["color"] } = {
  nuevo: "purple",
  en_produccion: "yellow",
  en_pintura: "indigo",
  pintada: "lime",
  en_montaje: "blue",
  finalizada: "green",
  cancelado: "red",
};
const statusColorsOT: { [key: string]: BadgeProps["color"] } = {
  generada: "yellow",
  completada: "green",
  cancelada: "red",
};
const statusColorsCheques: { [key: string]: BadgeProps["color"] } = {
  en_cartera: "yellow",
  depositado: "blue",
  acreditado: "green",
  endosado: "indigo",
  anulado: "red",
  rechazado: "gray",
};
const statusColorsCarroceriaUsada: { [key: string]: BadgeProps["color"] } = {
  disponible: "green",
  vendida: "red",
  prestada: "yellow",
};
const statusColorsUsuarioRole: { [key in Role]: BadgeProps["color"] } = {
  ADMIN: "purple",
  SUPERVISOR: "blue",
  SELLER: "green",
  USER: "gray",
  DEV: "indigo",
};
const contratoColor: { [key in TipoPago]: BadgeProps["color"] } = {
  Porcentaje: "green",
  "Salario semanal": "indigo",
  "Salario mensual": "yellow",
};
const sectorColor: { [key in SectorTypes]: BadgeProps["color"] } = {
  control: "blue",
  fabricacion: "indigo",
  pintura: "yellow",
  plegado: "green",
  no_definido: "gray",
};
const statusLiquidacionColor: {
  [key in StatusLiquidacion]: BadgeProps["color"];
} = {
  nueva: "blue",
  en_proceso: "yellow",
  cerrada: "green",
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
    statusOptionsCarroceriaUsada.find((s) => s.value === status)?.label ||
    status;
  return (
    <Badge color={statusColorsCarroceriaUsada[status] || "gray"}>{label}</Badge>
  );
};

export const BadgeStatusUsuarioRole = ({ role }: { role: string }) => {
  const label =
    optionsRoles.find((option) => option.value === role)?.label || role;
  return (
    <Badge color={statusColorsUsuarioRole[role as Role] || "gray"}>
      {label}
    </Badge>
  );
};

export const BadgeStatusMovimiento = ({ active }: { active: boolean }) => {
  return (
    <Badge color={active !== false ? "green" : "red"}>
      {active !== false ? "Activo" : "Anulado"}
    </Badge>
  );
};
export const BadgeContrato = ({ tipoPago }: { tipoPago: TipoPago }) => {
  return <Badge color={contratoColor[tipoPago]}>{tipoPago}</Badge>;
};
export const BadgePremiosSector = ({ sector }: { sector: SectorTypes }) => {
  const label = optionSector.find((op) => op.value === sector)?.label || sector;
  return <Badge color={sectorColor[sector] || "gray"}>{label}</Badge>;
};
export const BadgeStatusLiq = ({ status }: { status: StatusLiquidacion }) => {
  const label = optionsStatusLiq.find((st) => st.value === status)?.label || status;
  return <Badge color={statusLiquidacionColor[status] || "gray"}>{label}</Badge>;
};