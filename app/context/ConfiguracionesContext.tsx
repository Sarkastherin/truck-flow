import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAllSheets,
  type SheetCellValue,
} from "~/backend/Database/apiGoogleSheets";
import {
  getDataInJSONFormat,
} from "~/backend/Database/helperTransformData";
import type {
  Carrozado,
  Color,
  PuertaTrasera,
  TipoTrabajo,
  Personal,
  ItemControl,
  ValorPredefinido,
  ControlCarrozado,
} from "~/types/Configuraciones";
import { useAuth } from "~/context/AuthContext";
import {
  getCompleteSheetRange,
  SHEET_ID_CONFIGURACIONES,
  SHEET_NAMES_CONFIGURACIONES,
} from "~/backend/Database/SheetsConfig";
import {
  type DirtyMap,
} from "~/utils/prepareUpdatePayload";
import { capitalize } from "~/utils/functions";
import { useGlobal, type CreateGlobalMethod, type CrudGlobalResponse, type BaseGlobalEntity } from "./GlobalContext";


type OptionsType = { label: string; value: string }[];

type UpdateConfigMethod<T extends BaseGlobalEntity> = (
  existingEntity: T,
  dirtyFields: DirtyMap<T>,
) => Promise<CrudGlobalResponse>;
type ToggleConfigMethod = (entityId: string) => Promise<CrudGlobalResponse>;


