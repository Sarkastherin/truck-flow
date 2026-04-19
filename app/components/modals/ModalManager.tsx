import { useModal } from "~/context/ModalContext";
import { Modal } from "./ModalBase";
import { Alert, Button } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { LuCheckCheck, LuBan } from "react-icons/lu";
import { Spinner } from "flowbite-react";
import {
  useFormState,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
export type ModalType =
  | "custom"
  | "form"
  | "confirmation"
  | "success"
  | "error"
  | "loading"
  | "info";

function FormModalContent({
  formProps,
  stepForm,
  messageForm,
  closeModal,
}: {
  formProps: any;
  stepForm: "form" | "success" | "error";
  messageForm: string | null;
  closeModal: () => void;
}) {
  const FormComponent = formProps.component;
  const form = formProps.props?.form as UseFormReturn<FieldValues> | undefined;
  const { isSubmitting } = useFormState({ control: form?.control });

  if (!FormComponent) {
    return null;
  }
  return (
    <Modal
      open={true}
      title={formProps.props.title}
      size={formProps.props.size || "md"}
      footer={
        <>
          {stepForm === "form" && (
            <div className="flex justify-between items-center w-full">
              <div className="text-xs text-gray-500 dark:text-gray-300">
                Los campos marcados con <span className="text-red-600">*</span>{" "}
                son obligatorios
              </div>
              <Button
                color={"indigo"}
                onClick={formProps.onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}
          {stepForm === "success" && (
            <Button className="ms-auto" color={"green"} onClick={formProps.onCloseCustom || closeModal}>
              Aceptar
            </Button>
          )}
          {stepForm === "error" && (
            <Button className="ms-auto" color={"red"} onClick={closeModal}>
              Cerrar
            </Button>
          )}
        </>
      }
    >
      {stepForm === "form" && (
        <form onSubmit={formProps.onSubmit} className="flex flex-col gap-4">
          <FormComponent {...formProps} />
        </form>
      )}
      <div>
        {stepForm === "success" && (
          <Alert color="success">
            <span>{messageForm || "¡Operación realizada con éxito!"}</span>
          </Alert>
        )}
        {stepForm === "error" && (
          <Alert color="failure">
            <span>
              {messageForm || "Ha ocurrido un error. Inténtalo de nuevo."}
            </span>
          </Alert>
        )}
      </div>
    </Modal>
  );
}

export default function ModalManager() {
  const { modal, messageForm, closeModal, stepForm } = useModal();
  if (!modal.type) return null;
  switch (modal.type) {
    case "custom": {
      const customProps = modal.props || {};
      const CustomComponent = customProps.component;
      if (!CustomComponent) return null;
      return (
        <Modal open={true} title={customProps.title} size={customProps.size || "md"}>
          <CustomComponent {...customProps} />
        </Modal>
      );
    }
    case "form": {
      const formProps = modal.props || {};
      return (
        <FormModalContent
          formProps={formProps}
          stepForm={stepForm}
          messageForm={messageForm}
          closeModal={closeModal}
        />
      );
    }
    case "confirmation": {
      const confirmationProps = modal.props || {};
      const confirmationModalProps = confirmationProps.props || {};
      return (
        <>
          <Modal
            open={true}
            size="md"
            title={confirmationModalProps.title}
          >
            <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                {confirmationModalProps.message}
              </h3>
              <div className="flex justify-center gap-4">
                <Button color="yellow" onClick={confirmationModalProps.onConfirm}>
                  {confirmationModalProps.confirmText || "Sí, estoy seguro"}
                </Button>
                <Button
                  color="alternative"
                  onClick={confirmationModalProps.onCancel || closeModal}
                >
                  {confirmationModalProps.cancelText || "No, cancelar"}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      );
    }
    case "success": {
      const successProps = modal.props?.props || {};
      return (
        <Modal open={true} size="md" title={successProps.title}>
          <div className="text-center">
            <LuCheckCheck className="mx-auto mb-4 h-14 w-14 text-green-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              {successProps.message ||
                messageForm ||
                "¡Operación realizada con éxito!"}
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                color="green"
                onClick={() => {
                  successProps.onClose?.();
                  closeModal();
                }}
              >
                Aceptar
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
    case "error": {
      const errorProps = modal.props?.props || {};
      return (
        <Modal open={true} size="md" title={errorProps.title}>
          <div className="text-center">
            <LuBan className="mx-auto mb-4 h-14 w-14 text-red-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              {errorProps.message ||
                messageForm ||
                "Ha ocurrido un error. Inténtalo de nuevo."}
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="red" onClick={closeModal}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
    case "loading": {
      const loadingProps = modal.props?.props || {};
      return (
        <Modal open={true} size="md" title={loadingProps.title}>
          <div className="text-center">
            <Spinner size="xl" light={true} className="mx-auto mb-4" />
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              {loadingProps.message || messageForm || "Cargando..."}
            </h3>
          </div>
        </Modal>
      );
    }
    case "info": {
      const infoProps = modal.props?.props || {};
      return (
        <Modal open={true} size="md" title={infoProps.title}>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-blue-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              {infoProps.message || messageForm || "Información"}
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="blue" onClick={closeModal}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      );
    }

    default:
      return null;
  }
}
