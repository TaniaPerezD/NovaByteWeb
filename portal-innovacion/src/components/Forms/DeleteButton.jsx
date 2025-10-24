import React from 'react';
import Swal from 'sweetalert2';
import { ReactComponent as DeleteIcon } from '../../assets/img/iconos/delete.svg';
import { useDispatch } from 'react-redux';
import { borrarEmpresa } from '../../redux/empresas/thunk';

const DeleteButton = ({ id, itemData }) => {
  const dispatch = useDispatch()
  const handleDelete = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(borrarEmpresa(id))
        window.location.reload(true)
      }
    });
  };

  return (
    <button className="btn btn-delete" onClick={handleDelete}>
      <span className="icon-placeholder">
        <DeleteIcon/>
      </span>
    </button>
  );
}; export default DeleteButton;