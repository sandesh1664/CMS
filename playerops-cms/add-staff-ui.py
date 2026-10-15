from pathlib import Path

path = Path("src/app/page.tsx")
s = path.read_text()

def replace_once(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(
            f"Stopped safely: {label}: expected one match, found {count}. "
            "The page file was not written."
        )
    s = s.replace(old, new, 1)

replace_once(
'''function StatusBadge({ status }: { status: Status }) {''',
'''const staffNavGroups = [
  {
    title: "MY WORKSPACE",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Players", icon: Users },
      { label: "Call management", icon: Phone },
      { label: "Follow-ups", icon: CalendarDays },
      { label: "Call history", icon: Activity },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {''',
"staff navigation"
)

replace_once(
'''  const [players, setPlayers] = useState(initialPlayers);
  const [activePage, setActivePage] = useState("Overview");''',
'''  const [players, setPlayers] = useState(initialPlayers);
  const [role, setRole] = useState<"Admin" | "Staff">("Admin");
  const [activePage, setActivePage] = useState("Overview");

  // Demo identity for Staff preview.
  const visiblePlayers = useMemo(
    () => role === "Admin"
      ? players
      : players.filter((p) => p.staff === "Sarah Chen"),
    [players, role]
  );''',
"role state"
)

replace_once(
'''    return players.filter((p) => {
      const text = `${p.name} ${p.id} ${p.platform} ${p.staff} ${p.referral} ${p.status}`.toLowerCase();
      return text.includes(search.toLowerCase()) &&
        (filterStatus === "All statuses" || p.status === filterStatus);
    });
  }, [players, search, filterStatus]);

  const counts = useMemo(() => ({
    total: players.length,
    received: players.filter((p) => p.status === "Call Received").length,
    missed: players.filter((p) => p.status === "Call Not Received").length,
    followUp: players.filter((p) => p.status === "Follow-up Required").length,
    uninterested: players.filter((p) => p.status === "Not Interested").length,
  }), [players]);''',
'''    return visiblePlayers.filter((p) => {
      const text = `${p.name} ${p.id} ${p.platform} ${p.staff} ${p.referral} ${p.status}`.toLowerCase();
      return text.includes(search.toLowerCase()) &&
        (filterStatus === "All statuses" || p.status === filterStatus);
    });
  }, [visiblePlayers, search, filterStatus]);

  const counts = useMemo(() => ({
    total: visiblePlayers.length,
    received: visiblePlayers.filter((p) => p.status === "Call Received").length,
    missed: visiblePlayers.filter((p) => p.status === "Call Not Received").length,
    followUp: visiblePlayers.filter((p) => p.status === "Follow-up Required").length,
    uninterested: visiblePlayers.filter((p) => p.status === "Not Interested").length,
  }), [visiblePlayers]);''',
"filtered metrics"
)

replace_once(
'''    const player = players.find((p) => p.id === (playerId ?? selectedId));
    const id = player?.id ?? players[0]?.id;''',
'''    const player = visiblePlayers.find((p) => p.id === (playerId ?? selectedId));
    const id = player?.id ?? visiblePlayers[0]?.id;''',
"call selection"
)

replace_once(
'''          {navGroups.map((group) => (''',
'''          {(role === "Admin" ? navGroups : staffNavGroups).map((group) => (''',
"sidebar navigation"
)

replace_once(
'''          <div className="user-avatar">AD</div>
          <div className="user-details"><strong>Workspace Admin</strong><span>Demo administrator</span></div>
          <button className="icon-button" aria-label="Account options" onClick={() => goTo("Settings")}><ChevronDown size={16} /></button>''',
'''          <div className="user-avatar">{role === "Admin" ? "AD" : "SC"}</div>
          <div className="user-details">
            <strong>{role === "Admin" ? "Workspace Admin" : "Sarah Chen"}</strong>
            <span>{role === "Admin" ? "Demo administrator" : "Demo staff member"}</span>
          </div>
          <button className="icon-button" aria-label="Account options" onClick={() => role === "Admin" ? goTo("Settings") : notify("Staff account settings will be added later.")}><ChevronDown size={16} /></button>''',
"sidebar identity"
)

replace_once(
'''          <div className="top-actions">
            <label className="global-search">''',
'''          <div className="top-actions">
            <label className="role-preview">
              <span>Preview role</span>
              <select
                aria-label="Preview role"
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value as "Admin" | "Staff";
                  setRole(nextRole);
                  setActivePage("Overview");
                  setSearch("");
                  setFilterStatus("All statuses");
                  setSelectedId(nextRole === "Staff" ? "PLY-1023" : initialPlayers[0].id);
                  setMobileOpen(false);
                }}
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </label>
            <label className="global-search">''',
"top role switcher"
)

replace_once(
'''            <div className="top-user"><div className="user-avatar">AD</div><ChevronDown size={15} /></div>''',
'''            <div className="top-user"><div className="user-avatar">{role === "Admin" ? "AD" : "SC"}</div><ChevronDown size={15} /></div>''',
"top identity"
)

replace_once(
'''              <h1>{activePage === "Overview" ? "Good morning, Admin" : activePage}</h1>
              <p className="subtitle">
                {activePage === "Overview"
                  ? "Here’s what’s happening with your players today."
                  : `Manage and review your ${activePage.toLowerCase()} workspace.`}
              </p>''',
'''              <h1>{activePage === "Overview"
                ? role === "Admin" ? "Good morning, Admin" : "Welcome back, Sarah"
                : activePage}</h1>
              <p className="subtitle">
                {activePage === "Overview"
                  ? role === "Admin"
                    ? "Here’s what’s happening across your player operations."
                    : "Here are your assigned players, calls and follow-up tasks."
                  : `Manage and review your ${activePage.toLowerCase()} workspace.`}
              </p>''',
"welcome heading"
)

replace_once(
'''              { title: "Total players", value: counts.total.toLocaleString(), foot: "Registered in demo", icon: Users, tone: "blue" },''',
'''              { title: role === "Admin" ? "Total players" : "My assigned players", value: counts.total.toLocaleString(), foot: role === "Admin" ? "Registered in demo" : "Assigned to you", icon: Users, tone: "blue" },''',
"player metric label"
)

replace_once(
'''              <div><h2>Player records</h2><p>Search and manage your player contacts</p></div>''',
'''              <div><h2>{role === "Admin" ? "Player records" : "My assigned players"}</h2><p>{role === "Admin" ? "Search and manage player contacts across the team" : "Search and manage only the players assigned to you"}</p></div>''',
"player table heading"
)

replace_once(
'''{players.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}''',
'''{visiblePlayers.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}''',
"call dialog player options"
)

path.write_text(s)
print("Staff Workspace UI patch applied.")
