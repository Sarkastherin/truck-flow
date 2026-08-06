import { useCallback, useMemo } from "react";
import type { TableColumn } from "react-data-table-component";
import type { TabsTypes } from "~/routes/configuraciones/parametros-generales";
import { useModal } from "~/context/ModalContext";
import { ItemConfigModal } from "~/components/modals/customs/ItemConfigModal";
import type { FilterField } from "~/components/TableComponent";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useForm } from "react-hook-form";
import { capitalize } from "~/utils/functions";
import { atributosConMetadata } from "~/types/pedido";
type ItemConfig<T = any> = {
  tab: TabsTypes;
  name: string;
  singularName: string;
  columns: TableColumn<T>[];
  data: T[];
  onOpenDetails?: (row: T) => void;
  onOpenNew?: () => void;
  filterFields?: FilterField[];
};

export type FieldsForm = FilterField & {
  required?: boolean;
  onChange?: (value: any) => void;
};

const TAB_ORDER: TabsTypes[] = [
  "colores",
  "carrozados",
  "puertas_traseras",
  "personal",
  "trabajos_chasis",
  "items_control",
];

const TAB_META: Record<TabsTypes, { name: string; singular: string }> = {
  colores: { name: "Colores", singular: "Color" },
  carrozados: { name: "Carrozados", singular: "Carrozado" },
  puertas_traseras: { name: "Puertas traseras", singular: "Puerta trasera" },
  personal: { name: "Personal", singular: "Empleado" },
  trabajos_chasis: {
    name: "Trabajos en chasis",
    singular: "Trabajo en chasis",
  },
  items_control: { name: "Items de control", singular: "Item de control" },
};

