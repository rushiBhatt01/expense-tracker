import { SignedIn, SignedOut } from "@clerk/clerk-react";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import GroupDashboard from "./pages/GroupDashboard";

function App() {
  // Simple custom router-less routing (AD-1)
  const path = window.location.pathname;
  const groupMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)$/);
  const groupId = groupMatch ? groupMatch[1] : null;

  return (
    <>
      <SignedIn>
        {groupId ? (
          <GroupDashboard groupId={groupId} />
        ) : (
          <Dashboard />
        )}
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

export default App;