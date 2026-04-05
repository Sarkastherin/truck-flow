import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), flowbiteReact()],
  resolve: {
    alias: {
      "react-csv": "react-csv/lib/index.js",
    },
  },
  optimizeDeps: {
    include: [
      "react-icons/md",
      "react-icons/ri",
      "react-icons/ai",
      "react-icons/lu",
      "react-icons/tb",
      "react-icons/io5",
      "react-icons/fa",
      "react-icons/fi",
      "react-data-table-component",
    ],
  },
});