const createDateColumn = (
  name: string,
  key: "created_at" | "updated_at",
): TableColumn<any> => ({
  name,
  selector: (row: any) =>
    row[key]
      ? new Date(row[key]).toLocaleDateString("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "--",
  sortable: true,
  width: "170px",
});

const toFilterFields = (fields: FieldsForm[]): FilterField[] =>
  fields.map(({ required, onChange, ...field }) => field);

export default function useItemsConfig() {
  const {
    colores,
    carrozados,
    puertasTraseras,
    personal,
    trabajosChasis,
    itemsControl,
    coloresEsmalteOptions,
    coloresLonaOptions,
    sectoresOptions,
    createNewCarrozado,
    updateCarrozado,
    deleteCarrozado,
    reactivateCarrozado,
    createNewColor,
    updateColor,
    deleteColor,
    reactivateColor,
    createNewPuertaTrasera,
    updatePuertaTrasera,
    deletePuertaTrasera,
    reactivatePuertaTrasera,
    createNewTipoTrabajo,
    updateTipoTrabajo,
    deleteTipoTrabajo,
    reactivateTipoTrabajo,
    createNewPersonal,
    updatePersonal,
    deletePersonal,
    reactivatePersonal,
    createNewItemControl,
    updateItemControl,
    deleteItemControl,
    reactivateItemControl,
  } = useConfiguracion();

  const { openModal, setMessageForm, setStepForm } = useModal();
  const form = useForm<any>({
    defaultValues: {},
  });

  // Factory para crear handlers dinámicos por tipo de entidad
  const createHandlers = useCallback(
    (
      createFn: (data: any) => Promise<any>,
      updateFn: (entity: any, dirtyFields: any) => Promise<any>,
      desactivateFn: (id: string) => Promise<any>,
      reactivateFn: (id: string) => Promise<any>,
      entityName: string,
    ) => ({
      onCreate: async (data: any) => {
        const { id, created_at, updated_at, active, ...payload } = data;
        const result = await createFn(payload);
        if (result.error) {
          setMessageForm(result.error || `Error al crear ${entityName}`);
          setStepForm("error");
          return;
        }
        setMessageForm(`${entityName} creado exitosamente`);
        setStepForm("success");
      },
      onUpdate: async (data: any) => {
        const result = await updateFn(data, form.formState.dirtyFields);
        if (result.error) {
          setMessageForm(result.error || `Error al actualizar ${entityName}`);
          setStepForm("error");
          return;
        }
        setMessageForm(`${entityName} actualizado exitosamente`);
        setStepForm("success");
      },
      onDelete: async (id: string) => {
        const result = await desactivateFn(id);
        if (result.error) {
          setMessageForm(result.error || `Error al dar de baja ${entityName}`);
          setStepForm("error");
          return;
        }
        setMessageForm(`${entityName} dado de baja exitosamente`);
        setStepForm("success");
      },
      onReactivate: async (id: string) => {
        const result = await reactivateFn(id);
        if (result.error) {
          setMessageForm(result.error || `Error al reactivar ${entityName}`);
          setStepForm("error");
          return;
        }
        setMessageForm(`${entityName} reactivado exitosamente`);
        setStepForm("success");
      },
    }),
    [form, setMessageForm, setStepForm],
  );

  // Handlers específicos por tipo de entidad
  const handlersByTab = useMemo(
    () => ({
      colores: createHandlers(
        createNewColor,
        updateColor,
        deleteColor,
        reactivateColor,
        "Color",
      ),
      carrozados: createHandlers(
        createNewCarrozado,
        updateCarrozado,
        deleteCarrozado,
        reactivateCarrozado,
        "Carrozado",
      ),
      puertas_traseras: createHandlers(
        createNewPuertaTrasera,
        updatePuertaTrasera,
        deletePuertaTrasera,
        reactivatePuertaTrasera,
        "Puerta Trasera",
      ),
      personal: createHandlers(
        createNewPersonal,
        updatePersonal,
        deletePersonal,
        reactivatePersonal,
        "Personal",
      ),
      trabajos_chasis: createHandlers(
        createNewTipoTrabajo,
        updateTipoTrabajo,
        deleteTipoTrabajo,
        reactivateTipoTrabajo,
        "Tipo de Trabajo",
      ),
      items_control: createHandlers(
        createNewItemControl,
        updateItemControl,
        deleteItemControl,
        reactivateItemControl,
        "Item de control",
      ),
    }),
    [
      createHandlers,
      createNewCarrozado,
      updateCarrozado,
      deleteCarrozado,
      reactivateCarrozado,
      createNewColor,
      updateColor,
      deleteColor,
      reactivateColor,
      createNewPuertaTrasera,
      updatePuertaTrasera,
      deletePuertaTrasera,
      reactivatePuertaTrasera,
      createNewTipoTrabajo,
      updateTipoTrabajo,
      deleteTipoTrabajo,
      reactivateTipoTrabajo,
      createNewPersonal,
      updatePersonal,
      deletePersonal,
      reactivatePersonal,
      createNewItemControl,
      updateItemControl,
      deleteItemControl,
      reactivateItemControl,
      sectoresOptions,
    ],
  );

  const createOnOpenDetails = useCallback(
    (fieldsForm: FieldsForm[], tab: TabsTypes) => (row: any) => {
      const newForm = form;
      newForm.reset(row);
      const handlers = handlersByTab[tab];
      openModal("form", {
        component: ItemConfigModal,
        props: {
          form: newForm,
          title: `Editar ${row.nombre}`,
          fieldsForm,
          onDelete: () => handlers.onDelete(row.id),
          onReactivate: () => handlers.onReactivate(row.id),
        },
        onSubmit: form.handleSubmit(handlers.onUpdate),
      });
    },
    [form, openModal, handlersByTab],
  );

  const createOnOpenNew = useCallback(
    (fieldsForm: FieldsForm[], itemName: string, tab: TabsTypes) => () => {
      const newForm = form;
      newForm.reset(fieldsForm.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {}));
      const handlers = handlersByTab[tab];
      openModal("form", {
        component: ItemConfigModal,
        props: {
          form: newForm,
          title: `Nuevo ${itemName}`,
          fieldsForm,
        },
        onSubmit: form.handleSubmit(handlers.onCreate),
      });
    },
    [form, openModal, handlersByTab],
  );

  const fieldsByTab = useMemo<Record<TabsTypes, FieldsForm[]>>(
    () => ({
      colores: [
        {
          key: "nombre",
          label: "Nombre",
          type: "text",
          required: true,
        },
        {
          key: "tipo",
          label: "Tipo",
          type: "select",
          options: [
            { label: "Esmalte", value: "esmalte" },
            { label: "Lona", value: "lona" },
          ],
          required: true,
        },
      ],
      carrozados: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
      ],
      puertas_traseras: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
      ],
      personal: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
        {
          key: "apellido",
          label: "Apellido",
          type: "text",
          required: true,
        },
        {
          key: "sector",
          label: "Sector",
          type: "select",
          options: sectoresOptions,
          required: true,
        },
      ],
      trabajos_chasis: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
      ],
      items_control: [
        { key: "nombre", label: "Nombre", type: "text", required: true },
        {
          key: "atributo_relacionado",
          label: "Atributo relacionado",
          type: "select",
          options: atributosConMetadata,
          required: false,
        },
      ],
    }),
    [coloresEsmalteOptions, coloresLonaOptions, sectoresOptions],
  );

  const columnsByTab = useMemo<Record<TabsTypes, TableColumn<any>[]>>(
    () => ({
      colores: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
      carrozados: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
      puertas_traseras: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
      personal: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        {
          name: "Apellido",
          selector: (row: any) => row.apellido,
          sortable: true,
        },
        {
          name: "Sector",
          selector: (row: any) => (capitalize(row.sector) || "--"),
          sortable: true,
        },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
      trabajos_chasis: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
      items_control: [
        createDateColumn("Fecha de creación", "created_at"),
        { name: "Nombre", selector: (row: any) => row.nombre, sortable: true },
        {
          name: "Atributo relacionado",
          selector: (row: any) => row.atributo_relacionado,
          sortable: true,
        },
        createDateColumn("Última actualización", "updated_at"),
        {
          name: "Estado",
          selector: (row: any) => (row.active ? "Activo" : "Inactivo"),
          sortable: true,
          width: "120px",
        },
      ],
    }),
    [],
  );

  const dataByTab = useMemo<Record<TabsTypes, any[]>>(
    () => ({
      colores: colores ?? [],
      carrozados: carrozados ?? [],
      puertas_traseras: puertasTraseras ?? [],
      trabajos_chasis: trabajosChasis ?? [],
      personal: personal ?? [],
      items_control: itemsControl ?? [],
    }),
    [
      colores,
      carrozados,
      puertasTraseras,
      trabajosChasis,
      personal,
      itemsControl,
    ],
  );

  const getItemsConfig = (): ItemConfig[] => {
    if (
      !colores ||
      !carrozados ||
      !puertasTraseras ||
      !trabajosChasis ||
      !personal ||
      !itemsControl
    )
      return [];

    return TAB_ORDER.map((tab) => {
      const fields = fieldsByTab[tab];

      return {
        tab,
        name: TAB_META[tab].name,
        singularName: TAB_META[tab].singular,
        columns: columnsByTab[tab],
        data: dataByTab[tab],
        onOpenDetails: createOnOpenDetails(fields, tab),
        onOpenNew: createOnOpenNew(fields, TAB_META[tab].singular, tab),
        filterFields: toFilterFields(fields),
      };
    });
  };

  return { getItemsConfig };
}
