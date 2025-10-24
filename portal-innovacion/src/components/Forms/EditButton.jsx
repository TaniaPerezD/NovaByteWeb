import React, { useState } from 'react';
import Modal from './Modal';
import { ReactComponent as EditIcon } from '../../assets/img/iconos/edit.svg';

const EditButton = ({ itemData, EditFormComponent, id }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  return (
    <>
      <button className="btn btn-edit" onClick={toggleModal}>
        <span className="icon-placeholder">
            <EditIcon />
        </span>
      </button>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={toggleModal}>
          <EditFormComponent
            initialFormData={itemData}
            onSuccess={() => {
              toggleModal();
            }}
          />
        </Modal>
      )}
    </>
  );
}; export default EditButton;