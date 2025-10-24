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
      title: '¿Qué ofrecemos en el consultorio?',
      description: [
        'Atención ginecológica integral: controles, seguimiento y orientación personalizada.',
        'Ambiente seguro y respetuoso, con enfoque en empatía y confidencialidad.',
        'Tecnología actual para diagnósticos y registro clínico.'
      ]
    },
    {
      icon: 'flaticon-puzzle',
      title: '¿Cómo te acompañamos?',
      description: [
        'Agendamiento de citas claro y recordatorios oportunos.',
        'Explicaciones sencillas y materiales informativos después de la consulta.',
        'Encuestas breves para medir satisfacción y mejorar continuamente.'
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
              subTitle="NUESTRA HISTORIA"
              titleClass="it-section-title-3 pb-30"
              title="DESCUBRE LOS HITOS Y LOGROS QUE MARCARON NUESTRA TRAYECTORIA"
              titleImage=""
              description="Desde su fundación, nuestro consultorio ha crecido gracias al compromiso con la atención médica personalizada y el bienestar integral de nuestros pacientes. A lo largo de los años, hemos incorporado tecnología moderna y un equipo profesional especializado que nos permite brindar una atención de calidad y confianza."
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
