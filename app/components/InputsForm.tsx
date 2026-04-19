import {
  Label,
  TextInput,
  Select as FlowbiteSelect,
  HelperText,
  ListGroup,
  ListGroupItem,
  Textarea as FlowbiteTextarea,
  ToggleSwitch as FlowbiteToggleSwitch,
  type TextInputProps,
} from "flowbite-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  forwardRef,
  useId,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import type { IconType } from "react-icons";
import { LuIdCard, LuPhone } from "react-icons/lu";

const getNumberSeparators = (locale: string) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);

  return {
    decimalSeparator:
      parts.find((part) => part.type === "decimal")?.value || ",",
    thousandSeparator:
      parts.find((part) => part.type === "group")?.value || ".",
  };
};

type InputProps = ComponentPropsWithoutRef<typeof TextInput> & {
  label?: string;
  error?: string;
  requiredField?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    requiredField = false,
    type,
    onInput,
    inputMode,
    pattern,
    ...props
  },
  ref,
) {
  const isNumberLike = type === "number";

  const handleInput: React.InputEventHandler<HTMLInputElement> = (event) => {
    if (isNumberLike) {
      const input = event.target as HTMLInputElement;
      input.value = input.value.replace(/[^0-9]/g, "");
    }

    onInput?.(event);
  };

  return (
    <div className="w-full">
      {label && (
        <div className={`${props.sizing === "sm" ? "mb-0.5" : "mb-1"} block`}>
          <Label
            htmlFor={props.id}
            className={`${props.sizing === "sm" ? "text-xs" : ""}`}
          >
            {label} {requiredField && <span className="text-red-500">*</span>}
          </Label>
        </div>
      )}
      <TextInput
        ref={ref}
        {...props}
        type={isNumberLike ? "text" : (type ?? "text")}
        inputMode={isNumberLike ? "numeric" : inputMode}
        pattern={isNumberLike ? "[0-9]*" : pattern}
        color={error ? "failure" : "gray"}
        onInput={handleInput}
      />
      {error && (
        <HelperText className="text-red-500 dark:text-red-400">
          {error}
        </HelperText>
      )}
    </div>
  );
});

type SelectProps = Omit<
  ComponentPropsWithoutRef<typeof FlowbiteSelect>,
  "children"
> & {
  error?: string;
  label?: string;
  requiredField?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  emptyOption?: string;
  disabledEmptyOption?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      options,
      requiredField = false,
      emptyOption = "Seleccione una opción",
      disabledEmptyOption = false,
      ...props
    },
    ref,
  ) {
    return (
      <div className="w-full">
        {label && (
          <div className={`${props.sizing === "sm" ? "mb-0.5" : "mb-1"} block`}>
            <Label
              htmlFor={props.id}
              className={`${props.sizing === "sm" ? "text-xs" : ""}`}
            >
              {label} {requiredField && <span className="text-red-500">*</span>}
            </Label>
          </div>
        )}
        <FlowbiteSelect ref={ref} color={error ? "failure" : "gray"} {...props}>
          <option value="" disabled={disabledEmptyOption}>
            {emptyOption}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              hidden={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </FlowbiteSelect>
        {error && (
          <HelperText className="text-red-500 dark:text-red-400">
            {error}
          </HelperText>
        )}
      </div>
    );
  },
);

