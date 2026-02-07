import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Button } from './ui/button';
import { ReactNode } from 'react';

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hideFooter?: boolean;
}

export function FormDialog({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
  hideFooter = false,
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  const content = hideFooter ? (
    <>
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>{children}</ModalBody>
    </>
  ) : (
    <form onSubmit={handleSubmit}>
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading} className="mr-3">
          {cancelText}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : submitText}
        </Button>
      </ModalFooter>
    </form>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay />
      <ModalContent>
        {content}
      </ModalContent>
    </Modal>
  );
}
