import { Route, Routes } from "react-router";
import Dashboard from "./components/Layout/Dashboard";
import AskAi from "./components/Pages/AskAi/AskAi";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<AskAi />} />
      </Route>
    </Routes>
  );
};

export default App;
