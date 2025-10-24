import React, { useState } from 'react';
import EnterpriseCard from './EnterpriseCard';
import InternshipsList from './InternshipsList';

const Listado = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleViewOpportunities = (companyId) => {
    const company = companies.find((c) => c.id === companyId);
    setSelectedCompany(company);
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
  };

  return (
    <div className="companies-with-internships">
      {!selectedCompany ? (
        <>
          {/* <h3 className="companies-with-internships__message">
            Busca oportunidades en cualquiera de nuestras empresas aliadas.
          </h3> */}
          <div className="companies-list">
            {companies.map((company) => (
              <EnterpriseCard
                key={company._id}
                logo={company.logo}
                name={company.name}
                companyData={company}
                id={company._id} // agregar logica fuera de esto pa eliminar
                onEditSuccess={() => console.log('Edited')} //agregar logica fuera de esto pa editar
                onViewMore={() => window.location.href = company.detailsLink}
                onViewOpportunities={() => handleViewOpportunities(company.id)}
              />
            ))}
          </div>   
          
        </>
      ) : (
        <div className="internships-view">
          <h2>Pasantías en {selectedCompany.name}</h2>
          <InternshipsList internships={selectedCompany.internships} />
          <button
            className="internships-view__back-button"
            onClick={handleBackToCompanies}
          >
            Volver a Empresas
          </button>
        </div>
      )}
    </div>
  );
}; export default Listado;