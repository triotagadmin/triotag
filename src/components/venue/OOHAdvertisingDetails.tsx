import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
                <div>
                  <span className="text-muted-foreground">Location Notes:</span>
                  <p className="mt-1">{oohDetails.exactLocationNotes}</p>
                </div>
              )}
              {oohDetails.placementTypes && oohDetails.placementTypes.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Placement Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {oohDetails.placementTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.visibility && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span>{oohDetails.visibility}</span>
                </div>
              )}
              {oohDetails.facingDirection && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facing Direction:</span>
                  <span>{oohDetails.facingDirection}</span>
                </div>
              )}
              {oohDetails.surroundingEnvironment && oohDetails.surroundingEnvironment.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Environment:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {oohDetails.surroundingEnvironment.map((env) => (
                      <Badge key={env} variant="secondary" className="text-xs">
                        {env}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.distanceFromObstructions && (
                <div>
                  <span className="text-muted-foreground">Distance from Obstructions:</span>
                  <p className="mt-1">{oohDetails.distanceFromObstructions}</p>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Traffic:</span>
                  <span className="font-medium">
                    {Number(oohDetails.estimatedTraffic).toLocaleString()} {trafficUnitLabels[oohDetails.trafficUnit || "per_day"]}
                  </span>
                </div>
              )}
              {oohDetails.primaryDemographic && (
                <div>
                  <span className="text-muted-foreground">Primary Demographic:</span>
                  <p className="mt-1">{oohDetails.primaryDemographic}</p>
                </div>
              )}
              {oohDetails.audienceBehavior && oohDetails.audienceBehavior.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Audience Behavior:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {oohDetails.audienceBehavior.map((behavior) => (
                      <Badge key={behavior} variant="outline" className="text-xs">
                        {behavior}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {oohDetails.peakViewingHours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peak Viewing Hours:</span>
                  <span>{oohDetails.peakViewingHours}</span>
                </div>
              )}
              {oohDetails.measurementSource && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Measurement Source:</span>
                  <span>{oohDetails.measurementSource}</span>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Media Type:</span>
                  <span>{oohDetails.mediaType}</span>
                </div>
              )}
              {oohDetails.sizeWidth && oohDetails.sizeHeight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span>
                    {oohDetails.sizeWidth} x {oohDetails.sizeHeight} {oohDetails.sizeUnit || "inches"}
                  </span>
                </div>
              )}
              {oohDetails.resolution && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span>{oohDetails.resolution}</span>
                </div>
              )}
              {oohDetails.fileFormatRequirements && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Format:</span>
                  <span>{oohDetails.fileFormatRequirements}</span>
                </div>
              )}
              {oohDetails.illumination && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Illumination:</span>
                  <span>{oohDetails.illumination}</span>
                </div>
              )}
              {oohDetails.hasAudio && (
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span>Audio Enabled</span>
                  {oohDetails.audioNotes && (
                    <span className="text-muted-foreground">- {oohDetails.audioNotes}</span>
                  )}
                </div>
              )}
              {oohDetails.structuralSafetyNotes && (
                <div>
                  <span className="text-muted-foreground">Safety Notes:</span>
                  <p className="mt-1">{oohDetails.structuralSafetyNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
