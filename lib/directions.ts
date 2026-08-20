interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface RouteResult {
  path: number[][];      // [[lng, lat], ...] 경로 좌표
  distance: number;      // 미터
  duration: number;      // 밀리초
}

export async function calculateRoute(
  points: RoutePoint[]
): Promise<RouteResult | null> {
  // 답사지가 2개 미만이면 경로 없음
  if (points.length < 2) {
    return null;
  }

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("네이버 지도 API 키가 설정되지 않았어요");
  }

  // 출발지 = 첫 답사지, 목적지 = 마지막 답사지, 나머지 = 경유지
  const start = points[0];
  const goal = points[points.length - 1];
  const waypoints = points.slice(1, -1); // 중간 답사지들

  // 좌표는 "경도,위도" 형식 (네이버 규칙: 경도 먼저)
  const startParam = `${start.longitude},${start.latitude}`;
  const goalParam = `${goal.longitude},${goal.latitude}`;

  // 경유지는 콜론(:)으로 구분
  const waypointsParam = waypoints
    .map((w) => `${w.longitude},${w.latitude}`)
    .join(":");

  // API URL 구성
  const url = new URL(
    "https://maps.apigw.ntruss.com/map-direction-15/v1/driving"
  );
  url.searchParams.set("start", startParam);
  url.searchParams.set("goal", goalParam);
  if (waypointsParam) {
    url.searchParams.set("waypoints", waypointsParam);
  }

  // API 호출 - 헤더에 인증 정보
  const response = await fetch(url.toString(), {
    headers: {
      "x-ncp-apigw-api-key-id": clientId,
      "x-ncp-apigw-api-key": clientSecret,
    },
  });

  if (!response.ok) {
    throw new Error(`경로 계산 실패: ${response.status}`);
  }

  const data = await response.json();

  // 응답 코드 확인 (0이 성공)
  if (data.code !== 0) {
    throw new Error(`경로를 찾을 수 없어요: ${data.message || "알 수 없는 오류"}`);
  }

  // 결과 파싱 - traoptimal(추천 경로) 사용
  const route = data.route?.traoptimal?.[0];
  if (!route) {
    throw new Error("경로 데이터가 없어요");
  }

  return {
    path: route.path,                    // 도로 좌표 배열
    distance: route.summary.distance,    // 미터
    duration: route.summary.duration,    // 밀리초
  };
}