export const SelectWithSearch = <T extends { id: string; name: string }>({
  input,
  search,
  data,
  error,
  requiredField = false,
  disabled,
}: {
  input: {
    label: string;
    placeholder?: string;
    value: string;
  };
  search: {
    placeholder?: string;
  };
  data: {
    items: T[];
    onSelect: (item: T) => void;
  };
  error: string;
  requiredField?: boolean;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(input.value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    setQuery(input.value);
  }, [input.value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(input.value);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, input.value]);

  const filteredItems = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
      return data.items;
    }

    return data.items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    );
  }, [data.items, query]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [open, filteredItems.length]);

  const handleSelect = (item: T) => {
    data.onSelect(item);
    setQuery(item.name);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        Math.min(currentIndex + 1, filteredItems.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        handleSelect(filteredItems[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery(input.value);
    }
  };

  return (
    <div className="space-y-2" ref={rootRef}>
      <div className="w-full">
        <div className="mb-1 block">
          <Label>
            {input.label}{" "}
            {requiredField && <span className="text-red-500">*</span>}
          </Label>
        </div>
        <div className="relative">
          <TextInput
            type="search"
            value={query}
            placeholder={input.placeholder || search.placeholder}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
              }
            }}
            onClick={() => {
              if (!disabled) {
                setOpen(true);
              }
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!open) {
                setOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              window.setTimeout(() => {
                setQuery(input.value);
              }, 100);
            }}
            color={error ? "failure" : "gray"}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
          {open && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <ListGroup
                id={listboxId}
                className="max-h-60 overflow-y-auto p-1"
              >
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <ListGroupItem
                      key={item.id}
                      active={index === highlightedIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(item)}
                    >
                      {item.name}
                    </ListGroupItem>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Sin resultados
                  </div>
                )}
              </ListGroup>
            </div>
          )}
        </div>
      </div>
      {error && (
        <HelperText className="text-red-500 dark:text-red-400">
          {error}
        </HelperText>
      )}
    </div>
  );
};
type TextareaProps = ComponentPropsWithoutRef<typeof FlowbiteTextarea> & {
  label?: string;
  error?: string;
  requiredField?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, requiredField = false, ...props }, ref) {
    return (
      <div className="w-full">
        {label && (
          <div className="mb-1 block">
            <Label htmlFor={props.id}>
              {label} {requiredField && <span className="text-red-500">*</span>}
            </Label>
          </div>
        )}
        <FlowbiteTextarea
          ref={ref}
          {...props}
          color={error ? "failure" : "gray"}
        />
        {error && (
          <HelperText className="text-red-500 dark:text-red-400">
            {error}
          </HelperText>
        )}
      </div>
    );
  },
);
type InputGroupWithIconProps = {
  label: string;
  error?: string;
  icon: IconType;
  requiredField?: boolean;
} & ComponentPropsWithoutRef<typeof TextInput>;

export const InputGroupWithIcon = forwardRef<
  HTMLInputElement,
  InputGroupWithIconProps
>(function InputGroupWithIcon(
  {
    error,
    icon,
    requiredField = false,
    type,
    onInput,
    inputMode,
    pattern,
    ...props
  },
  ref,
) {
  const isNumberLike = type === "number";

  const handleInput: React.InputEventHandler<HTMLInputElement> = (event) => {
    if (isNumberLike) {
      const input = event.target as HTMLInputElement;
      input.value = input.value.replace(/[^0-9]/g, "");
    }

    onInput?.(event);
  };

  return (
    <div className="w-full">
      <div className={`${props.sizing === "sm" ? "mb-0.5" : "mb-1"} block`}>
        <Label htmlFor={props.id}>
          {props.label}{" "}
          {requiredField && <span className="text-red-500">*</span>}
        </Label>
      </div>
      <TextInput
        ref={ref}
        {...props}
        type={isNumberLike ? "text" : (type ?? "text")}
        inputMode={isNumberLike ? "numeric" : inputMode}
        pattern={isNumberLike ? "[0-9]*" : pattern}
        rightIcon={icon}
        color={error ? "failure" : "gray"}
        onInput={handleInput}
      />
      {error && (
        <HelperText className="text-red-500 dark:text-red-400">
          {error}
        </HelperText>
      )}
    </div>
  );
});

type MaskedInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChange" | "color" | "type"
> & {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  requiredField?: boolean;
};

export const formatCuit = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }

  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
};

