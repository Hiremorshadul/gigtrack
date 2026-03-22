import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkAdmin(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdmin(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
    setIsAdmin(data?.is_admin === true);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Loading screen ──
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#F5F4F0",
      fontFamily: "'DM Sans', sans-serif", color: "#9CA3AF", fontSize: 14,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div>Loading GigTrack…</div>
      </div>
    </div>
  );

  // ── Not logged in ──
  if (!user) return <Auth />;

  // ── Admin view ──
  if (isAdmin) return <Admin adminUser={user} onSignOut={handleSignOut} />;

  // ── Regular user dashboard ──
  return <Dashboard user={user} onSignOut={handleSignOut} />;
}