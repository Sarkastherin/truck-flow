import { createTheme } from "flowbite-react";

export const flowbiteTheme = createTheme({
  button: {
    color: {
      violet:
        "bg-violet-500 text-white hover:bg-violet-600 focus:ring-violet-300 dark:bg-violet-500 dark:hover:bg-violet-600 dark:focus:ring-violet-800",
      pdf: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800",
      orange:
        "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-800",
    },
    outlineColor: {
      violet:
        "border border-violet-600 text-violet-600 hover:border-violet-700 hover:bg-violet-700 hover:text-white focus:ring-violet-300 dark:border-violet-500 dark:text-violet-400 dark:hover:border-violet-600 dark:hover:bg-violet-600 dark:hover:text-white dark:focus:ring-violet-800",
      orange:
        "border border-orange-500 text-orange-600 hover:border-orange-600 hover:bg-orange-600 hover:text-white focus:ring-orange-300 dark:border-orange-500 dark:text-orange-400 dark:hover:border-orange-500 dark:hover:bg-orange-600 dark:hover:text-white dark:focus:ring-orange-800",
    },
  },
  textInput: {
    field: {
      input: {
        colors: {
          gray: "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-violet-500 dark:focus:ring-violet-500",
        },
      },
    },
  },
  select: {
    field: {
      select: {
        colors: {
          gray: "border-gray-300 bg-gray-50 text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-violet-500 dark:focus:ring-violet-500",
        },
      },
    },
  },
  textarea: {
    colors: {
      gray: "border-gray-300 bg-gray-50 text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-violet-500 dark:focus:ring-violet-500",
    },
  },
  listGroup: {
    item: {
      link: {
        active: {
          off: "hover:bg-violet-50 hover:text-violet-700 focus:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:hover:bg-violet-600/20 dark:hover:text-violet-200 dark:focus:text-violet-200 dark:focus:ring-violet-500",
          on: "bg-violet-600 text-white dark:bg-violet-600",
        },
      },
    },
  },
});
