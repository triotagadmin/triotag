import { Link, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { findCityBySlug, CITY_COORDS, citySlug } from "@/lib/inventoryAggregation";

export default function AdvertiserAreaDetails() {
  const { city: citySlugParam = "", area: areaSlugParam = "" } = useParams();
  const cityName = findCityBySlug(citySlugParam);
  const meta = cityName ? CITY_COORDS[cityName] : undefined;
  const areaName = areaSlugParam.replace(/-/g, " ");

  if (!cityName || !meta) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="p-10">
          Area not found. <Link to="/advertiser/explore" className="text-green-600">Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <main className="flex-1 min-w-0">
          <div className="px-6 lg:px-8 py-6 border-b border-gray-100">
            <Link to={`/advertiser/explore/${citySlug(cityName)}`} className="text-green-600 text-sm font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to {cityName} Overview
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-3 capitalize">{areaName}</h1>
            <p className="text-gray-500 mt-1 text-sm">{meta.country} · {meta.region} · {cityName}</p>
          </div>
          <div className="px-6 lg:px-8 py-12">
            <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="font-bold text-gray-900">No inventory available in this area yet</div>
              <div className="text-sm text-gray-500 mt-1">Area-level data will appear here once venues are tagged by district.</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
