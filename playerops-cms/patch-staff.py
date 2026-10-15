from pathlib import Path

path = Path("src/app/page.tsx")
s = path.read_text()
original = s

def patch(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(
            f"Patch stopped at '{label}': expected 1 match, found {n}. "
            "No page changes were written."
        )
    s = s.replace(old, new, 1)

patch(
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

patch(
'''  const [players, setPlayers] = useState(initialPlayers);
  const [activePage, setActivePage] = useState("Overview");''',
'''  const [players, setPlayers] = useState(initialPlayers);
  const [role, setRole] = useState<"Admin" | "Staff">("Admin");
  const [activePage, setActivePage] = useState("Overview");

  const visiblePlayers = useMemo(
    () => role === "Admin"
      ? players
      : players.filter((p) => p.staff === "Sarah Chen"),
    [players, role]
  );''',
"role state"
)

patch(
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
"staff metrics and player filtering"
)

patch(
'''    const player = players.find((p) => p.id === (playerId ?? selectedId));
    const id = player?.id ?? players[0]?.id;''',
'''    const player = visiblePlayers.find((p) => p.id === (playerId ?? selectedId));
    const id = player?.id ?? visiblePlayers[0]?.id;''',
"call selection"
)

patch(
'''          {navGroups.map((group) => (''',
'''          {(role === "Admin" ? navGroups : staffNavGroups).map((group) => (''',
"role-specific sidebar"
)

patch(
'''          <div className="user-details"><strong>Workspace Admin</strong><span>Demo administrator</span></div>''',
'''          <div className="user-details">
            <strong>{role === "Admin" ? "Workspace Admin" : "Sarah Chen"}</strong>
            <span>{role === "Admin" ? "Demo administrator" : "Demo staff member"}</span>
          </div>''',
"sidebar identity"
)

patch(
'''          <div className="top-actions">
            <label className="global-search">''',
'''          <div className="top-actions">
            <label className="role-preview">
              <span>Preview</span>
              <select
                aria-label="Preview role"
                value={role}
                onChange={(e) => {
                  const next = e.target.value as "Admin" | "Staff";
                  setRole(next);
                  setActivePage("Overview");
                  setSearch("");
                  setFilterStatus("All statuses");
                  setSelectedId(next === "Staff" ? "PLY-1023" : initialPlayers[0].id);
                  setMobileOpen(false);
                }}
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </label>
            <label className="global-search">''',
"role selector"
)

patch(
'''<div className="top-user"><div className="user-avatar">AD</div><ChevronDown size={15} /></div>''',
'''<div className="top-user"><div className="user-avatar">{role === "Admin" ? "AD" : "SC"}</div><ChevronDown size={15} /></div>''',
"top account avatar"
)

patch(
'''<h1>{activePage === "Overview" ? "Good morning, Admin" : activePage}</h1>''',
'''<h1>{activePage === "Overview"
                ? role === "Admin" ? "Good morning, Admin" : "Welcome back, Sarah"
                : activePage}</h1>''',
"role-specific greeting"
)

patch(
'''{ title: "Total players", value: counts.total.toLocaleString(), foot: "Registered in demo", icon: Users, tone: "blue" },''',
'''{ title: role === "Admin" ? "Total players" : "My assigned players", value: counts.total.toLocaleString(), foot: role === "Admin" ? "Registered in demo" : "Assigned to you", icon: Users, tone: "blue" },''',
"player metric title"
)

patch(
'''{players.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}''',
'''{visiblePlayers.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}''',
"call dialog options"
)

path.write_text(s)
print("Staff UI patch applied successfully.")
