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