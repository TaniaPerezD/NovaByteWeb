import React from 'react';
import SectionTitle from '../../components/SectionTitle';
import SingleEvent from '../../components/Event';

import shapeImg1 from '../../assets/img/event/ed-shape-3-1.png';
import shapeImg2 from '../../assets/img/event/ed-shape-3-2.png';
import titleImg from '../../assets/img/category/title.svg';

import eventImg1 from '../../assets/img/event/event1.jpg';
import eventImg2 from '../../assets/img/event/event2.jpg';
import eventImg3 from '../../assets/img/event/event3.jpg';

const Event = () => {
  return (
    <div
      id="actualizaciones"
      className="it-event-2-area it-event-style-4 p-relative z-index pt-115 fix pb-70 grey-bg"
    >
      <div className="ed-event-shape-1">
        <img src={shapeImg1} alt="" />
      </div>
      <div className="ed-event-shape-2">
        <img src={shapeImg2} alt="" />
      </div>
      <div className="container">
        <div className="it-event-2-title-wrap mb-60">
          <div className="row align-items-end">
            <div className="col-12">
              <SectionTitle
                itemClass="it-event-2-title-box text-center"
                subTitleClass="it-section-subtitle-5 purple-2"
                subTitle="ACTUALIZACIONES RECIENTES"
                titleClass="it-section-title-3"
                title="NOVEDADES, OFERTAS Y PROMOCIONES"
                titleImage={titleImg}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div
            className="col-xl-4 col-lg-4 col-md-6 mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".3s"
          >
            <SingleEvent
              eventImage={eventImg1}
              eventDate="05"
              eventMonth="Octubre"
              title="Descuento 20% en Chequeo Preventivo"
            />
          </div>
          <div
            className="col-xl-4 col-lg-4 col-md-6 mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".5s"
          >
            <SingleEvent
              eventImage={eventImg2}
              eventDate="12"
              eventMonth="Noviembre"
              title="Promoción Mamografía 2x1 (cupos limitados)"
            />
          </div>
          <div
            className="col-xl-4 col-lg-4 col-md-6 mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".7s"
          >
            <SingleEvent
              eventImage={eventImg3}
              eventDate="19"
              eventMonth="Diciembre"
              title="Nueva Guía de Autocuidado y Prevención"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Event;
