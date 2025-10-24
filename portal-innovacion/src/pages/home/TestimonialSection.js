import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import SingleTestimonialTwo from '../../components/Testimonial/SingleTestimonialTwo';

import testimonialBG from '../../assets/img/testimonial/bg-2.png';
import testimonialBG2 from '../../assets/img/testimonial/bg-4.png';
import testimonialImg from '../../assets/img/testimonial/biblioteca.jpg';
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
                        authorAvatar={avatarImg1}
                        authorName="Fabián Sánchez"
                        description="Estudiar esta increíble carrera me ha motivado a superarme, me ha enseñado que la mayor fuente de 
                        creatividad es la necesidad y que siempre hay soluciones. Ha despertado una pasión de transformar los negocios 
                        para un bien mayor. Me ha dado herramientas de liderazgo llevándome a trabajar en rubros tan diferentes con toda 
                        la preparación necesaria para hacer cosas extraordinarias."
                        designation="Estudiante"
                      />
                    </SwiperSlide>
                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg2}
                        authorName="Laura Arellano"
                        description="La mejor manera de describir mi experiencia en la carrera de Ingeniería en Innovación Empresarial (IIE) es que ha sido estimulante y valiosa. El ambiente académico 
                        exige lo mejor de mí, ayudándome a desarrollar todo mi potencial, me siento acompañada en cada paso. Superado mis expectativas, brindándome no solo formación profesional, sino 
                        también relaciones gratificantes con compañeros y docentes que han sido un impulso en mi crecimiento personal y profesional."
                        designation="Estudiante"
                      />
                    </SwiperSlide>
                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg3}
                        authorName="Dharel Gómez"
                        description="Estar en la UCB ha sido una experiencia transformadora. A través de mi carrera en Ingeniería en Innovación Empresarial, he comenzado a explorar un camino universitario 
                        lleno de posibilidades y desafíos, que me impulsan a alcanzar mi máximo potencial. Este entorno me ayudó a desarrollar ingenio y a mantener siempre la mirada hacia nuevas metas. 
                        Es así, como mi carrera despertó en mí un gusto por lo inusual e innovador, haciendo la diferencia en un mundo inusual.
"
                        designation="Software Developer"
                      />
                    </SwiperSlide>

                    <SwiperSlide className="swiper-slide">
                      <SingleTestimonialTwo
                        authorAvatar={avatarImg1}
                        authorName="Valentino Luna"
                        description="La carrera de ingeniería en innovación empresarial me enseño muchas cosas, a descubrir habilidades de las cuales nunca hubiera tenido idea de que me gustaban, 
                        al abarcar la parte tecnológica me gusto poder unir lo administrativo con lo tecnológico y crear una nueva visión y a no ser de mente cerrada, al final el premio son las 
                        personas que conoces durante esta etapa."
                        designation="Estudiante"
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
