import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, User, Calendar, Star, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Poem } from "@/redux/features/poems/poemsApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface PoemCardProps {
  poem: Poem;
}

const PoemCard = ({ poem }: PoemCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleViewPoem = () => {
    navigate("/poem", { state: { poem } });
  };
  
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-xl group border border-gray-800 bg-gray-900/80 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="relative p-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/90 z-10" />
        
        {/* Background pattern with gradient overlay */}
        <div 
          className="h-40 bg-gradient-to-r from-indigo-900/60 to-purple-900/40 overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Bookmark button */}
          <div className="absolute top-3 right-3 z-20">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/70 text-gray-300 hover:text-yellow-400 transition-all"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Title and author - positioned over the background */}
        <div className="relative z-20 px-5 -mt-12 pb-2">
          <CardTitle className="text-xl font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
            {poem.title}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-400 gap-2 mt-1">
            <User className="h-3 w-3" />
            <span>{poem.author}</span>
            {poem.era && (
              <>
                <Calendar className="h-3 w-3 ml-2" />
                <span>{poem.era}</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex-grow">
        <div className="flex items-center mb-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`h-3 w-3 ${star <= 4 ? 'text-yellow-400' : 'text-gray-600'}`} 
                fill={star <= 4 ? 'currentColor' : 'none'} 
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">4.0</span>
        </div>
        
        <p className="text-sm text-gray-300 line-clamp-3 h-[4.5rem]">
          {poem.content?.substring(0, 150)}
          {poem.content?.length > 150 ? "..." : ""}
        </p>
        
        {poem.analysis?.theme && (
          <div className="mt-4 p-2 rounded-md bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-indigo-400 mb-1">Theme</p>
            <p className="text-sm text-gray-300 line-clamp-1">{poem.analysis.theme}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-900 p-4 border-t border-gray-800">
        <Button 
          onClick={handleViewPoem}
          variant="default" 
          size="sm" 
          className={`w-full gap-2 transition-all duration-300 ${
            isHovered 
            ? 'bg-indigo-500 hover:bg-indigo-600' 
            : 'bg-indigo-600/80 hover:bg-indigo-600'
          }`}
        >
          <Book className={`h-4 w-4 transition-all ${isHovered ? 'animate-pulse' : ''}`} />
          Study Interactively
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PoemCard; 