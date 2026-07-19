/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// TypeScript가 window.naver의 존재를 알도록 알려주는 선언
// 네이버 지도 SDK는 전역 객체 window.naver로 붙기 때문에 필요
declare global {
  interface Window {

    naver: any;
    navermap_authFailure?: () => void;
  }
}

interface NaverMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: string;
}

export default function NaverMap({
  latitude = 37.5665, // 기본값: 서울시청 좌표
  longitude = 126.978,
  zoom = 13,
  height = "400px",
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SDK 로드 완료 후 지도 초기화
  useEffect(() => {
    if (!isLoaded) return;
    if (!mapRef.current) return;
    if (!window.naver) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(latitude, longitude),
      zoom,
    });

    // 지도 중앙에 테스트 마커
    new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(latitude, longitude),
      map,
      title: "중심점",
    });

    // 인증 실패 시 콜백 등록
    window.navermap_authFailure = () => {
      setError(
        "네이버 지도 인증 실패. Client ID나 등록된 웹 서비스 URL을 확인하세요."
      );
    };
  }, [isLoaded, latitude, longitude, zoom]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="rounded bg-red-50 p-4 text-sm text-red-700">
        NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았어요.
      </div>
    );
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`}
        onReady={() => setIsLoaded(true)}
        onError={() => setError("네이버 지도 SDK 로드 실패")}
      />
      {error && (
        <div className="mb-2 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height }} />
    </>
  );
}