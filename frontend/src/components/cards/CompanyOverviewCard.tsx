import { Button } from "../ui/button";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface OverviewCardProps {
  companyName: string;
  domain: string;
  description: string;
}

export default function CompanyOverviewCard({ companyName, domain, description }: OverviewCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{companyName}</h2>
              <p className="text-sm text-gray-500">{domain}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            View Details
          </Button>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">COMPANY DESCRIPTION</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
} 