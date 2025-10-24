import React from 'react';

import Image from '../../assets/img/career/thumb-1.png';
import shapeImg from '../../assets/img/career/shape-1.png';

const SingleCareerTwo = (props) => {
  const { subTitle, itemClass, subTitleImg, title, careerImage} =
    props;

  return (
    <div
      className={
        itemClass ? itemClass : 'it-career-item theme-bg p-relative fix'
      }
    >
      <div className="it-career-content">
        <span className="it-section-subtitle-5 sky">
          <img src={subTitleImg ? subTitleImg : ""} alt="" />
        </span>
        <h1>{title}</h1>
        <p>{subTitle}</p>
      </div>
      <div className="it-career-thumb">
        <img src={careerImage ? careerImage : Image} alt="" />
      </div>
      <div className="it-career-shape-1">
        <img src={shapeImg} alt="" />
      </div>
    </div>
  );
};
export default SingleCareerTwo;
