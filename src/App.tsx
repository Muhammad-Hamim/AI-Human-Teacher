import { Route, Routes } from "react-router";
import Dashboard from "./components/Layout/Dashboard";
import AskAi from "./components/Pages/AskAi/AskAi";
import PoemPage from "./components/Pages/PoemPage/PoemPage";
import PoemStorytellingPage from "./components/Pages/PoemStorytellingVideo/PoemStorytellingPage";
import GenerateInteractivePoem from "./components/Pages/generateInteractivePoem/GenerateInteractivePoem";
import PoemCollection from "./components/Pages/generateInteractivePoem/PoemCollection";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        {/* The index route could be for a "welcome" or new chat screen */}
        <Route index element={<AskAi />} />
        {/* Dynamic chat route */}
        <Route path="/ask/:chatId" element={<AskAi />} />
        <Route path="/poem" element={<PoemPage />} />
        <Route path="/poem-storytelling" element={<PoemStorytellingPage />} />
        <Route
          path="/generate-interactive-poem"
          element={<GenerateInteractivePoem />}
        />
        <Route
          path="/poem-collection"
          element={<PoemCollection />}
        />
      </Route>
    </Routes>
  );
};

export default App;