type ConfiguracionContextType = {
  getConfiguracionesData: () => Promise<void>;
  carrozados: Carrozado[];
  colores: Color[];
  puertasTraseras: PuertaTrasera[];
  trabajosChasis: TipoTrabajo[];
  personal: Personal[];
  itemsControl: ItemControl[];
  valoresPredefinidos: ValorPredefinido[];
  controlCarrozado: ControlCarrozado[];
  vendedoresOptions: OptionsType;
  carrozadosOptions: OptionsType;
  puertasOptions: OptionsType;
  coloresEsmalteOptions: OptionsType;
  coloresLonaOptions: OptionsType;
  trabajosChasisOptions: OptionsType;
  armadoresOptions: OptionsType;
  pintoresOptions: OptionsType;
  montadoresOptions: OptionsType;
  createNewCarrozado: CreateGlobalMethod<Carrozado>;
  updateCarrozado: UpdateConfigMethod<Carrozado>;
  deleteCarrozado: ToggleConfigMethod;
  reactivateCarrozado: ToggleConfigMethod;
  createNewColor: CreateGlobalMethod<Color>;
  updateColor: UpdateConfigMethod<Color>;
  deleteColor: ToggleConfigMethod;
  reactivateColor: ToggleConfigMethod;
  createNewPuertaTrasera: CreateGlobalMethod<PuertaTrasera>;
  updatePuertaTrasera: UpdateConfigMethod<PuertaTrasera>;
  deletePuertaTrasera: ToggleConfigMethod;
  reactivatePuertaTrasera: ToggleConfigMethod;
  createNewTipoTrabajo: CreateGlobalMethod<TipoTrabajo>;
  updateTipoTrabajo: UpdateConfigMethod<TipoTrabajo>;
  deleteTipoTrabajo: ToggleConfigMethod;
  reactivateTipoTrabajo: ToggleConfigMethod;
  createNewPersonal: CreateGlobalMethod<Personal>;
  updatePersonal: UpdateConfigMethod<Personal>;
  deletePersonal: ToggleConfigMethod;
  reactivatePersonal: ToggleConfigMethod;
  createNewItemControl: CreateGlobalMethod<ItemControl>;
  updateItemControl: UpdateConfigMethod<ItemControl>;
  deleteItemControl: ToggleConfigMethod;
  reactivateItemControl: ToggleConfigMethod;
  sectoresOptions: OptionsType;
  CUDValoresPredefinidos: (
    valoresPrefinidosData: ValorPredefinido[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
  CUDControlCarrozado: (
    controlCarrozadoData: ControlCarrozado[],
    deletedIds: string[],
  ) => Promise<CrudGlobalResponse>;
};

type HeadersType = {
  carrozados: SheetCellValue[] | null;
  colores: SheetCellValue[] | null;
  puertas_traseras: SheetCellValue[] | null;
  tipos_trabajos: SheetCellValue[] | null;
  personal: SheetCellValue[] | null;
  items_control: SheetCellValue[] | null;
  valores_predefinidos: SheetCellValue[] | null;
  control_carrozado: SheetCellValue[] | null;
};
const ConfiguracionContext = createContext<
  ConfiguracionContextType | undefined
>(undefined);
export const ConfiguracionesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { createGlobalEntityCrud, cudGlobalFieldsArrayEntities, assertReady } =
    useGlobal();
  const SHEETS = useMemo(
    () => getCompleteSheetRange(SHEET_NAMES_CONFIGURACIONES),
    [],
  );
  const { auth } = useAuth();
  const [carrozados, setCarrozados] = useState<Carrozado[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [puertasTraseras, setPuertasTraseras] = useState<PuertaTrasera[]>([]);
  const [trabajosChasis, setTrabajosChasis] = useState<TipoTrabajo[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [itemsControl, setItemsControl] = useState<ItemControl[]>([]);
  const [valoresPredefinidos, setValoresPredefinidos] = useState<
    ValorPredefinido[]
  >([]);
  const [controlCarrozado, setControlCarrozado] = useState<ControlCarrozado[]>(
    [],
  );
  const [paramsFromSheets, setParamsFromSheets] = useState<{
    headers: HeadersType;
    values: Record<string, SheetCellValue[][]>;
  } | null>(null);
  const getConfiguracionesData = useCallback(async () => {
    try {
      const { data, error } = await getAllSheets(
        SHEET_ID_CONFIGURACIONES,
        SHEETS,
      );
      if (error) {
        throw new Error(
          `Error al obtener los datos de la hoja de configuraciones: ${error.message}`,
        );
      }
      if (!data || data.length === 0) {
        console.warn("No se encontraron datos en la hoja de configuraciones.");
        return;
      }
      setParamsFromSheets({
        headers: {
          carrozados: data[0]?.[0] || null,
          colores: data[1]?.[0] || null,
          puertas_traseras: data[2]?.[0] || null,
          tipos_trabajos: data[3]?.[0] || null,
          personal: data[4]?.[0] || null,
          items_control: data[5]?.[0] || null,
          valores_predefinidos: data[6]?.[0] || null,
          control_carrozado: data[7]?.[0] || null,
        },
        values: {
          carrozados: data[0] || [],
          colores: data[1] || [],
          puertas_traseras: data[2] || [],
          tipos_trabajos: data[3] || [],
          personal: data[4] || [],
          items_control: data[5] || [],
          valores_predefinidos: data[6] || [],
          control_carrozado: data[7] || [],
        },
      });

      const carrozadosData = getDataInJSONFormat(data[0]);
      const coloresData = getDataInJSONFormat(data[1]);
      const puertasTraserasData = getDataInJSONFormat(data[2]);
      const trabajosChasisData = getDataInJSONFormat(data[3]);
      const personalData = getDataInJSONFormat(data[4]);
      const itemsControlData = getDataInJSONFormat(data[5]);
      const valoresPredefinidosData = getDataInJSONFormat(data[6]);
      const controlCarrozadoData = getDataInJSONFormat(data[7]);

      setCarrozados(carrozadosData as Carrozado[]);
      setColores(
        coloresData.sort((a, b) => {
          const colorA = a as Color;
          const colorB = b as Color;
          return colorA.nombre.localeCompare(colorB.nombre);
        }) as Color[]
      );
      setPuertasTraseras(puertasTraserasData as PuertaTrasera[]);
      setTrabajosChasis(trabajosChasisData as TipoTrabajo[]);
      setPersonal(personalData as Personal[]);
      setItemsControl(itemsControlData as ItemControl[]);
      setValoresPredefinidos(valoresPredefinidosData as ValorPredefinido[]);
      const combinedControlCarrozado = controlCarrozadoData.map((control) => {
        const itemControl = itemsControlData.find(
          (item) => item.id === control.item_control_id,
        );
        return {
          ...control,
          item_control: itemControl ? (itemControl as ItemControl) : [],
        };
      });
      setControlCarrozado(combinedControlCarrozado as ControlCarrozado[]);
    } catch (error) {
      console.error("Error fetching orders data:", error);
      return;
    }
  }, []);
  const vendedoresOptions = useMemo(() => {
    const vendedores = personal.filter(
      (persona) => persona.sector === "ventas" && persona.active,
    );
    return vendedores.map((persona) => ({
      label: `${persona.nombre} ${persona.apellido}`,
      value: persona.id,
    }));
  }, [personal]);

  const armadoresOptions = useMemo(() => {
    const armadores = personal.filter(
      (persona) => persona.sector === "fabricacion" && persona.active,
    );
    return armadores.map((persona) => ({
      label: `${persona.nombre} ${persona.apellido}`,
      value: persona.id,
    }));
  }, [personal]);
  const pintoresOptions = useMemo(() => {
    const pintores = personal.filter((persona) => persona.sector === "pintura" && persona.active);
    return pintores.map((persona) => ({
      label: `${persona.nombre} ${persona.apellido}`,
      value: persona.id,
    }));
  }, [personal]);
  const montadoresOptions = useMemo(() => {
    const montadores = personal.filter(
      (persona) => persona.sector === "montaje" && persona.active,
    );
    return montadores.map((persona) => ({
      label: `${persona.nombre} ${persona.apellido}`,
      value: persona.id,
    }));
  }, [personal]);

  const carrozadosOptions = useMemo(() => {
    return carrozados.filter((carrozado) => carrozado.active).map((carrozado) => ({
      label: carrozado.nombre,
      value: carrozado.id,
    }));
  }, [carrozados]);
  const puertasOptions = useMemo(() => {
    return puertasTraseras.filter((puerta) => puerta.active).map((puerta) => ({
      label: puerta.nombre,
      value: puerta.id,
    }));
  }, [puertasTraseras]);
  const coloresEsmalteOptions = useMemo(() => {
    const coloresEsmalte = colores.filter((color) => color.tipo === "esmalte" && color.active);
    return coloresEsmalte.map((color) => ({
      label: color.nombre,
      value: color.id,
    }));
  }, [colores]);
  const coloresLonaOptions = useMemo(() => {
    const coloresLona = colores.filter((color) => color.tipo === "lona" && color.active);
    return coloresLona.map((color) => ({
      label: color.nombre,
      value: color.id,
    }));
  }, [colores]);
  const trabajosChasisOptions = useMemo(() => {
    return trabajosChasis.filter((trabajo) => trabajo.active).map((trabajo) => ({
      label: trabajo.nombre,
      value: trabajo.id,
    }));
  }, [trabajosChasis]);
  const sectoresOptions = useMemo(() => {
    const sectores = Array.from(
      new Set(personal.filter((persona) => persona.active).map((persona) => persona.sector)),
    );
    return sectores.map((sector) => ({
      label: capitalize(sector),
      value: sector,
    }));
  }, [personal]);
  useEffect(() => {
    if (auth) {
      void getConfiguracionesData();
    }
  }, [auth, getConfiguracionesData]);

  const {
    create: createNewCarrozado,
    update: updateCarrozado,
    remove: deleteCarrozado,
    reactivate: reactivateCarrozado,
  } = createGlobalEntityCrud<Carrozado>(
    "carrozados",
    "carrozado",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.carrozados,
    getConfiguracionesData,
  );
  const {
    create: createNewColor,
    update: updateColor,
    remove: deleteColor,
    reactivate: reactivateColor,
  } = createGlobalEntityCrud<Color>(
    "colores",
    "color",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.colores,
    getConfiguracionesData,
  );
  const {
    create: createNewPuertaTrasera,
    update: updatePuertaTrasera,
    remove: deletePuertaTrasera,
    reactivate: reactivatePuertaTrasera,
  } = createGlobalEntityCrud<PuertaTrasera>(
    "puertas_traseras",
    "puerta trasera",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.puertas_traseras,
    getConfiguracionesData,
  );
  const {
    create: createNewTipoTrabajo,
    update: updateTipoTrabajo,
    remove: deleteTipoTrabajo,
    reactivate: reactivateTipoTrabajo,
  } = createGlobalEntityCrud<TipoTrabajo>(
    "tipos_trabajos",
    "tipo de trabajo",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.tipos_trabajos,
    getConfiguracionesData,
  );
  const {
    create: createNewPersonal,
    update: updatePersonal,
    remove: deletePersonal,
    reactivate: reactivatePersonal,
  } = createGlobalEntityCrud<Personal>(
    "personal",
    "personal",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.personal,
    getConfiguracionesData,
  );
  const {
    create: createNewItemControl,
    update: updateItemControl,
    remove: deleteItemControl,
    reactivate: reactivateItemControl,
  } = createGlobalEntityCrud<ItemControl>(
    "items_control",
    "item de control",
    paramsFromSheets,
    SHEET_ID_CONFIGURACIONES,
    SHEET_NAMES_CONFIGURACIONES.items_control,
    getConfiguracionesData,
  );
  const CUDValoresPredefinidos = useCallback(
    async (
      valoresPredefinidosData: ValorPredefinido[],
      deletedIds: string[],
    ) => {
      return cudGlobalFieldsArrayEntities({
        entities: valoresPredefinidosData,
        deletedIds,
        sheetKey: "valores_predefinidos",
        entityLabel: "valores predefinidos",
        paramsFromSheets,
        sheetId: SHEET_ID_CONFIGURACIONES,
        sheetName: SHEET_NAMES_CONFIGURACIONES.valores_predefinidos,
        successMessage: "Valores predefinidos actualizados exitosamente",
        onGetData: getConfiguracionesData,
      });
    },
    [cudGlobalFieldsArrayEntities, paramsFromSheets, getConfiguracionesData],
  );
  const CUDControlCarrozado = useCallback(
    async (controlCarrozadoData: ControlCarrozado[], deletedIds: string[]) => {
      return cudGlobalFieldsArrayEntities({
        entities: controlCarrozadoData,
        deletedIds,
        sheetKey: "control_carrozado",
        entityLabel: "controles de carrozado",
        paramsFromSheets,
        sheetId: SHEET_ID_CONFIGURACIONES,
        sheetName: SHEET_NAMES_CONFIGURACIONES.control_carrozado,
        successMessage: "Controles de carrozado actualizados exitosamente",
        onGetData: getConfiguracionesData,
      });
    },
    [paramsFromSheets, cudGlobalFieldsArrayEntities, getConfiguracionesData],
  );
  return (
    <ConfiguracionContext.Provider
      value={{
        getConfiguracionesData,
        carrozados,
        colores,
        puertasTraseras,
        trabajosChasis,
        personal,
        itemsControl,
        valoresPredefinidos,
        controlCarrozado,
        vendedoresOptions,
        carrozadosOptions,
        puertasOptions,
        coloresEsmalteOptions,
        coloresLonaOptions,
        trabajosChasisOptions,
        armadoresOptions,
        pintoresOptions,
        montadoresOptions,
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
        CUDValoresPredefinidos,
        CUDControlCarrozado,
      }}
    >
      {children}
    </ConfiguracionContext.Provider>
  );
};
export const useConfiguracion = () => {
  const context = useContext(ConfiguracionContext);
  if (context === undefined) {
    throw new Error(
      "useConfiguracion must be used within an ConfiguracionesProvider",
    );
  }
  return context;
};
