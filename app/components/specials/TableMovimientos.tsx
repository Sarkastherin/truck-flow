import { TableComponent } from "~/components/TableComponent";
import type { TableColumn } from "react-data-table-component";
import {
  optionMediosPago,
  optionsTipoMovimiento,
  type MovimientoDetalle,
  type MovimientoFormValues,
  type Documento,
} from "~/types/cuentas-corrientes";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { capitalize } from "~/utils/functions";
import { LuBanknote, LuFileArchive } from "react-icons/lu";
import { useModal } from "~/context/ModalContext";
import EditMovimiento from "../modals/customs/EditMovimiento";
import { useMovimientos } from "~/hooks/useMovimientos";
import type { FileTypeActions } from "../FileInputComponent";
import { useState, useRef, useEffect } from "react";
import { BadgeStatusMovimiento } from "./Badges";
const columns: TableColumn<MovimientoDetalle>[] = [
  {
    name: "Fecha",
    selector: (row) => formatDateUStoES(row.fecha_movimiento),
    sortable: true,
    sortFunction: (rowA, rowB) => {
      const dateA = new Date(rowA.fecha_movimiento);
      const dateB = new Date(rowB.fecha_movimiento);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "Tipo",
    selector: (row) => capitalize(row.tipo_movimiento),
    sortable: true,
  },
  { name: "Origen", selector: (row) => capitalize(row.origen), sortable: true },
  {
    name: "Medio de pago",
    selector: (row) => capitalize(row.medio_pago) || "-",
    sortable: true,
  },
  {
    name: "Debe",
    selector: (row) =>
      (row.debe || 0).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    sortable: true,
  },
  {
    name: "Haber",
    selector: (row) =>
      (row.haber || 0).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    sortable: true,
  },
  {
    name: "Estado",
    width: "100px",
    cell: (row) => <BadgeStatusMovimiento active={row.active} />,
    sortable: true,
  },
  {
    name: "Cheques",
    width: "95px",
    cell: (row) => {
      if (row.cheques && row.cheques.length > 0) {
        return (
          <div className={"flex gap-2 text-green-600 dark:text-green-400"}>
            {row.cheques?.length} <LuBanknote className="w-5 h-5" />
          </div>
        );
      } else {
        return null;
      }
    },
  },
  {
    name: "Doc.",
    width: "95px",
    cell: (row) => {
      if (row.documentos?.length || 0 > 0) {
        return (
          <div className={"flex gap-2 text-blue-600 dark:text-blue-400"}>
            {row.documentos?.length} <LuFileArchive className="w-5 h-5" />
          </div>
        );
      } else {
        return null;
      }
    },
  },
];
export default function TableMovimientos({
  movimientos,
}: {
  movimientos: MovimientoDetalle[];
}) {
  const { openModal } = useModal();
  const [files, setFiles] = useState<FileTypeActions<Documento>>({
    add: null,
    remove: null,
  });

  const filesRef = useRef(files);
  const { form, fieldArrayCheques, fieldArrayDocumentos, onUpdate, onAnularPago } =
    useMovimientos();
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const handleRowClick = (row: MovimientoDetalle) => {
    const nextFiles = {
      add: null,
      remove: null,
    } satisfies FileTypeActions<Documento>;
    setFiles(nextFiles);
    filesRef.current = nextFiles;
    const newForm = form;
    newForm.reset(row);
    openModal("form", {
      component: EditMovimiento,
      props: {
        form: newForm,
        title: "Editar movimiento",
        size: "4xl",
        fieldArrayCheques,
        fieldArrayDocumentos,
        isEfectivo:
          row.medio_pago === "efectivo" || row.medio_pago === "transferencia",
        files,
        setFiles,
        onAnularPago,
      },
      onSubmit: form.handleSubmit(handleOnUpdate),
    });
  };
  const handleOnUpdate = async (data: MovimientoFormValues) => {
    await onUpdate(data, filesRef.current);
  };
  return (
    <TableComponent
      columns={columns}
      data={movimientos}
      onRowClick={handleRowClick}
      filterFields={[
        {
          key: "fecha_movimiento",
          label: "Fecha",
          type: "dateRange",
        },
        {
          key: "tipo_movimiento",
          label: "Tipo de movimiento",
          type: "select",
          options: optionsTipoMovimiento,
        },
        {
          key: "medio_pago",
          label: "Medio de pago",
          type: "select",
          options: optionMediosPago,
        },
      ]}
    />
  );
}
