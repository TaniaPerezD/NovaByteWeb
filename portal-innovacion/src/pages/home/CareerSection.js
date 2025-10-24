import React from 'react';
import SingleCareerTwo from '../../components/Career/SingleCareerTwo';

const Career = () => {
  return (
    <div className="it-career-area ed-career-style-2 p-relative pb-100 pt-120">
      <div className="container">
        <div className="row">
          <div
            className="col-xl-6 col-lg-6 mb-30 wow animate__fadeInLeft"
            data-wow-duration=".9s"
            data-wow-delay=".5s"
          >
            <SingleCareerTwo
              itemClass="it-career-item theme-bg p-relative fix"
              careerImage=" "
              title="MISIÓN"
              subTitle="Brindar atención ginecológica integral y personalizada, basada en la empatía y el respeto, utilizando tecnología médica avanzada para promover la salud y el bienestar femenino en todas las etapas de la vida."
            />
          </div>
          <div
            className="col-xl-6 col-lg-6 mb-30 wow animate__fadeInRight"
            data-wow-duration=".9s"
            data-wow-delay=".7s"
          >
            <SingleCareerTwo
              itemClass="it-career-item theme-bg p-relative fix"
              careerImage=" "
              title="VISIÓN"
              subTitle="Ser un consultorio ginecológico moderno y referente en innovación médica, reconocido por su compromiso con la salud femenina, la excelencia en el servicio y la promoción de una atención integral y humana."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Career;
