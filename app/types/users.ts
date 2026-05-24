import type { CommonTypes } from "./commonTypes";
export type Role = "ADMIN" | "SUPERVISOR" | "SELLER" | "USER" | "DEV";
export const optionsRoles: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "SELLER", label: "Vendedor" },
];
export type UsersTable = CommonTypes & {
  nombre: string;
  apellido: string;
  email: string;
  role: Role;
};
