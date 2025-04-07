import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import { toast } from "sonner";

type TToggleLanguageProps = {
  language: "en-US" | "zh-CN";
  setLanguage: (language: "en-US" | "zh-CN") => void;
};

const ToggleLanguage = ({ language, setLanguage }: TToggleLanguageProps) => {
  const handleLanguageChange = (checked: boolean) => {
    const newLanguage = checked ? "en-US" : "zh-CN";
    setLanguage(newLanguage);
    toast.info(
      `Language changed to ${newLanguage === "zh-CN" ? "Chinese" : "English"}`
    );
  };
  return (
    <div className="flex items-center justify-end gap-2 p-4 border-b border-gray-800">
      <Label
        htmlFor="language-toggle"
        className="text-sm text-gray-400 font-medium flex items-center"
      >
        <Globe className="h-4 w-4 mr-2" />
        {language === "zh-CN" ? "中文" : "English"}
      </Label>
      <Switch
        id="language-toggle"
        checked={language === "en-US"}
        onCheckedChange={handleLanguageChange}
        aria-label="Toggle language"
      />
    </div>
  );
};

export default ToggleLanguage;
