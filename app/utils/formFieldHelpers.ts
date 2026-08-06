import type { FieldErrors, FieldValues, Path } from "react-hook-form";

export const getValueByPath = (source: unknown, path: string) => {
  return path.split(".").reduce<unknown>((currentValue, pathPart) => {
    if (
      currentValue &&
      typeof currentValue === "object" &&
      pathPart in currentValue
    ) {
      return (currentValue as Record<string, unknown>)[pathPart];
    }

    return undefined;
  }, source);
};

export const buildFieldPath = <TFieldValues extends FieldValues>(
  fieldName: string,
  namePrefix?: string,
) => {
  return (namePrefix ? `${namePrefix}.${fieldName}` : fieldName) as Path<TFieldValues>;
};

export const getFieldError = <TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  fieldPath: Path<TFieldValues>,
) => {
  return getValueByPath(errors, `${fieldPath}.message`) as string | undefined;
};