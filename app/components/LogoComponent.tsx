export function LogoComponent({ noTheme }: { noTheme?: boolean }) {
  return (
    <div
      className={`font-logo-primary text-2xl font-bold px-2 ${noTheme ? "text-base-200" : "text-base-700"} dark:text-base-200`}
    >
      Truck
      <span
        className={`font-logo-secondary text-3xl font-bold ${noTheme ? "text-primary-400" : "text-primary-700"}  dark:text-primary-400`}
      >
        Flow
      </span>
    </div>
  );
}
