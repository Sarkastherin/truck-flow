import { Button } from "flowbite-react";
import { LuBanknote, LuHandCoins, LuTruck } from "react-icons/lu";
import type {
  CtaCte,
  MovimientoFormValues,
  Documento,
} from "~/types/cuentas-corrientes";
import AddMovimiento from "../modals/customs/AddMovimiento";
import { useModal } from "~/context/ModalContext";
import { useMovimientos } from "~/hooks/useMovimientos";
import { useEffect, useRef, useState } from "react";
import type { FileTypeActions } from "../FileInputComponent";

type MovimientoModalConfig = {
  tipoMovimiento: MovimientoFormValues["tipo_movimiento"];
  medioPago?: MovimientoFormValues["medio_pago"];
  isEfectivo?: boolean;
};

export default function ButtonsActionsCtaCte({ clienteId }: { clienteId: string }) {
  const { openModal } = useModal();
  const [files, setFiles] = useState<FileTypeActions<Documento>>({
    add: null,
    remove: null,
  });
  const filesRef = useRef(files);
  const { form, fieldArrayCheques, fieldArrayDocumentos, onCreate } =
    useMovimientos();

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleMovimientoModal = ({
    tipoMovimiento,
    medioPago,
    isEfectivo,
  }: MovimientoModalConfig) => {
    const nextFiles = {
      add: null,
      remove: null,
    } satisfies FileTypeActions<Documento>;
    setFiles(nextFiles);
    filesRef.current = nextFiles;

    const initialCheques =
      medioPago === "cheque"
        ? [
            {
              movimiento_id: "",
              tipo: "",
              banco: "",
              numero: undefined,
              importe: undefined,
              fecha_ingreso: "",
              fecha_cobro: "",
              status: "en_cartera" as const,
              notas: "",
            },
          ]
        : [];

    form.reset({
      cliente_id: clienteId,
      fecha_movimiento: new Date().toISOString().split("T")[0],
      tipo_movimiento: tipoMovimiento,
      origen: medioPago === "cheque" ? "cheque" : "manual",
      medio_pago: medioPago ?? "",
      debe: tipoMovimiento === "deuda" ? undefined : 0,
      haber: tipoMovimiento === "deuda" ? 0 : undefined,
      cheques: initialCheques,
      documentos: [],
    });
    fieldArrayCheques.replace(initialCheques);
    fieldArrayDocumentos.replace([]);

    openModal("form", {
      component: AddMovimiento,
      props: {
        form,
        title: "Registrar movimiento",
        size: "4xl",
        fieldArrayCheques,
        fieldArrayDocumentos,
        isEfectivo,
        files,
        setFiles,
      },
      onSubmit: form.handleSubmit(handleOnCreate),
    });
  };
  const handleOnCreate = async (data: MovimientoFormValues) => {
    await onCreate(data, filesRef.current.add);
  };
  return (
    <div className="">
      <fieldset className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 w-full gap-4 border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
        <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          💳 Registrar movimientos
        </legend>
        <Button
          color="light"
          onClick={() =>
            handleMovimientoModal({
              tipoMovimiento: "deuda",
              medioPago: "no_aplica",
            })
          }
        >
          <LuBanknote className="w-5 h-5 mr-2" />
          Deuda
        </Button>
        <Button
          color="dark"
          onClick={() =>
            handleMovimientoModal({
              tipoMovimiento: "nota_credito",
              medioPago: "no_aplica",
            })
          }
        >
          <LuBanknote className="w-5 h-5 mr-2" />
          Nota de crédito
        </Button>

        <Button
          color="green"
          onClick={() =>
            handleMovimientoModal({
              tipoMovimiento: "pago",
              medioPago: "cheque",
            })
          }
        >
          <LuBanknote className="w-5 h-5 mr-2" />
          Cheque
        </Button>
        <Button
          color="blue"
          onClick={() =>
            handleMovimientoModal({
              tipoMovimiento: "pago",
              isEfectivo: true,
            })
          }
        >
          <LuHandCoins className="w-5 h-5 mr-2" />
          Efectivo/Tranferencia
        </Button>
        <Button
          color="yellow"
          onClick={() =>
            handleMovimientoModal({
              tipoMovimiento: "pago",
              medioPago: "carroceria_usada",
            })
          }
        >
          <LuTruck className="w-5 h-5 mr-2" />
          Carrocería
        </Button>
      </fieldset>
    </div>
  );
}
