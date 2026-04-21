import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    ...prefix("pedidos", [
      index("routes/pedidos/index.tsx"),
      route("nuevo", "routes/pedidos/nuevo.tsx"),
      layout("layouts/layoutPedido.tsx", [
        route(":pedidoId", "routes/pedidos/$pedidoId.tsx"),
        route("camion/:pedidoId", "routes/pedidos/$camionId.tsx"),
        route("carroceria/:pedidoId", "routes/pedidos/$carroceriaId.tsx"),
        route("carroceria-usada/:pedidoId", "routes/pedidos/$carroceriaUsadaId.tsx"),
        route(
          "trabajos-chasis/:pedidoId",
          "routes/pedidos/$trabajosChasisId.tsx",
        ),
        route(
          "datos-colocacion/:pedidoId",
          "routes/pedidos/$datosColocacionId.tsx",
        ),
        route(
          "ordenes-trabajo/:pedidoId",
          "routes/pedidos/$ordenesTrabajoId.tsx",
        ),
        route(
          "controles-calidad/:pedidoId",
          "routes/pedidos/$controlesCalidadId.tsx",
        ),
      ]),
    ]),
    ...prefix("configuraciones", [
      index("routes/configuraciones/index.tsx"),
      route(
        "socios-comerciales",
        "routes/configuraciones/socios-comerciales.tsx",
      ),
      route(
        "parametros-generales",
        "routes/configuraciones/parametros-generales.tsx",
      ),
      route("carrozados", "routes/configuraciones/carrozados.tsx"),
      layout("layouts/layoutConfgCarrozado.tsx", [
        route(
          "carrozados/valores-predefinidos/:carrozadoId",
          "routes/configuraciones/$valoresPredefinidosId.tsx",
        ),
        route(
          "carrozados/control-carrozado/:carrozadoId",
          "routes/configuraciones/$controlesCalidadId.tsx",
        ),
      ]),
    ]),
    ...prefix("administracion", [
      index("routes/administracion/index.tsx"),
      route(
        "cuentas-corrientes",
        "routes/administracion/cuentas-corrientes.tsx",
      ),
      route(
        "cuentas-corrientes/:socioId",
        "routes/administracion/$cuentaCorrienteId.tsx",
      ),
      route("cheques", "routes/administracion/cheques.tsx"),
      route("cheques/:chequeId", "routes/administracion/$chequeId.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
