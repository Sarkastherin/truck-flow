import {
  Modal as FlowbiteModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { useModal } from "~/context/ModalContext";
import { MdClose } from "react-icons/md";

export function Modal({
  open,
  title,
  size,
  children,
  footer,
}: {
  open: boolean;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { closeModal } = useModal();
  return (
    <>
      <FlowbiteModal
        show={open}
        onClose={closeModal}
        className="relative"
        size={size}
      >
        {title ? (
          <>
            <ModalHeader className="border-gray-400">{title}</ModalHeader>
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-2 right-2 rounded-full p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none dark:text-slate-500 dark:hover:bg-red-800/30 dark:hover:text-red-400 cursor-pointer"
              aria-label="Close"
            >
              <MdClose size={20} />
            </button>
          </>
        ) : (
          null
        )}

        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </FlowbiteModal>
    </>
  );
}
