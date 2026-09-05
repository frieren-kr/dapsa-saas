export interface Coords{
    latitude: number;
    longitude: number;
    accuracy: number;
}

export function getCurrentPosition(): Promise<Coords> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("이 브라우저는 위치 기능을 지원하지 않아요"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>{
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) =>{
                if (error.code === error.PERMISSION_DENIED) {
                    reject(new Error("위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요"));
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    reject(new Error("위치를 확인할 수 없어요"));
                } else if (error.code === error.TIMEOUT) {
                    reject(new Error("위치 확인 시간이 초과됐어요"));
                } else {
                    reject(new Error("위치를 가져오는데 실패했어요"));
                }
            },
            {enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * 두 좌표 사이의 거리를 미터로 반환 (Haversine 공식).
 * 위경도는 평면이 아니라 구면 좌표라, 단순 뺄셈이 아니라
 * 지구 반지름 기반 구면 거리 계산이 필요하다.
 */
export function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // 지구 반지름 (미터)
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
}
