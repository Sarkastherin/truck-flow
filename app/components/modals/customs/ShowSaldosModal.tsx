import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableHeadCell,
  TableCell,
} from "flowbite-react";
import type { MvtoEmpleados } from "~/types/rrhh";
import { formatCurrency } from "~/utils/formats";

export default function ShowSaldosModal({
  props,
}: {
  props: { movimientos: MvtoEmpleados[] };
}) {
  const { movimientos } = props;
  type Saldo = {
    concepto: string;
    debe: number;
    haber: number;
    saldo: number;
  };
  const agruparPorConcepto = (): Saldo[] => {
    return Object.values(
      movimientos.reduce<Record<string, Saldo>>((acc, { concepto, debe, haber }) => {
        if (!acc[concepto]) {
          acc[concepto] = { concepto, debe: 0, haber: 0, saldo: 0 };
        }

        acc[concepto].debe += debe;
        acc[concepto].haber += haber;
        acc[concepto].saldo = acc[concepto].debe - acc[concepto].haber;

        return acc;
      }, {}),
    );
  };
  const saldos: Saldo[] = agruparPorConcepto();
  return (
    <Table>
      <colgroup>
        <col />
        <col className="w-[16%]" />
        <col className="w-[16%]" />
        <col className="w-[16%]" />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableHeadCell>Concepto</TableHeadCell>
          <TableHeadCell>Debe</TableHeadCell>
          <TableHeadCell>Haber</TableHeadCell>
          <TableHeadCell>Saldo</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {saldos.map((concp, index) => (
          <TableRow key={index}>
            <TableCell className="font-semibold">{concp.concepto}</TableCell>
            <TableCell className="font-mono tracking-tighter">{formatCurrency(concp.debe)}</TableCell>
            <TableCell className="font-mono tracking-tighter">{formatCurrency(concp.haber)}</TableCell>
            <TableCell className="font-mono tracking-tighter">{formatCurrency(concp.saldo)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
