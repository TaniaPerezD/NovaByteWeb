import React from 'react';

const ButtonWithArrow = ({ text, onClick }) => {
  return (
    <button className="button-with-arrow" onClick={onClick}>
      <span className="text">{text}</span>
      <span className="arrow">➔</span>
    </button>
  );
};

export default ButtonWithArrow