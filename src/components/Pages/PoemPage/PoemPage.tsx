import { poemData as defaultPoemData } from "./../../../../data/poem-data";
import PoemLearningPlatform from "./poem-learning-platform";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useGetPoemByIdQuery } from "@/redux/features/poems/poemsApi";
import { Loader2 } from "lucide-react";

const PoemPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { poemId } = useParams();

  // Fetch the specific poem data using the ID from URL params
  const {
    data: poemData,
    isLoading,
    error,
  } = useGetPoemByIdQuery(poemId || "", {
    skip: !poemId,
  });

  // If there's an error, navigate back to the generate page
  useEffect(() => {
    if (error) {
      navigate("/generate-interactive-poem");
    }
  }, [error, navigate]);

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-400 text-lg">Loading poem data...</p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we prepare your learning experience
          </p>
        </div>
      </div>
    );
  }

  // If no poem data is available, show error state
  if (!poemData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Poem not found</p>
          <p className="text-gray-500 text-sm mt-2">
            The poem you're looking for couldn't be found
          </p>
          <button
            onClick={() => navigate("/generate-interactive-poem")}
            className="mt-6 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            Go back to poem selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-gray-900 min-h-screen">
      <PoemLearningPlatform poem={poemData} />
    </div>
  );
};

export default PoemPage;
