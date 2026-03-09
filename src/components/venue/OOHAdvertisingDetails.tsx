import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, Eye } from "lucide-react";

interface EnvironmentDetails {
  venueType?: string;
  venueSize?: string;
  seatingCapacity?: string;
  environment?: string;
  customerActivity?: string[];
  adPlacementAreas?: string[];
  customerDemographics?: string[];
  exactLocationNotes?: string;
  visibility?: string;
}

interface OOHAdvertisingDetailsProps {
  oohDetails: EnvironmentDetails | null;
}

export const OOHAdvertisingDetails = ({ oohDetails }: OOHAdvertisingDetailsProps) => {
  if (!oohDetails) return null;

  const hasData = oohDetails.venueType || oohDetails.venueSize || oohDetails.seatingCapacity ||
    (oohDetails.customerActivity && oohDetails.customerActivity.length > 0) ||
    (oohDetails.adPlacementAreas && oohDetails.adPlacementAreas.length > 0);

  if (!hasData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Ad Space Environment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Venue Info */}
        <div className="grid gap-3 text-sm">
          {oohDetails.venueType && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground mb-1">Venue Type:</span>
              <Button variant="cyber" size="sm" className="text-xs h-7 px-3">{oohDetails.venueType}</Button>
            </div>
          )}
          {oohDetails.venueSize && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground mb-1">Floor Area:</span>
              <Button variant="cyber" size="sm" className="text-xs h-7 px-3">{oohDetails.venueSize} sqm</Button>
            </div>
          )}
          {oohDetails.seatingCapacity && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground mb-1">Seating Capacity:</span>
              <Button variant="cyber" size="sm" className="text-xs h-7 px-3">{oohDetails.seatingCapacity} seats</Button>
            </div>
          )}
          {oohDetails.environment && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground mb-1">Environment:</span>
              <Button variant="cyber" size="sm" className="text-xs h-7 px-3">{oohDetails.environment}</Button>
            </div>
          )}
          {oohDetails.visibility && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground mb-1 flex items-center gap-1"><Eye className="h-4 w-4" /> Visibility:</span>
              <Button variant="cyber" size="sm" className="text-xs h-7 px-3">{oohDetails.visibility}</Button>
            </div>
          )}
        </div>

        {/* Customer Activity */}
        {oohDetails.customerActivity && oohDetails.customerActivity.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><Users className="h-4 w-4" /> Customer Activity</h4>
            <div className="flex flex-wrap gap-1">
              {oohDetails.customerActivity.map(a => (
                <Button key={a} variant="cyber" size="sm" className="text-xs h-7 px-3">{a}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Placement Areas */}
        {oohDetails.adPlacementAreas && oohDetails.adPlacementAreas.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <h4 className="font-semibold flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /> Ad Placement Areas</h4>
            <div className="flex flex-wrap gap-1">
              {oohDetails.adPlacementAreas.map(a => (
                <Button key={a} variant="cyber" size="sm" className="text-xs h-7 px-3">{a}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Demographics */}
        {oohDetails.customerDemographics && oohDetails.customerDemographics.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <h4 className="font-semibold text-sm">Customer Demographics</h4>
            <div className="flex flex-wrap gap-1">
              {oohDetails.customerDemographics.map(d => (
                <Button key={d} variant="cyber" size="sm" className="text-xs h-7 px-3">{d}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {oohDetails.exactLocationNotes && (
          <div className="space-y-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <h4 className="font-semibold text-sm">Placement Notes</h4>
            <p className="text-sm text-muted-foreground">{oohDetails.exactLocationNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
