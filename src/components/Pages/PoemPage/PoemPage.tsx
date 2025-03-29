import { poemData as defaultPoemData } from "./../../../../data/poem-data";
import PoemLearningPlatform from "./poem-learning-platform";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useGetPoemsQuery } from "@/redux/features/poems/poemsApi";

const PoemPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch all poems to display a selection
  const { data: poemsData } = useGetPoemsQuery();

  // Use the poem data from navigation state if available, otherwise use default data
  const poemData = location.state?.poem || defaultPoemData;

  // If the poem has an ID, redirect to the dynamic poem page
  useEffect(() => {
    if (poemData && poemData._id) {
      navigate(`/poem/${poemData._id}`, { replace: true });
    }
  }, [poemData, navigate]);

  return (
    <div className="w-full mx-auto">
      <PoemLearningPlatform poem={poemData} />
    </div>
  );
};

export default PoemPage;
