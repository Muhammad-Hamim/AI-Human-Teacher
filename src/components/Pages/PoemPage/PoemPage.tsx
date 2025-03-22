import { poemData } from "./../../../../data/poem-data";
import PoemLearningPlatform from "./poem-learning-platform";

const PoemPage = () => {
  return (
    <div className="w-full mx-auto">
      <PoemLearningPlatform poem={poemData} />
    </div>
  );
};

export default PoemPage;
