import React from "react";
import { Document, View } from "@react-pdf/renderer";
import type { Pedido } from "~/types/pedido";
import {
  Subtitle,
  Box,
  Row,
  Cell,
  TitleBox,
  PageTemplate,
  HeaderTemplate,
  FooterTemplate,
} from "./pdfComponents";
import { DatosPedido, DatosCamion, DatosColor } from "./commonDataTemplate";

interface OrdenPinturaProps {
  pedidoData?: Pedido;
  responsable: string;
  colorCarrozadoNombre: string;
  colorZocaloNombre: string;
  colorLonaNombre: string;
}
export const OrdenPinturaTemplate: React.FC<OrdenPinturaProps> = ({
  pedidoData,
  responsable,
  colorCarrozadoNombre,
  colorZocaloNombre,
  colorLonaNombre,
}) => (
  <Document>
    <PageTemplate>
      <HeaderTemplate title="Orden de Pintura" />
      <View style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <DatosPedido
          pedidoData={pedidoData}
          title_responsable="Pintor"
          responsable={responsable}
        />
        <DatosCamion pedidoData={pedidoData} />
        <View>
          <Subtitle>Detalles del color y acabado</Subtitle>
          <View style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <DatosColor
              pedidoData={pedidoData}
              colorCarrozadoNombre={colorCarrozadoNombre}
              colorZocaloNombre={colorZocaloNombre}
              colorLonaNombre={colorLonaNombre}
            />
            <Box>
              <Row isLast>
                <Cell
                  title="Observaciones generales"
                  value={pedidoData?.carroceria?.notas_color}
                  isFirst
                />
              </Row>
            </Box>
          </View>
        </View>
      </View>
      {/* Footer */}
      <FooterTemplate />
    </PageTemplate>
  </Document>
);
