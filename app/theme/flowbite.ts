import { createTheme } from "flowbite-react";

export const flowbiteTheme = createTheme({
  avatar: {
    root: {
      color: {
        "primary": "ring-primary-500 dark:ring-primary-600",
      }
    }
  },
  textInput: {
    field: {
      input: {
        colors: {
          gray: "border-base-300 bg-base-50 text-base-900 placeholder-base-500 focus:border-primary-500 focus:ring-primary-500 dark:border-base-600 dark:bg-base-700 dark:text-white dark:placeholder-base-400 dark:focus:border-primary-500 dark:focus:ring-primary-500",
        },
      },
    },
  },
  select: {
    field: {
      select: {
        colors: {
          gray: "border-base-300 bg-base-50 text-base-900 focus:border-primary-500 focus:ring-primary-500 dark:border-base-600 dark:bg-base-700 dark:text-white dark:placeholder-base-400 dark:focus:border-primary-500 dark:focus:ring-primary-500",
        },
      },
    },
  },
  textarea: {
    colors: {
      gray: "border-base-300 bg-base-50 text-base-900 focus:border-primary-500 focus:ring-primary-500 dark:border-base-600 dark:bg-base-700 dark:text-white dark:placeholder-base-400 dark:focus:border-primary-500 dark:focus:ring-primary-500",
    },
  },
  listGroup: {
    item: {
      link: {
        active: {
          off: "hover:bg-primary-50 hover:text-primary-700 focus:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-base-600 dark:hover:bg-primary-600/20 dark:hover:text-primary-200 dark:focus:text-primary-200 dark:focus:ring-primary-500",
          on: "bg-primary-600 text-white dark:bg-primary-600",
        },
      },
    },
  },
  toast: {
    root: {
      base: "border border-red-500"
    }
  },
  button: {
    color: {
      orange: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-600"
    },
    outlineColor: {
      orange: "border border-orange-500 text-orange-500 hover:border-orange-600 hover:bg-orange-600 hover:text-white focus:ring-orange-300 dark:border-orange-600 dark:text-orange-400 dark:hover:border-orange-500 dark:hover:bg-orange-500 dark:hover:text-white dark:focus:ring-orange-600"
    }
  }
});
