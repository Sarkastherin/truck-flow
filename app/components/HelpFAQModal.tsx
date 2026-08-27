import { useState } from "react";
import { LuChevronDown, LuBookOpen, LuWrench } from "react-icons/lu";

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections: FAQSection[] = [
  {
    title: "Solución de Problemas",
    icon: <LuWrench className="h-5 w-5" />,
    items: [
      {
        question: "Cargué un pago mal, ¿cómo lo corrijo?",
        answer:
          "Si fue efectivo, transferencia o carrocería usada: hacé clic en el movimiento en la tabla de Cuenta Corriente, y en el detalle usá el botón 'Anular este pago'. El sistema creará automáticamente una deuda para reversar el saldo. Si fue un cheque, andá a la sección Cheques, buscá el cheque y usá 'Anular' desde ahí.",
      },
      {
        question: "Un cheque que recibí no es válido",
        answer:
          "Andá a la sección Cheques, buscá el cheque en la lista, hacé clic para ver su detalle. Usá el botón 'Anular'. El cheque pasará a estado 'Anulado' y se generará una deuda automáticamente en la cuenta corriente del cliente.",
      },
      {
        question: "Necesito reducir la deuda de un cliente",
        answer:
          "Creá una 'Nota de Crédito' desde los botones de acciones en la cuenta corriente del cliente. Ingresá el monto y un concepto explicativo (ej: 'Descuento por devolución'). Esto sumará al haber del cliente, reduciendo su saldo.",
      },
      {
        question:
          "¿Cuál es la diferencia entre Nota de Crédito y Anulación de Pago?",
        answer:
          "Nota de Crédito:Reduce parcialmente la deuda sin tocar el movimiento original. Se usa para descuentos o ajustes. Anulación de Pago: Revierte completamente un pago, desactivándolo y creando una deuda. Se usa cuando el pago se cargó por error.",
      },
    ],
  },
  {
    title: "Conceptos de Cuenta Corriente",
    icon: <LuBookOpen className="h-5 w-5" />,
    items: [
      {
        question: "¿Qué es un Movimiento?",
        answer:
          "Es el registro de una transacción financiera entre la empresa y un cliente. Puede ser una deuda (lo que nos debe), un pago (lo que nos pagó) o una nota de crédito (un descuento o devolución que le hacemos).",
      },
      {
        question: "¿Qué significan Debe y Haber?",
        answer:
          "DEBE = lo que el cliente nos debe (nosotros le facturamos). HABER = lo que le creditamos al cliente (él nos pagó). Si Debe > Haber, el cliente nos debe plata. Si Haber > Debe, le debemos plata al cliente.",
      },
      {
        question: "¿Qué es el Saldo?",
        answer:
          "Es la diferencia entre Debe y Haber. Saldo positivo (en rojo) significa que el cliente nos debe. Saldo negativo (en verde) significa que le debemos. Saldo en cero significa que está todo saldado.",
      },
      {
        question: "¿Qué es una Nota de Crédito?",
        answer:
          "Es un movimiento que REDUCE la deuda del cliente. Se usa para descuentos, devoluciones parciales o ajustes. No desactiva el movimiento original, solo agrega un registro nuevo en el haber del cliente.",
      },
      {
        question: "¿Qué es la Anulación de Pago?",
        answer:
          "Es una acción que REVIERTES un pago que se cargó mal (efectivo, transferencia o carrocería usada). El sistema desactiva el pago original y crea automáticamente un movimiento de deuda para reversar el saldo. Solo disponible para pagos que no sean cheques.",
      },
      {
        question: "¿Qué es la Anulación de Cheque?",
        answer:
          "Es el proceso para revertir un cheque que se registró mal. Se hace desde la página específica del cheque (no desde el movimiento). El cheque pasa a estado 'Anulado' y se genera automáticamente una deuda por el monto del cheque.",
      },
    ],
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white text-sm">
          {item.question}
        </span>
        <LuChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-700">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function HelpFAQModal() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {faqSections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-violet-600 dark:text-violet-400">
              {section.icon}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h3>
          </div>
          <div className="space-y-2">
            {section.items.map((item) => {
              const key = `${section.title}-${item.question}`;
              return (
                <AccordionItem
                  key={key}
                  item={item}
                  isOpen={openItems.has(key)}
                  onToggle={() => toggleItem(key)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
