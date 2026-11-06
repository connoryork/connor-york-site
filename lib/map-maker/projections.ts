import {
  geoEquirectangular,
  geoMercator,
  geoNaturalEarth1,
  type GeoProjection,
} from "d3-geo";
import type { MapFile } from "./format";

// Maps the projection name used in map files to the d3 function that builds it.
// Each projection turns [longitude, latitude] into flat [x, y] positions, and
// each one distorts the globe differently.
const projections: Record<MapFile["projection"], () => GeoProjection> = {
  naturalEarth: geoNaturalEarth1, // balanced look, similar to many atlases
  equirectangular: geoEquirectangular, // lon/lat used directly as x/y
  mercator: geoMercator, // the web-map classic; Antarctica gets stretched
};

export function createProjection(name: MapFile["projection"]): GeoProjection {
  return projections[name]();
}
