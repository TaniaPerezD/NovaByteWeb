import React from 'react';

import shapeImg from '../../assets/img/career/shape-1.png';

const SingleCareerTwo = (props) => {
  const { subTitle, itemClass, title } = props;

  return (
    <div
      className={
        itemClass ? itemClass : 'it-career-item theme-bg p-relative fix'
      }
    >
      <div className="it-career-content">
        <h1>{title}</h1>
        <p>{subTitle}</p>
      </div>
      <div className="it-career-shape-1">
        <img src={shapeImg} alt="" />
      </div>
    </div>
  );
};
export default SingleCareerTwo;
