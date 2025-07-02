import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Building2 } from "lucide-react";

interface OverviewCardProps {
  title: string;
  subtitle?: string;
  buttonTitle?: string;
  bodyTitle?: string;
  bodyText?: string;
  showButton?: boolean;
  onButtonClick?: () => void;
}

export default function OverviewCard({
  title,
  subtitle,
  buttonTitle = "View Details",
  bodyTitle = "DESCRIPTION",
  bodyText = "",
  showButton = true,
  onButtonClick,
}: OverviewCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {showButton && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
              onClick={onButtonClick}
            >
              {buttonTitle}
            </Button>
          )}
        </div>
        <div>
          {bodyTitle && <h3 className="text-sm font-medium text-gray-700 mb-2">{bodyTitle}</h3>}
          <p className="text-gray-600 text-sm leading-relaxed">{bodyText}</p>
        </div>
      </CardContent>
    </Card>
  );
} 