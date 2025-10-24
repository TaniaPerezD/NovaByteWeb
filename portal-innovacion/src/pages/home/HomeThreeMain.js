import React from 'react';
import About from './AboutSection';
import Blog from './BlogSection';
import Career from './CareerSection';
import Category from './CategorySection';
import Event from './EventSection';
import Banner from './HomeThreeBanner';
import Testimonial from './TestimonialSection';
import Video from './VideoSection';
import SideBarMenu from '../../components/SideBarMenu';

const HomeMain = () => {
  return (
    <main>
      <Banner />
      <SideBarMenu
        sections={[
          "Misión y Visión",
          "Nuestra Historia",
          "Nuestros Servicios y ventajas",
          "Testimonios",
          "Noticias",
        ]}
      />
      <div id="mision-y-vision">
        <Career />
      </div>
      <div id="nuestra-historia">
        <About />
      </div>
      <div id="nuestros-servicios-y-ventajas">
        <Category />
      </div>  
      <div id="testimonios">
        <Testimonial />
      </div>
      <div id="noticias">
        <Event />
      </div>
  </main>
  );
};
export default HomeMain;
