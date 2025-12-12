import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = (props) => {
  const { itemClass, title, subTitle } = props;

  // Obtener rol del usuario logueado
  const usuario = JSON.parse(localStorage.getItem("nb-user"));
  const rol = usuario?.rol; // paciente, medico, medicoAdmin

  // Determinar ruta según el rol
  const getHomeRoute = () => {
    switch (rol) {
      case "paciente":
        return "/paciente";
      case "medico":
        return "/medico";
      case "medicoAdmin":
        return "/medico-admin";
      default:
        return "/";
    }
  };

  return (
    <div
      className={
        itemClass
          ? itemClass
          : 'it-breadcrumb-area fix it-breadcrumb-bg p-relative'
      }
    >
      <div className="container">
        <div className="row ">
          <div className="col-md-12">
            <div className="it-breadcrumb-content z-index-3 text-center">
              <div className="it-breadcrumb-title-box">
                <h3 className="it-breadcrumb-title">
                  {title ? title : 'about us'}
                </h3>
              </div>
              <div className="it-breadcrumb-list-wrap">
                <div className="it-breadcrumb-list">
                  <span>
                    <Link to={getHomeRoute()}>
                      Página principal
                    </Link>
                  </span>

                  <span className="dvdr px-2">/</span>

                  <span>
                    {subTitle ? subTitle : title ? title : 'about us'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;