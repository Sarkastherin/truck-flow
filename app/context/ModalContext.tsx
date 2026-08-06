import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ModalType } from "~/components/modals/ModalManager";

type ModalState = {
  type: ModalType | null;
  props?: any;
}
type StepForm = "form" | "success" | "error";

interface ModalContextType {
  modal: ModalState;
  openModal: (type: ModalType, props?: any) => void;
  closeModal: () => void;
  messageForm: string | null;
  setMessageForm: (message: string | null) => void;
  stepForm: StepForm;
  setStepForm: (step: StepForm) => void;
}
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [messageForm, setMessageForm] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState<StepForm>("form");
  const openModal = (type: ModalType, props?: any) => {
    setModal({ type, props });
  };
  const closeModal = () => {
    setModal({ type: null });
    setMessageForm(null);
    setStepForm("form");
  };
  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
        modal,
        messageForm,
        setMessageForm,
        stepForm,
        setStepForm,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
