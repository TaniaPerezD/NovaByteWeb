import React from 'react';
// import { Link } from 'react-router-dom';
import SectionTitle from '../../components/SectionTitle';

import shapeImg1 from '../../assets/img/about/about-3-shap-1.png';
import shapeImg2 from '../../assets/img/about/ed-shape-3-1.png';
import aboutImg1 from '../../assets/img/about/thumb-4-1.jpg';
import aboutImg2 from '../../assets/img/about/thumb-4-2.jpg';

const About = () => {
  const items = [
    {
      icon: 'flaticon-video-1',
      title: 'Beneficios de estudiar esta carrera en la U.C.B.',
      description: [
        'Podrás desempeñarte en varios ámbitos gerenciales, proyectos de desarrollo, inteligencia de negocios, tecnología y sistemas de información empresarial y más.',
        'Tendrás la oportunidad de generar emprendimientos propios y soluciones empresariales innovadoras ante problemas y necesidades de la sociedad de nuestro país.'
      ]
    },
    {
      icon: 'flaticon-puzzle',
      title: '¿Dónde podrás trabajar?',
      description: [
        'En instituciones del sector financiero: Banca, Seguros, SAFIS.',
        'En empresas industriales de todos los rubros, en las áreas de operaciones, tecnología y gestión.',
        'Desarrollando su propio emprendimiento, a través de planes de negocio.',
        'Consultoría a todo tipo de empresas que requieren incluir a la innovación en su gestión empresarial.'
      ]
    },
  ];
  return (
    <div
      id="it-about"
      className="it-about-3-area it-about-4-style p-relative grey-bg pt-120 pb-120"
    >
      <div className="ed-about-3-shape-2">
        <img src={shapeImg1} alt="" />
      </div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-xl-6 col-lg-6">
            <div className="ed-about-3-thumb-wrap p-relative">
              <div className="ed-about-3-shape-1 d-none d-md-block">
                <img src={shapeImg2} alt="" />
              </div>
              <div className="ed-about-3-thumb">
                <img src={aboutImg1} alt="" />
              </div>
              <div className="ed-about-3-thumb-sm">
                <img src={aboutImg2} alt="" />
              </div>
            </div>
          </div>
          <div className="col-xl-6 col-lg-6">
            <SectionTitle
              itemClass="it-about-3-title-box"
              subTitleClass="it-section-subtitle-5 purple-2"
              subTitle="ACERCA DE NUESTRA CARRERA"
              titleClass="it-section-title-3 pb-30"
              title="IDENTIFICA SOLUCIONES EMPRESARIALES Y ENCUENTRA OPORTUNIDADES DE NEGOCIO"
              titleImage=""
              description=" "
            />

            <div className="it-about-3-mv-box">
              <div className="row">
                {items.map((item, index) => (
                  <div key={index} className="col-xl-12">
                    <div className="it-about-4-list-wrap d-flex align-items-start">
                      <div className="it-about-4-list-icon">
                        <span>
                          <i className={item.icon}></i>
                        </span>
                      </div>
                      <div className="it-about-3-mv-item">
                        <span className="it-about-3-mv-title">
                          {item.title}
                        </span>
                        <div>
                          {item.description.map((item, index) =>
                            <p key={index}>• {item}</p>
                          ) 
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;
