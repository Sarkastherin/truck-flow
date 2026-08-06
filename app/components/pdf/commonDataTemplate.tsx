import { View } from "@react-pdf/renderer";
import type { Pedido } from "~/types/pedido";
import { Subtitle, Box, Row, Cell, TitleBox } from "./pdfComponents";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";

export const DatosPedido = ({
  pedidoData,
  responsable,
  title_responsable,
}: {
  pedidoData?: Pedido;
  responsable: string;
  title_responsable:
    | "Armador"
    | "Pintor"
    | "Montajista"
    | "Responsable de Control";
}) => (
  <View>
    <Subtitle>Datos del Pedido</Subtitle>
    <Box>
      <Row>
        <Cell
          title="Número de Pedido"
          value={pedidoData?.numero_pedido}
          isFirst
        />
        <Cell
          title="Fecha de Pedido"
          value={formatDateUStoES(pedidoData?.fecha_pedido)}
        />
      </Row>
      <Row isLast>
        <Cell
          title="Cliente"
          value={pedidoData?.cliente.razon_social}
          isFirst
        />
        <Cell title={title_responsable} value={responsable} />
      </Row>
    </Box>
  </View>
);
export const DatosCarroceria = ({
  pedidoData,
  responsable,
  carrozadoNombre,
  puertaTraseraNombre,
  colorCarrozadoNombre,
  colorZocaloNombre,
  colorLonaNombre,
}: {
  pedidoData?: Pedido;
  responsable: string;
  carrozadoNombre: string;
  puertaTraseraNombre: string;
  colorCarrozadoNombre: string;
  colorZocaloNombre: string;
  colorLonaNombre: string;
}) => (
  <View>
    <Subtitle>Datos de la Carrocería</Subtitle>
    <View style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Box>
        <Row>
          <Cell
            title="Tipo de Carrocería"
            value={carrozadoNombre || "—"}
            isFirst
            flex={4}
          />
        </Row>
        <Row>
          <Cell
            title="Largo Int."
            value={pedidoData?.carroceria?.largo_int}
            unit="mm"
            isFirst
          />
          <Cell
            title="Largo Ext."
            value={pedidoData?.carroceria?.largo_ext}
            unit="mm"
          />
          <Cell title="Alto" value={pedidoData?.carroceria?.alto} unit="mm" />
          <Cell
            title="Ancho Ext."
            value={pedidoData?.carroceria?.ancho_ext}
            unit="mm"
          />
        </Row>
        <Row>
          <Cell
            title="Puerta Trasera"
            value={puertaTraseraNombre || "—"}
            isFirst
          />
          <Cell
            title="Altura baranda"
            value={pedidoData?.carroceria?.alt_baranda}
            unit="mm"
          />
        </Row>
        <Row isLast>
          <Cell
            title="Color de Carrozado"
            value={colorCarrozadoNombre || "—"}
            isFirst
          />
          <Cell title="Color de Zócalo" value={colorZocaloNombre || "—"} />
          <Cell title="Color de Lona" value={colorLonaNombre || "—"} />
          <Cell title="Armador" value={responsable || "—"} />
        </Row>
      </Box>
    </View>
  </View>
);
export const DatosCamion = ({
  pedidoData,
  convertToCM,
}: {
  pedidoData?: Pedido;
  convertToCM?: boolean;
}) => (
  <View>
    <Subtitle>Datos del Camión</Subtitle>
    <Box>
      <Row>
        <Cell
          title="Marca"
          value={pedidoData?.camion?.marca.toLocaleUpperCase()}
          isFirst
        />
        <Cell title="Modelo" value={pedidoData?.camion?.modelo} />
        <Cell
          title="Centro Eje"
          value={pedidoData?.camion?.centro_eje}
          convertToCM={convertToCM}
          unit="mm"
        />
      </Row>
      <Row isLast>
        <Cell
          title="Tipo de larguero"
          value={pedidoData?.camion?.tipo_larguero?.toLocaleUpperCase()}
          isFirst
        />
        <Cell
          title="Medida Larguero"
          value={pedidoData?.camion?.med_larguero}
          unit="mm"
          convertToCM={convertToCM}
        />

        <Cell
          title="Voladizo Trasero"
          value={pedidoData?.camion?.voladizo_trasero}
          convertToCM={convertToCM}
          unit="mm"
        />
      </Row>
    </Box>
  </View>
);
export const DatosColor = ({
  pedidoData,
  colorCarrozadoNombre,
  colorZocaloNombre,
  colorLonaNombre,
}: {
  pedidoData?: Pedido;
  colorCarrozadoNombre: string;
  colorZocaloNombre: string;
  colorLonaNombre: string;
}) => (
  <Box>
    <TitleBox title="Colores de Carrozado" />
    <Row>
      <Cell title="Carrozado" value={colorCarrozadoNombre || "—"} isFirst />
      <Cell title="Zócalo" value={colorZocaloNombre || "—"} />
      <Cell title="Lona" value={colorLonaNombre || "—"} />
    </Row>
    <Row isLast>
      <Cell
        title="Observaciones"
        value={pedidoData?.carroceria?.notas_color || "—"}
        isFirst
      />
    </Row>
  </Box>
);
