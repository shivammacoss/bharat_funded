export default function LandingShell({ children }) {
  return (
    <div className="landing-page min-h-screen bg-white" style={{ overflowX: 'hidden' }}>
      {children}
    </div>
  );
}