export function PhoneInput({
  label,
  value,
  onChange,
  error,
  requiredField,
  ...props
}: MaskedInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const formatPhone = (phone: string): string => {
    if (!phone) return "";

    const cleaned = phone.replace(/\D/g, "");
    let workingNumber = cleaned;

    if (cleaned.startsWith("54") && cleaned.length > 11) {
      workingNumber = cleaned.substring(2);
    }

    if (workingNumber.length <= 4) {
      return workingNumber;
    }

    if (workingNumber.length <= 8) {
      return `${workingNumber.slice(0, 4)}-${workingNumber.slice(4)}`;
    }

    if (workingNumber.length <= 10) {
      const areaLength =
        workingNumber.length === 10 && workingNumber.startsWith("0") ? 3 : 2;
      return `${workingNumber.slice(0, areaLength)} ${workingNumber.slice(areaLength, areaLength + 4)}-${workingNumber.slice(areaLength + 4)}`;
    }

    return `${workingNumber.slice(0, 3)} ${workingNumber.slice(3, 5)} ${workingNumber.slice(5, 9)}-${workingNumber.slice(9)}`;
  };

  const parsePhone = (formattedValue: string): string =>
    formattedValue.replace(/\D/g, "");

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 0) return true;
    if (cleaned.length < 7) return false;
    if (cleaned.length > 15) return false;
    if (cleaned.length > 11 && !cleaned.startsWith("54")) return false;

    const phoneWithoutCountry = cleaned.startsWith("54")
      ? cleaned.substring(2)
      : cleaned;

    return phoneWithoutCountry.length >= 7 && phoneWithoutCountry.length <= 13;
  };

  useEffect(() => {
    if (value !== undefined && !isFocused) {
      setDisplayValue(formatPhone(String(value)));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (/^[\d\s\-\(\)\+]*$/.test(inputValue) || inputValue === "") {
      const cleanedValue = parsePhone(inputValue);

      if (cleanedValue.length <= 15) {
        setDisplayValue(formatPhone(cleanedValue));
        onChange(cleanedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (displayValue) {
      const cleanedValue = parsePhone(displayValue);
      setDisplayValue(formatPhone(cleanedValue));
      onChange(cleanedValue);
      return;
    }

    setDisplayValue("");
    onChange("");
  };

  const cleanedValue = parsePhone(displayValue);
  const isValidPhone = validatePhone(cleanedValue);

  let errorMessage = error;
  if (cleanedValue && !isValidPhone) {
    if (cleanedValue.length < 7) {
      errorMessage = "El teléfono debe tener al menos 7 dígitos";
    } else if (cleanedValue.length > 15) {
      errorMessage = "El teléfono no puede tener más de 15 dígitos";
    } else {
      errorMessage = "Formato de teléfono no válido";
    }
  }

  return (
    <InputGroupWithIcon
      {...props}
      label={label}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      error={errorMessage}
      requiredField={requiredField}
      placeholder={props.placeholder || "Ej: 011 1234-5678"}
      icon={LuPhone}
    />
  );
}

export function CuitInput({
  label,
  value,
  onChange,
  error,
  requiredField,
  ...props
}: MaskedInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const parseCuit = (formattedValue: string): string =>
    formattedValue.replace(/\D/g, "");

  const validateCuit = (cuit: string): boolean => {
    const cleaned = cuit.replace(/\D/g, "");
    if (cleaned.length !== 11) return false;

    const sequence = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = cleaned.split("").map(Number);
    const checkDigit = digits[10];

    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * sequence[i];
    }

    const remainder = sum % 11;
    const calculatedDigit = remainder < 2 ? remainder : 11 - remainder;

    return calculatedDigit === checkDigit;
  };

  useEffect(() => {
    if (value !== undefined && !isFocused) {
      setDisplayValue(formatCuit(String(value)));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (/^[\d-]*$/.test(inputValue) || inputValue === "") {
      const cleanedValue = parseCuit(inputValue);

      if (cleanedValue.length <= 11) {
        setDisplayValue(formatCuit(cleanedValue));
        onChange(cleanedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (displayValue) {
      const cleanedValue = parseCuit(displayValue);
      setDisplayValue(formatCuit(cleanedValue));
      onChange(cleanedValue);
      return;
    }

    setDisplayValue("");
    onChange("");
  };

  const cleanedValue = parseCuit(displayValue);
  const isValidLength = cleanedValue.length === 11;
  const isValidCuit = isValidLength && validateCuit(cleanedValue);

  let errorMessage = error;
  if (cleanedValue.length > 0) {
    if (cleanedValue.length < 11) {
      errorMessage = "El CUIT/CUIL debe tener 11 dígitos";
    } else if (!isValidCuit) {
      errorMessage = "El CUIT/CUIL no es válido";
    }
  }

  return (
    <InputGroupWithIcon
      {...props}
      label={label}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      error={errorMessage}
      requiredField={requiredField}
      placeholder={props.placeholder || "Ej: 20-22173992-3"}
      icon={LuIdCard}
    />
  );
}

type CurrencyInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  TextInputProps,
  "name" | "value" | "defaultValue" | "onChange" | "type" | "color"
> & {
  label: string;
  name: TName;
  control: Control<TFieldValues>;
  error?: string;
  requiredField?: boolean;
  rules?: RegisterOptions<TFieldValues, TName>;
  currencySymbol?: string;
  locale?: string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  icon?: IconType;
};

export function CurrencyInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  label,
  name,
  control,
  error,
  requiredField = false,
  rules,
  currencySymbol = "$",
  locale = "es-AR",
  decimalScale = 2,
  fixedDecimalScale = true,
  allowNegative = false,
  icon,
  id,
  ...props
}: CurrencyInputProps<TFieldValues, TName>) {
  const inputId = id || String(name);
  const { decimalSeparator, thousandSeparator } = getNumberSeparators(locale);

  return (
    <div className="w-full">
      <div className={`${props.sizing === "sm" ? "mb-0.5" : "mb-1"} block`}>
        <Label
          htmlFor={inputId}
          className={`${props.sizing === "sm" ? "text-xs" : ""}`}
        >
          {label} {requiredField && <span className="text-red-500">*</span>}
        </Label>
      </div>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <NumericFormat
            {...props}
            customInput={TextInput}
            id={inputId}
            name={field.name}
            value={typeof field.value === "number" ? field.value : ""}
            getInputRef={field.ref}
            onBlur={field.onBlur}
            onValueChange={({ floatValue }) => {
              field.onChange(floatValue);
            }}
            thousandSeparator={thousandSeparator}
            decimalSeparator={decimalSeparator}
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={allowNegative}
            prefix={currencySymbol ? `${currencySymbol} ` : undefined}
            inputMode="decimal"
            color={error ? "failure" : "gray"}
            rightIcon={icon}
          />
        )}
      />
      {error && (
        <HelperText className="text-red-500 dark:text-red-400">
          {error}
        </HelperText>
      )}
    </div>
  );
}

type InputNumberIconProps = {
  label: string;
  error?: string;
  icon: IconType;
  requiredField?: boolean;
} & Omit<TextInputProps, "type" | "color">;

export const InputNumberIcon = forwardRef<
  HTMLInputElement,
  InputNumberIconProps
>(function InputNumberIcon(
  { error, icon, requiredField = false, ...props },
  ref,
) {
  const handleInput: NonNullable<TextInputProps["onInput"]> = (event) => {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, "");

    props.onInput?.(event);
  };
  return (
    <InputGroupWithIcon
      ref={ref}
      {...props}
      label={props.label}
      type="number"
      error={error}
      icon={icon}
      requiredField={requiredField}
      onInput={handleInput}
    />
  );
});
export function ToggleSwitch({
  label,
  value,
  onCustumChange,
  ...props
}: {
  label: string;
  value?: boolean;
  onCustumChange?: (value: boolean) => void;
} & Omit<
  ComponentProps<typeof FlowbiteToggleSwitch>,
  "checked" | "onChange" | "value"
>) {
  const [checked, setChecked] = useState(value || false);

  useEffect(() => {
    setChecked(value || false);
  }, [value]);

  return (
    <FlowbiteToggleSwitch
      {...props}
      checked={checked}
      label={label}
      onChange={() => {
        const newValue = !checked;
        setChecked(newValue);
        onCustumChange?.(newValue);
      }}
    />
  );
}
