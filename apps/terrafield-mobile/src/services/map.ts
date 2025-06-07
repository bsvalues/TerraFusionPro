import { Region } from 'react-native-maps';
import { Field } from '../types/field';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  northEast: MapPoint;
  southWest: MapPoint;
}

export class MapService {
  private static instance: MapService;

  private constructor() {}

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  calculateArea(points: MapPoint[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].latitude * points[j].longitude;
      area -= points[j].latitude * points[i].longitude;
    }
    area = Math.abs(area) / 2;

    // Convert to acres (approximate)
    const acres = area * 247.105;
    return acres;
  }

  getBounds(points: MapPoint[]): MapBounds {
    if (points.length === 0) {
      throw new Error('No points provided');
    }

    const latitudes = points.map(p => p.latitude);
    const longitudes = points.map(p => p.longitude);

    return {
      northEast: {
        latitude: Math.max(...latitudes),
        longitude: Math.max(...longitudes),
      },
      southWest: {
        latitude: Math.min(...latitudes),
        longitude: Math.min(...longitudes),
      },
    };
  }

  getRegionForBounds(bounds: MapBounds, padding: number = 0.1): Region {
    const latDelta = Math.abs(bounds.northEast.latitude - bounds.southWest.latitude) * (1 + padding);
    const lonDelta = Math.abs(bounds.northEast.longitude - bounds.southWest.longitude) * (1 + padding);

    return {
      latitude: (bounds.northEast.latitude + bounds.southWest.latitude) / 2,
      longitude: (bounds.northEast.longitude + bounds.southWest.longitude) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  }

  validateFieldBoundaries(points: MapPoint[]): boolean {
    if (points.length < 3) return false;

    // Check for self-intersection
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const k = (i + 2) % points.length;
      const l = (i + 3) % points.length;

      if (this.doIntersect(points[i], points[j], points[k], points[l])) {
        return false;
      }
    }

    return true;
  }

  getCenterPoint(points: MapPoint[]): MapPoint {
    if (points.length === 0) {
      throw new Error('No points provided');
    }

    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length,
    };
  }

  private doIntersect(
    p1: MapPoint,
    p2: MapPoint,
    p3: MapPoint,
    p4: MapPoint
  ): boolean {
    const orientation = (p: MapPoint, q: MapPoint, r: MapPoint): number => {
      const val = (q.latitude - p.latitude) * (r.longitude - q.longitude) -
        (q.longitude - p.longitude) * (r.latitude - q.latitude);
      if (val === 0) return 0;
      return val > 0 ? 1 : 2;
    };

    const onSegment = (p: MapPoint, q: MapPoint, r: MapPoint): boolean => {
      return q.longitude <= Math.max(p.longitude, r.longitude) &&
        q.longitude >= Math.min(p.longitude, r.longitude) &&
        q.latitude <= Math.max(p.latitude, r.latitude) &&
        q.latitude >= Math.min(p.latitude, r.latitude);
    };

    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;

    return false;
  }
}

export const mapService = MapService.getInstance(); 