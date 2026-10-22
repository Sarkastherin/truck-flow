export function formatDateUStoES(value?: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
export function formatCurrency(value?: number) {
  if (!value) return "$ 0,00";
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}
