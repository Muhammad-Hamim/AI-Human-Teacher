import React from "react";
import { motion } from "framer-motion";
import PoemStorytellingVideo from "./PoemStorytellingVideo";

const PoemStorytellingPage: React.FC = () => {
  return (
    <motion.div
      className="flex-1 overflow-auto bg-gray-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PoemStorytellingVideo />
    </motion.div>
  );
};

export default PoemStorytellingPage;
