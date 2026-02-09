import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, MapPin, Users, Monitor, Volume2 } from "lucide-react";

interface OOHDetails {
  exactLocationNotes?: string;
  placementTypes?: string[];
  visibility?: string;
  facingDirection?: string;
  surroundingEnvironment?: string[];
  distanceFromObstructions?: string;
  estimatedTraffic?: string;
  trafficUnit?: string;
  primaryDemographic?: string;
  audienceBehavior?: string[];
  peakViewingHours?: string;
  measurementSource?: string;
  mediaType?: string;
  sizeWidth?: string;
  sizeHeight?: string;
  sizeUnit?: string;
  resolution?: string;
  fileFormatRequirements?: string;
  illumination?: string;
  hasAudio?: boolean;
  audioNotes?: string;
  structuralSafetyNotes?: string;
}

interface OOHAdvertisingDetailsProps {
  oohDetails: OOHDetails | null;
}

const trafficUnitLabels: Record<string, string> = {
  per_day: "per day",
  per_week: "per week",
  per_month: "per month",
};

export const OOHAdvertisingDetails = ({ oohDetails }: OOHAdvertisingDetailsProps) => {
  if (!oohDetails) return null;

  const hasLocationData = oohDetails.exactLocationNotes || 
    (oohDetails.placementTypes && oohDetails.placementTypes.length > 0) ||
    oohDetails.visibility || oohDetails.facingDirection;

  const hasAudienceData = oohDetails.estimatedTraffic || 
    oohDetails.primaryDemographic || 
    (oohDetails.audienceBehavior && oohDetails.audienceBehavior.length > 0);

  const hasFormatData = oohDetails.mediaType || 
    (oohDetails.sizeWidth && oohDetails.sizeHeight) ||
    oohDetails.illumination;

  if (!hasLocationData && !hasAudienceData && !hasFormatData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          OOH Advertising Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location & Placement */}
        {hasLocationData && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Location & Placement
            </h4>
            <div className="grid gap-3 text-sm">
              {oohDetails.exactLocationNotes && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Location Notes:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.exactLocationNotes}
                  </Button>
                </div>
              )}
              {oohDetails.placementTypes && oohDetails.placementTypes.length > 0 && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Placement Types:</span>
                  <div className="flex flex-wrap gap-1">
                    {oohDetails.placementTypes.map((type) => (
                      <Button key={type} variant="cyber" size="sm" className="text-xs h-7 px-3">
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.visibility && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Visibility:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.visibility}
                  </Button>
                </div>
              )}
              {oohDetails.facingDirection && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Facing Direction:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.facingDirection}
                  </Button>
                </div>
              )}
              {oohDetails.surroundingEnvironment && oohDetails.surroundingEnvironment.length > 0 && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Environment:</span>
                  <div className="flex flex-wrap gap-1">
                    {oohDetails.surroundingEnvironment.map((env) => (
                      <Button key={env} variant="cyber" size="sm" className="text-xs h-7 px-3">
                        {env}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.distanceFromObstructions && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Distance from Obstructions:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.distanceFromObstructions}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audience & Reach */}
        {hasAudienceData && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Audience & Reach
            </h4>
            <div className="grid gap-3 text-sm">
              {oohDetails.estimatedTraffic && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Estimated Traffic:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {Number(oohDetails.estimatedTraffic).toLocaleString()} {trafficUnitLabels[oohDetails.trafficUnit || "per_day"]}
                  </Button>
                </div>
              )}
              {oohDetails.primaryDemographic && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Primary Demographic:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.primaryDemographic}
                  </Button>
                </div>
              )}
              {oohDetails.audienceBehavior && oohDetails.audienceBehavior.length > 0 && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Audience Behavior:</span>
                  <div className="flex flex-wrap gap-1">
                    {oohDetails.audienceBehavior.map((behavior) => (
                      <Button key={behavior} variant="cyber" size="sm" className="text-xs h-7 px-3">
                        {behavior}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.peakViewingHours && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Peak Viewing Hours:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.peakViewingHours}
                  </Button>
                </div>
              )}
              {oohDetails.measurementSource && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Measurement Source:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.measurementSource}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format & Technical Specs */}
        {hasFormatData && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              Format & Technical Specs
            </h4>
            <div className="grid gap-3 text-sm">
              {oohDetails.mediaType && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Media Type:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.mediaType}
                  </Button>
                </div>
              )}
              {oohDetails.sizeWidth && oohDetails.sizeHeight && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Dimensions:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.sizeWidth} x {oohDetails.sizeHeight} {oohDetails.sizeUnit || "inches"}
                  </Button>
                </div>
              )}
              {oohDetails.resolution && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Resolution:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.resolution}
                  </Button>
                </div>
              )}
              {oohDetails.fileFormatRequirements && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">File Format:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.fileFormatRequirements}
                  </Button>
                </div>
              )}
              {oohDetails.illumination && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Illumination:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.illumination}
                  </Button>
                </div>
              )}
              {oohDetails.hasAudio && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Volume2 className="h-4 w-4 text-primary" /> Audio:
                  </span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    Enabled{oohDetails.audioNotes ? ` - ${oohDetails.audioNotes}` : ""}
                  </Button>
                </div>
              )}
              {oohDetails.structuralSafetyNotes && (
                <div className="flex flex-col items-start">
                  <span className="text-muted-foreground mb-1">Safety Notes:</span>
                  <Button variant="cyber" size="sm" className="text-xs h-7 px-3">
                    {oohDetails.structuralSafetyNotes}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
