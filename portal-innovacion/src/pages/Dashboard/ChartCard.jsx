const ChartCard = ({ title, children, fullWidth = false }) => (
  <div className={`chart-card ${fullWidth ? 'chart-card--full' : ''}`}>
    <h3 className="chart-card_title">{title}</h3>
    <div className="chart-card_content">
      {children}
    </div>
  </div>
); export default ChartCard;