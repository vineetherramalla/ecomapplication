function AdminStatCard({ label, value, helper }) {
  return (
    <div className="metric-card">
      <p className="metric-card-label">{label}</p>
      <p className="metric-card-value">{value}</p>
      {helper ? <p className="metric-card-helper">{helper}</p> : null}
    </div>
  );
}

export default AdminStatCard;
