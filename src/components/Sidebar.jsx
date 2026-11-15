function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logo-icon">L</div>
        <span>Lumora</span>
      </div>

      <nav className="sidebar-nav">

        <a
          href="#"
          className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Dashboard");
          }}
        >
          <span>⌂</span>
          Dashboard
        </a>

        <a
          href="#"
          className={`nav-item ${activePage === "Analytics" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Analytics");
          }}
        >
          <span>↗</span>
          Analytics
        </a>

        <a
          href="#"
          className={`nav-item ${activePage === "Transactions" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Transactions");
          }}
        >
          <span>↔</span>
          Transactions
        </a>

        <a
          href="#"
          className={`nav-item ${activePage === "Goals" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Goals");
          }}
        >
          <span>♡</span>
          Goals
        </a>

      </nav>

      <div className="sidebar-bottom">

        <a
          href="#"
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Settings");
          }}
        >
          <span>⚙</span>
          Settings
        </a>

        <div className="profile">
          <div className="profile-avatar">
            C
          </div>

          <div>
            <strong>Chelsi</strong>
            <small>Personal account</small>
          </div>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;