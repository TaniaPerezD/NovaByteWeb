import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import SingleTestimonialTwo from '../../components/Testimonial/SingleTestimonialTwo';

import testimonialBG from '../../assets/img/testimonial/back1.png';
import testimonialBG2 from '../../assets/img/testimonial/back2.png';
import testimonialImg from '../../assets/img/testimonial/paciente.jpg';
import shapeImg from '../../assets/img/testimonial/shape-3-1.png';
import quoteImg from '../../assets/img/testimonial/quot.png';
import avatarImg1 from '../../assets/img/avatar/avatar-3-1.png';
import avatarImg2 from '../../assets/img/avatar/avatar-2.png';
import avatarImg3 from '../../assets/img/avatar/avatar-1.png';

const Testimonial = () => {
  const sliderOption = {
    speed: 500,
    loop: true,
    slidesPerView: '1',
    spaceBetween: 30,
    autoplay: {
      delay: 3000,
    },
    centeredSlides: true,
    roundLengths: true,
    pagination: {
      el: '.test-slider-dots',
      clickable: true,
    },
  };
  return (
    <div
      className="it-testimonial-3-area fix"
      style={{ backgroundImage: `url(${testimonialBG})` }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-xl-5 col-lg-4 d-none d-lg-block">
            <div className="it-testimonial-3-thumb">
              <img src={testimonialImg} alt="" />
            </div>
          </div>
          <div className="col-xl-7 col-lg-8">
            <div className="it-testimonial-3-box z-index p-relative">
              <div className="it-testimonial-3-shape-1">
                <img src={shapeImg} alt="" />
              </div>
              <div
                className="it-testimonial-3-wrapper p-relative"
                style={{ backgroundImage: `url(${testimonialBG2})` }}
              >
                <div className="it-testimonial-3-quote d-none d-md-block">
                  <img src={quoteImg} alt="" />
                </div>
                <div className="swiper-container ">
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    {...sliderOption}
                    className="swiper-wrapper it-testimonial-3-active"
                  >
                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg2}
                        authorName="María Fernández"
                        description="Mi experiencia en el consultorio fue excelente. La doctora me explicó todo con mucha paciencia y me hizo sentir muy cómoda durante la consulta. Es un lugar donde realmente se preocupan por tu bienestar."
                        designation="Paciente"
                      />
                    </SwiperSlide>
                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg3}
                        authorName="Andrea López"
                        description="Tenía mucha ansiedad antes de mi revisión, pero la atención fue tan amable que me sentí tranquila de inmediato. Además, el sistema para agendar citas es muy fácil y rápido."
                        designation="Paciente"
                      />
                    </SwiperSlide>
                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg2}
                        authorName="Lucía Gutiérrez"
                        description="Agradezco la atención tan profesional y humana que recibí. Me gustó que me explicaran cada detalle y que el seguimiento posterior fuera tan completo."
                        designation="Paciente"
                      />
                    </SwiperSlide>

                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg3}
                        authorName="Sofía Villarroel"
                        description="Sin duda recomendaría este consultorio. Desde que llegas te atienden con amabilidad y todo el proceso, desde la cita hasta los resultados, es muy organizado."
                        designation="Paciente"
                      />
                    </SwiperSlide>
                  </Swiper>
                </div>
                <div className="test-slider-dots d-none d-sm-block"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Testimonial;
