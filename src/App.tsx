import { Route, Routes } from "react-router";
import Dashboard from "./components/Layout/Dashboard";
import AskAi from "./components/Pages/AskAi/AskAi";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        {/* The index route could be for a "welcome" or new chat screen */}
        <Route index element={<AskAi />} />
        {/* Dynamic chat route */}
        <Route path=":chatId" element={<AskAi />} />
      </Route>
    </Routes>
  );
};

export default App;
