import React from 'react';
import { Link } from 'react-router-dom';

// import breadcrumbBG from '../../assets/img/breadcrumb/breadcrumb.jpg';

const Breadcrumb = (props) => {
  const { itemClass, title, subTitle } = props;
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
                    <Link to="/">Página principal</Link>
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
