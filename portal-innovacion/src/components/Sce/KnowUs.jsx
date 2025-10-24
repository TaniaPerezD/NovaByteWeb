const KnowUs = ({ title, subtitle, paragraph, image }) => {
    return (
        <div className="know-us">
            <h1 className="know-us__title">{title}</h1>
            <div className="know-us__content">
                <img className="know-us__image" src={image} alt="Know Us" />
                <div className="know-us__text">
                    <h3 className="know-us__subtitle">{subtitle}</h3>
                    <p className="know-us__paragraph">{paragraph}</p>
                </div>
            </div>
        </div>
    );
};export default KnowUs;