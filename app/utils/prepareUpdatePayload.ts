export type DirtyMap<T> = T extends readonly (infer Item)[]
  ? Array<DirtyMap<Item> | boolean | undefined>
  : T extends object
    ? Partial<{ readonly [Key in keyof T]: DirtyMap<T[Key]> | boolean }>
    : boolean;

type Props<T extends { id: number | string }> = {
  dirtyFields: DirtyMap<T>;
  formData: T;
};

export const prepareUpdatePayload = <T extends { id: number | string }>({
  dirtyFields,
  formData,
}: Props<T>) => {
  const updatePayload = buildDirtyPayload(dirtyFields, formData);

  return (updatePayload ?? {}) as Partial<T>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const buildDirtyPayload = <T>(
  dirtyFields: DirtyMap<T> | boolean | undefined,
  formData: T,
): unknown | undefined => {
  if (dirtyFields === true) {
    return formData;
  }

  if (!dirtyFields) {
    return undefined;
  }

  if (Array.isArray(dirtyFields) && Array.isArray(formData)) {
    const arrayPayload = dirtyFields.reduce<unknown[]>((accumulator, item, index) => {
      const itemPayload = buildDirtyPayload(item, formData[index]);

      if (itemPayload !== undefined) {
        accumulator.push(itemPayload);
      }

      return accumulator;
    }, []);

    return arrayPayload.length > 0 ? arrayPayload : undefined;
  }

  if (isRecord(dirtyFields) && isRecord(formData)) {
    const objectPayload = Object.entries(dirtyFields).reduce<Record<string, unknown>>(
      (accumulator, [key, value]) => {
        const fieldPayload = buildDirtyPayload(
          value as DirtyMap<T[keyof T]> | boolean | undefined,
          formData[key as keyof T],
        );

        if (fieldPayload !== undefined) {
          accumulator[key] = fieldPayload;
        }

        return accumulator;
      },
      {},
    );

    if (Object.keys(objectPayload).length === 0) {
      return undefined;
    }

    if ("id" in formData && !("id" in objectPayload)) {
      objectPayload.id = formData.id;
    }

    return objectPayload;
  }

  return undefined;
};
