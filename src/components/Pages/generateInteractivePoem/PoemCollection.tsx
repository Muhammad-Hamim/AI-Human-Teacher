import { useGetPoemsQuery } from "@/redux/features/poems/poemsApi";
import PoemCard from "./PoemCard";
import { Loader2, BookOpen, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PoemCollection = () => {
  const { data: poemsData, isLoading, error } = useGetPoemsQuery();
  const [searchTerm, setSearchTerm] = useState("");

  // Animations for staggered card reveal
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  // Filter poems based on search term
  const filteredPoems = poemsData?.data.filter(poem => 
    poem.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    poem.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-lg font-medium text-gray-300">Loading the world of poetry...</p>
        <p className="mt-2 text-gray-400">Discovering verses and stanzas just for you</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md w-full text-center">
          <p className="text-red-400 text-lg font-medium mb-2">
            Unable to reach the poetry database
          </p>
          <p className="text-gray-400">
            Our poetic journey has encountered a temporary pause. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!poemsData || poemsData.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-md w-full text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg font-medium mb-2">
            The poetry collection is empty
          </p>
          <p className="text-gray-400">
            It seems our collection has yet to be filled with poetic wonders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <motion.div 
        className="container mx-auto py-10 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero section */}
        <div className="relative overflow-hidden rounded-xl mb-10 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] bg-center opacity-10"></div>
          <div className="relative z-10 p-8 md:p-12">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Interactive Poem Collection
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-300 max-w-2xl mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Explore our curated collection of poems from various eras and authors. 
              Each card is a doorway to an interactive learning experience.
            </motion.p>
            
            {/* Search and filter */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800/60 border-gray-700 focus-visible:ring-indigo-500 text-white pl-10 h-11"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Button variant="outline" className="h-11 gap-2 bg-gray-800/60 border-gray-700 hover:bg-gray-700/80">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            Showing {filteredPoems?.length || 0} poem{filteredPoems?.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        
        {/* Poem grid with animation */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredPoems?.map((poem) => (
            <motion.div key={poem._id} variants={item}>
              <PoemCard poem={poem} />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Empty state if filtered results are empty */}
        {filteredPoems?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-300 text-lg font-medium">No poems match your search</p>
            <p className="text-gray-400 mt-2">Try adjusting your search terms</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PoemCollection; 