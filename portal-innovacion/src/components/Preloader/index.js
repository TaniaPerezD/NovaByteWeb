import React from 'react';

import Icon from '../../assets/img/logo/pencil.png';

const Preloader = () => {
  return (
    <div id="it-loading">
      <div id="it-loading-center">
        <div id="it-loading-absolute">
          <div className="it-loading-content">
            <div className="it-loading-stroke">
              <img className="it-loading-icon" src={Icon} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Preloader;
