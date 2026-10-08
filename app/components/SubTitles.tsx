import { RiArrowGoBackFill } from "react-icons/ri";
import { NavLink } from "react-router";
import type { IconType } from "react-icons";
import type { ColorsTypes } from "./TableComponentNew";
export const SubTitles = ({
  title,
  back_path,
  icon,
  color = "primary",
}: {
  title: string;
  back_path?: string;
  icon?: { component: IconType; color?: string };
  color?: ColorsTypes;
}) => {
  const textColor = `text-${color}-500 dark:text-${color}-400`;

  return (
    <div className="flex items-start gap-1 text-2xl">
      {back_path && (
        <NavLink
          to={back_path}
          className="p-2 text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 hover:bg-primary-100 dark:hover:bg-base-800 rounded-full transition-all duration-200"
          title="Volver"
        >
          <RiArrowGoBackFill className="text-base-600 dark:text-base-400 size-5" />
        </NavLink>
      )}
      <div className="flex gap-1.5 items-end">
        <h2 className={`font-semibold ${textColor}`}>{title}</h2>
        {icon && (
          <icon.component
            className={`self-center h5 w-5 ${icon.color || "text-base-600 dark:text-base-300"}`}
          />
        )}
      </div>
    </div>
  );
};