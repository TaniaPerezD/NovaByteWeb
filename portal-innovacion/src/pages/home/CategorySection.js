import React from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../../components/SectionTitle';
import SingleCategoryTwo from '../../components/Category/SingleCategoryTwo';

import titleImg from '../../assets/img/category/title.svg';
import iconImg1 from '../../assets/img/category/cate1.png';
import iconImg2 from '../../assets/img/category/cate2.png';
import iconImg3 from '../../assets/img/category/cate3.png';
import iconImg4 from '../../assets/img/category/cate4.png';

const Category = () => {
  return (
    <div className="it-category-4-area p-relative pt-120 pb-90">
      <div className="container">
        {/* =====================
            SECCIÓN 1: DESCRIPCIÓN / SERVICIOS
           ===================== */}
        <div className="it-category-4-title-wrap mb-60">
          <div className="row align-items-end">
            <div className="col-xl-6 col-lg-6 col-md-6">
              <SectionTitle
                itemClass="it-category-4-title-box"
                subTitleClass="it-section-subtitle-5 purple-2"
                subTitle="SERVICIOS"
                titleClass="it-section-title-3"
                title="¿QUÉ OFRECEMOS?"
                titleImage={titleImg}
              />
            </div>
            <div className="col-xl-6 col-lg-6 col-md-6">
              <div className="it-category-4-btn-box text-start text-md-end pt-25">
                <Link className="ed-btn-square purple-2" to="/servicios">
                  VER TODOS LOS SERVICIOS
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row row-cols-xl-4 row-cols-lg-3 row-cols-md-3 row-cols-sm-2 row-cols-1">
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".3s"
          >
            <SingleCategoryTwo
              iconImage={iconImg1}
              title="Gestión de Citas"
              subTitle="Agenda, reprogramación y confirmaciones"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".4s"
          >
            <SingleCategoryTwo
              iconImage={iconImg2}
              title="Consultas y Seguimiento"
              subTitle="Registro de consulta y seguimiento básico"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".5s"
          >
            <SingleCategoryTwo
              iconImage={iconImg3}
              title="Encuestas de Satisfacción"
              subTitle="Evaluación post-consulta y retroalimentación"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".6s"
          >
            <SingleCategoryTwo
              iconImage={iconImg4}
              title="Dashboard y Reportes"
              subTitle="Indicadores clave para decisiones clínicas"
            />
          </div>
        </div>

        {/* =====================
            SECCIÓN 2: VENTAJAS COMPETITIVAS
           ===================== */}
        <div className="it-category-4-title-wrap mb-60">
          <div className="row align-items-end">
            <div className="col-xl-6 col-lg-6 col-md-6">
              <SectionTitle
                itemClass="it-category-4-title-box"
                subTitleClass="it-section-subtitle-5 purple-2"
                subTitle="VENTAJAS COMPETITIVAS"
                titleClass="it-section-title-3"
                title="¿POR QUÉ ELEGIRNOS?"
                titleImage={titleImg}
              />
            </div>
          </div>
        </div>

        <div className="row row-cols-xl-4 row-cols-lg-3 row-cols-md-3 row-cols-sm-2 row-cols-1">
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".3s"
          >
            <SingleCategoryTwo
              iconImage={iconImg1}
              title="Atención centrada en la paciente"
              subTitle="Empatía, claridad y acompañamiento"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".4s"
          >
            <SingleCategoryTwo
              iconImage={iconImg2}
              title="Tecnología y seguridad"
              subTitle="Datos en la nube con buenas prácticas"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".5s"
          >
            <SingleCategoryTwo
              iconImage={iconImg3}
              title="Rapidez y recordatorios"
              subTitle="Menos ausencias, mejor organización"
            />
          </div>
          <div
            className="col mb-30 wow animate__fadeInUp"
            data-wow-duration=".9s"
            data-wow-delay=".6s"
          >
            <SingleCategoryTwo
              iconImage={iconImg4}
              title="Escalable e integrable"
              subTitle="Listo para crecer con tu consultorio"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Category;
