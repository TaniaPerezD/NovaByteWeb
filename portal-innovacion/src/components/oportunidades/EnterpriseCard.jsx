import React from 'react';
import DeleteButton from "../Forms/DeleteButton"
import EditButton from '../Forms/EditButton';
import ExampleEditForm from '../Forms/Formularios/EmpresasAliadasForm';

const EnterpriseCard = ({ logo, name, onViewMore, onViewOpportunities, companyData, id, onEditSuccess }) => {
  return (
    <div className="enterprise-card">
        <div className="action-buttons">
            <EditButton
            itemData={companyData}
            EditFormComponent={ExampleEditForm}
            onSuccess={onEditSuccess}
            />
            <DeleteButton
            itemData={companyData}
            id={id}
            />
        </div>
      <img src={logo} alt={`${name} logo`} className="enterprise-card__logo" />
      <h2 className="enterprise-card__name">{name}</h2>
      <div className="enterprise-card__buttons">
        <a href="https://www.mojix.com/es/" target='_blank' rel="noreferrer">
            <button className="enterprise-card__button">
                Ver más
            </button>
        </a>
        <a href="https://www.linkedin.com/" target='_blank' rel="noreferrer">
            <button className="enterprise-card__button enterprise-card__button--secondary">
                Ver oportunidades
            </button>
        </a>
        
      </div>
    </div>
  );
};

export default EnterpriseCard;
