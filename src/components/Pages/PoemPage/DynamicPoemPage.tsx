import { useParams, Navigate } from "react-router-dom";
import { useGetPoemByIdQuery } from "@/redux/features/poems/poemsApi";
import PoemLearningPlatform from "./poem-learning-platform";
import { Loader2 } from "lucide-react";

const DynamicPoemPage = () => {
  const { poemId } = useParams<{ poemId: string }>();

  // Skip the query if poemId is undefined
  const { data, isLoading, error } = useGetPoemByIdQuery(poemId || "", {
    skip: !poemId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-lg font-medium text-gray-300">Loading poem...</p>
      </div>
    );
  }

  // If there's an error or no data, redirect back to the main poems page
  if (error || !data) {
    console.error("Error loading poem:", error);
    return <Navigate to="/interactive-poems" replace />;
  }

  return (
    <div className="w-full mx-auto">
      <PoemLearningPlatform poem={data.data} />
    </div>
  );
};

export default DynamicPoemPage;
