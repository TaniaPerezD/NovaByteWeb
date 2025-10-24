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
              subTitle="Formar profesionales competentes que sobresalen por proporcionar soluciones eficaces a procesos de gestión, innovación y tecnología demostrando serio compromiso con la excelencia y sólidos valores, y contribuyendo al desarrollo y competitividad de organizaciones nacionales e internacionales."
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
              subTitle="Formar profesionales competentes que sobresalen por proporcionar soluciones eficaces a procesos de gestión, innovación y tecnología demostrando serio compromiso con la excelencia y sólidos valores, y contribuyendo al desarrollo y competitividad de organizaciones nacionales e internacionales."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Career;
