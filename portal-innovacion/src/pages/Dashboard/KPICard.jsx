const KPICard = ({ icon: Icon, title, value, subtitle, colorClass = "rose" }) => (
  <div className={`kpi-card kpi-card--${colorClass}`}>
    <div className="kpi-card_icon">
      <Icon />
    </div>
    <div className="kpi-card_content">
      <p className="kpi-card_title">{title}</p>
      <p className="kpi-card_value">{value}</p>
      {subtitle && <p className="kpi-card_subtitle">{subtitle}</p>}
    </div>
  </div>
); export default KPICard;