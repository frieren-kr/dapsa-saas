/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
}

interface ProjectMapProps {
  sites: Site[];
  height?: string;
}

export default function ProjectMap({ sites, height = "400px" }: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!mapContainerRef.current) return;
    if (!window.naver) return;
    if (sites.length === 0) return;

    // 답사지들의 중심 좌표 + 모든 답사지가 화면에 들어오도록 zoom 조정
    const bounds = new window.naver.maps.LatLngBounds();
    sites.forEach((site) => {
      bounds.extend(new window.naver.maps.LatLng(site.latitude, site.longitude));
    });

    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center: bounds.getCenter(),
      zoom: 10,
    });

    // 답사지가 여러 개면 bounds에 맞춰 자동 zoom
    if (sites.length > 1) {
      map.fitBounds(bounds);
    }

    // 답사지 정렬 순서대로 순회하며 마커 + 정보창
    const sortedSites = [...sites].sort((a, b) => a.orderIndex - b.orderIndex);

    sortedSites.forEach((site, index) => {
      const position = new window.naver.maps.LatLng(
        site.latitude,
        site.longitude
      );

      // 커스텀 마커 - 순서 번호가 원 안에 들어감
      new window.naver.maps.Marker({
        position,
        map,
        icon: {
          content: `
            <div style="
              width: 32px;
              height: 32px;
              background: #111827;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${index + 1}</div>
          `,
          anchor: new window.naver.maps.Point(16, 16),
        },
        title: `${index + 1}. ${site.name}`,
      });
    });

    // 답사지가 2개 이상이면 이동 경로 폴리라인 그리기
    if (sortedSites.length >= 2) {
      const path = sortedSites.map(
        (s) => new window.naver.maps.LatLng(s.latitude, s.longitude)
      );

      new window.naver.maps.Polyline({
        map,
        path,
        strokeColor: "#3b82f6",
        strokeWeight: 3,
        strokeOpacity: 0.7,
        strokeStyle: "shortdash",
      });
    }

    window.navermap_authFailure = () => {
      setError("네이버 지도 인증 실패");
    };
  }, [isLoaded, sites]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (sites.length === 0) {
    return (
      <div className="rounded border bg-gray-50 p-8 text-center text-sm text-gray-500">
        아직 등록된 답사지가 없어요.
      </div>
    );
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        onReady={() => setIsLoaded(true)}
        onError={() => setError("네이버 지도 SDK 로드 실패")}
      />
      {error && (
        <div className="mb-2 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height }}
        className="rounded border"
      />
    </>
  );
}  