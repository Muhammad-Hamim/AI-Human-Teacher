import { Route, Routes } from "react-router";
import Dashboard from "./components/Layout/Dashboard";
import AskAi from "./components/Pages/AskAi/AskAi";
import PoemPage from "./components/Pages/PoemPage/PoemPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        {/* The index route could be for a "welcome" or new chat screen */}
        <Route index element={<AskAi />} />
        {/* Dynamic chat route */}
        <Route path="/ask/:chatId" element={<AskAi />} />
      <Route path="/poem" element={<PoemPage />} />
      </Route>
    </Routes>
  );
};

export default App;
