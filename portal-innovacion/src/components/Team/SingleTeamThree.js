import React from 'react';
import DeleteButton from "../Forms/DeleteButton"
import EditButton from '../Forms/EditButton';

const SingleTeamThree = (props) => {
  const { teamImage, authorName, designation, socialLinks = [], id, exampleEditForm, companyData, onEditSuccess} = props;

  return (
    <div className={'ed-team-item'}>
      <div className="ed-team-thumb fix">
        <img src={teamImage ? teamImage : ""} alt="" />
      </div>
      <div className="ed-team-content p-relative">
      <div className="action-buttons">
        <EditButton
          itemData={companyData}
          EditFormComponent={exampleEditForm}
          onSuccess={onEditSuccess}
        />
        <DeleteButton
          itemData={companyData}
          id={id}
        />
      </div>
        <div className="ed-team-social-box">
          <button>
            <i className="fa-light fa-share-nodes"></i>
          </button>
          <div className="ed-team-social-wrap">
            <a href={socialLinks[1]} target='_blank'>
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href={socialLinks[0]} target='_blank'>
              <i className="fa-brands fa-facebook-f"></i>
            </a>
          </div>
        </div>
        <div className="ed-team-author-box">
          <h4 className="ed-team-title">
            <span>
              {authorName ? authorName : ' '}
            </span>
          </h4>
          <span>{designation ? designation : ' '}</span>
        </div>
      </div>
    </div>
  );
};
export default SingleTeamThree;
