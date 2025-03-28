import { poemData as defaultPoemData } from "./../../../../data/poem-data";
import PoemLearningPlatform from "./poem-learning-platform";
import { useLocation } from "react-router-dom";

const PoemPage = () => {
  const location = useLocation();
  // Use the poem data from navigation state if available, otherwise use default data
  const poemData = location.state?.poem || defaultPoemData;

  return (
    <div className="w-full mx-auto">
      <PoemLearningPlatform poem={poemData} />
    </div>
  );
};

export default PoemPage;
