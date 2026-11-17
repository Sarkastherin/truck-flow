import type { Route } from "../+types/home";
import { useTableExport, type TableColumn } from "react-data-table-component";
import { formatCurrency, formatDateUStoES } from "~/utils/formats";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { LoadingComponent } from "~/components/LoadingComponent";
import { useAdministracion } from "~/context/AdministracionContext";
import type {
  BulkChequeActionValues,
  Cheque,
  ChequeConSociosYMovimiento,
  Movimientos,
} from "~/types/cuentas-corrientes";
import { capitalize } from "~/utils/functions";
import { BadgeStatusCheque } from "~/components/specials/Badges";
import TableComponent from "~/components/TableComponentNew";
import { Button } from "flowbite-react";
import { FaCopy, FaDownload } from "react-icons/fa6";
import { useModal } from "~/context/ModalContext";
import {
  chequeStateMachine,
  getChequeTransition,
} from "~/utils/chequeStateMachine";
import ApplyActionsToCheques from "~/components/modals/customs/ApplyActionsToCheques";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cheques" },
    { name: "description", content: "Bienvenido a la gestión de cheques" },
  ];
}

export default function PedidosHome() {
  const { openModal, closeModal, setMessageForm, setStepForm } = useModal();
  const { getAdministracionData, cheques, bancos, CUDCheques, CUDMovimientos } =
    useAdministracion();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ChequeConSociosYMovimiento[]>([]);
  const form = useForm<BulkChequeActionValues>({
    defaultValues: {
      accion: "",
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
      proveedor_id: "",
    },
  });
  useEffect(() => {
    if (!cheques) {
      getAdministracionData();
    }
  }, [getAdministracionData, cheques]);
  const handleRowClick = (row: ChequeConSociosYMovimiento) => {
    navigate(`/administracion/cheques/${row.id}`, { state: { pedido: row } });
  };
  if (!cheques) {
    return <LoadingComponent />;
  }
  const columns: TableColumn<ChequeConSociosYMovimiento>[] = [
    {
      name: "F. pago",
      selector: (row) => formatDateUStoES(row.fecha_cobro),
      sortable: true,
      filterable: true,
      filterType: "date",
      sortFunction: (rowA, rowB) => {
        const dateA = new Date(rowA.fecha_cobro);
        const dateB = new Date(rowB.fecha_cobro);
        return dateA.getTime() - dateB.getTime();
      },
      width: "140px",
    },
    {
      name: "F. endoso",
      selector: (row) => formatDateUStoES(row.fecha_endoso),
      sortable: true,
      sortFunction: (rowA, rowB) => {
        if (rowA.fecha_endoso && rowB.fecha_endoso) {
          return (
            new Date(rowA.fecha_endoso).getTime() -
            new Date(rowB.fecha_endoso).getTime()
          );
        }
        if (!rowA.fecha_endoso && !rowB.fecha_endoso) return 0;
        return rowA.fecha_endoso ? -1 : 1;
      },
      filterable: true,
      filterType: "date",
      width: "140px",
    },
    {
      name: "Tipo ",
      selector: (row) => capitalize(row.tipo),
      filterable: true,
      filterType: "set",
    },
    {
      name: "Banco",
      selector: (row) =>
        bancos?.find((banco) => banco.value === row.banco)?.label || "-",
      sortable: true,
      width: "150px",
      filterable: true,
      filterType: "set",
    },
    {
      name: "Número",
      selector: (row) => row.numero || "-",
      sortable: true,
      filterable: true,
      filterType: "number",
      width: "130px",
    },
    {
      name: "Importe",
      selector: (row) => row.importe,
      format: (row) => formatCurrency(row.importe),
      sortable: true,
      filterable: true,
      filterType: "number",
      width: "130px",
    },
    {
      name: "Origen",
      selector: (row) => row.cliente?.razon_social || "-",
      sortable: true,
      filterable: true,
      filterType: "text",
      grow: 2,
    },
    {
      name: "Destino",
      selector: (row) => row.proveedor?.razon_social || "-",
      sortable: true,
      filterable: true,
      filterType: "text",
      grow: 2,
    },
    {
      name: "Estado",
      selector: (row) => row.status,
      cell: (row) => <BadgeStatusCheque status={row.status} />,
      sortable: true,
      filterable: true,
      filterType: "set",
      width: "150px",
    },
  ];
  const { download, copy } = useTableExport({
    columns: columns,
    rows: cheques,
    valueSource: "format",
  });
  const handleApplyBulkAction = async (data: BulkChequeActionValues) => {
    try {
      form.clearErrors();
      // Validaciones de campos que no usan register (seteados con setValue)
      if (!data.accion) {
        form.setError("accion", { message: "Seleccioná una acción" });
        return;
      }
      if (
        ["depositar", "endosar", "anular", "acreditar", "rechazar"].includes(
          data.accion,
        ) &&
        !data.fecha
      ) {
        form.setError("fecha", { message: "La fecha es requerida" });
        return;
      }
      if (
        (data.accion === "anular" || data.accion === "rechazar") &&
        !data.motivo.trim()
      ) {
        form.setError("motivo", { message: "El motivo es requerido" });
        return;
      }
      if (data.accion === "endosar" && !data.proveedor_id) {
        form.setError("proveedor_id", {
          message: "Seleccioná el proveedor",
        });
        return;
      }
      const status = selected[0]?.status;
      if (!status) {
        throw new Error("No se encontraron cheques seleccionados");
      }
      const transition = getChequeTransition(status, data.accion);
      if (!transition) {
        throw new Error("La acción seleccionada no es válida para el estado actual");
      }

      const buildPayload = (
        cheque: ChequeConSociosYMovimiento,
      ): Cheque => {
        const { cliente, proveedor, movimiento, ...resto } = cheque;
        switch (data.accion) {
          case "depositar":
            return {
              ...resto,
              status: "depositado",
              fecha_deposito: data.fecha,
              fecha_endoso: undefined,
              proveedor_id: undefined,
              fecha_anulacion: undefined,
            };
          case "endosar":
            return {
              ...resto,
              status: "endosado",
              fecha_endoso: data.fecha,
              proveedor_id: data.proveedor_id,
              fecha_deposito: undefined,
              fecha_anulacion: undefined,
            };
          case "anular":
            return {
              ...resto,
              status: "anulado",
              fecha_anulacion: data.fecha,
              motivo_anulacion: data.motivo,
              fecha_deposito: undefined,
              fecha_endoso: undefined,
              proveedor_id: undefined,
            };
          case "acreditar":
            return {
              ...resto,
              status: "acreditado",
              fecha_acreditacion: data.fecha,
              fecha_rechazo: undefined,
              motivo_rechazo: undefined,
            };
          case "rechazar":
            return {
              ...resto,
              status: "rechazado",
              fecha_rechazo: data.fecha,
              motivo_rechazo: data.motivo,
              fecha_acreditacion: undefined,
            };
          case "anularEndoso":
            return {
              ...resto,
              status: "en_cartera",
              fecha_endoso: "",
              proveedor_id: "",
            };
          default:
            return resto;
        }
      };

      const payloads = selected.map(buildPayload);
      const resultCheques = await CUDCheques(payloads, []);
      if (!resultCheques.success) {
        throw new Error(
          resultCheques.error ||
            resultCheques.message ||
            "No se pudieron actualizar los cheques",
        );
      }

      if (transition.effect === "generarDeuda") {
        const today = new Date().toISOString().split("T")[0];
        const movimientos: Movimientos[] = selected.map(
          (cheque) =>
            ({
              cliente_id: cheque.movimiento?.cliente_id || "",
              fecha_movimiento: today,
              tipo_movimiento: "deuda",
              origen:
                data.accion === "rechazar"
                  ? "rechazo_cheque"
                  : "anulacion_movimiento",
              medio_pago: "no_aplica",
              debe: cheque.importe || 0,
              haber: 0,
              concepto: `Deuda generada por cheque ${cheque.numero} - ${capitalize(data.accion)}`,
            }) as Movimientos,
        );
        const resultMovs = await CUDMovimientos(movimientos, []);
        if (!resultMovs.success) {
          throw new Error(
            `Cheques actualizados pero error al generar la deuda: ${
              resultMovs.error || resultMovs.message
            }`,
          );
        }
      }

      setMessageForm(
        `Se aplicó la acción a ${selected.length} cheque${selected.length === 1 ? "" : "s"}`,
      );
      setStepForm("success");
    } catch (error) {
      setMessageForm(
        error instanceof Error
          ? error.message
          : "No se pudo aplicar la acción a los cheques",
      );
      setStepForm("error");
    }
  };
  const handleSelectedCheques = () => {
    if (selected.length === 0) return;
    const status = selected[0].status;
    const hasSameStatus = selected.every((cheque) => cheque.status === status);
    if (!hasSameStatus) {
      openModal("error", {
        props: {
          title: "Los Status no coinciden",
          message:
            "Los cheques deben tener el mismo status para aplicar una acción a multiples cheques",
        },
      });
      return;
    }
    const validActions = Object.keys(chequeStateMachine[status] ?? {});
    if (validActions.length === 0) {
      openModal("error", {
        props: {
          title: "Sin acciones disponibles",
          message:
            "Los cheques seleccionados no permiten acciones en su estado actual.",
        },
      });
      return;
    }
    form.reset({
      accion: "",
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
      proveedor_id: "",
    });
    openModal("form", {
      component: ApplyActionsToCheques,
      props: {
        title: "Aplicar acciones a varios cheques",
        form,
        cheques: selected,
        size: "3xl",
      },
      onSubmit: form.handleSubmit(handleApplyBulkAction),
      onCloseCustom: () => {
        setSelected([]);
        closeModal();
      },
    });
  };
  return (
    <>
      {selected.length > 0 && (
        <div
          className="mb-2 text-xs underline text-primary-600 dark:text-primary-400 cursor-pointer"
          onClick={handleSelectedCheques}
        >
          Aplicar acción a los {selected.length} seleccionado
          {selected.length === 1 ? "" : "s"}
        </div>
      )}
      <TableComponent
        columns={columns}
        data={cheques || []}
        searchKeys={["cliente.razon_social", "tipo", "banco", "numero", "importe", "cliente.razon_social", "proveedor.razon_social", "status"]}
        onRowClicked={handleRowClick}
        isLoading={false}
        title={"Cheques"}
        backPath="/administracion"
        color={"green"}
        searchPlaceholder="Buscar por cliente, tipo, banco, número, importe, origen, destino y estado"
        scrollHeightOffset={210}
        labelButton=""
        message={
          <div className="flex gap-2 w-full">
            <Button size="sm" color={"alternative"} onClick={() => copy("csv")}>
              <FaCopy className="me-1.5" />
              Copiar
            </Button>
            <Button
              size="sm"
              color={"alternative"}
              onClick={() => download(`cheques.csv`)}
            >
              <FaDownload className="me-1.5" />
              Descargar
            </Button>
          </div>
        }
        hasActiveColumn={false}
        selectableRows
        selectedRows={selected}
        onSelectedRowsChange={({ selectedRows }) => setSelected(selectedRows)}
      />
    </>
  );
}
