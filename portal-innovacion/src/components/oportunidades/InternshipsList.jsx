import React from 'react';
import { Link } from 'react-router-dom';

const InternshipCard = ({ internshipImage, position, date, detailsLink }) => {
  return (
    <div className="internship-card">
      <div className="internship-card__image">
        <img
          src={internshipImage}
          alt={`Internship for ${position}`}
        />
      </div>
      <div className="internship-card__content">
        <h4 className="internship-card__position">{position}</h4>
        <p className="internship-card__date">{date}</p>
        <Link className="internship-card__button" to={detailsLink}>
          Ver más
        </Link>
      </div>
    </div>
  );
};

const InternshipsList = ({ internships }) => {
  return (
    <div className="internships-list">
      {internships.map((internship, index) => (
        <InternshipCard
          key={index}
          internshipImage={internship.image}
          position={internship.position}
          date={internship.date}
          detailsLink={internship.detailsLink}
        />
      ))}
    </div>
  );
}; export default InternshipsList;