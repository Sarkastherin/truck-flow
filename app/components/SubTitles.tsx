import { RiArrowGoBackFill } from "react-icons/ri";
import { NavLink } from "react-router";
import type { IconType } from "react-icons";

export const SubTitles = ({
  title,
  back_path,
  icon,
}: {
  title: string;
  back_path?: string;
  icon?: { component: IconType; color?: string };
}) => {
  return (
    <div className="flex items-center gap-2 mb-4  text-[1.4em]">
      {back_path && (
        <NavLink
          to={back_path}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
          title="Volver"
        >
          <RiArrowGoBackFill className="text-gray-600 dark:text-gray-400" />
        </NavLink>
      )}
      <div className="flex gap-2 items-center ">
        <h2 className="font-semibold">
          {title}
        </h2>
        {icon && <icon.component className={`${icon.color}`} />}
      </div>
    </div>
  );
};
