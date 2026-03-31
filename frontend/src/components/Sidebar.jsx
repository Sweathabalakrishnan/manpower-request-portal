import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">INFONET HRD</div>
      <nav className="nav-menu">
        <NavLink to="/" className="nav-item">Home</NavLink>
        {/* <NavLink to="/requests/new" className="nav-item">New Request</NavLink> */}
      </nav>
    </aside>
  );
}