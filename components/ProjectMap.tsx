/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getCurrentPosition } from "@/lib/geolocation";


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
  const mapRef = useRef<any>(null);
  const myLocationMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

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
    mapRef.current = map;

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
              width: 32px; height: 32px;
              background: #111827; color: white;
              border-radius: 50%; 
              display: flex; align-items: center; justify-content: center;
              font-weight: bold; font-size: 14px;
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

  // 현재 위치 표시
  async function handleShowMyLocation() {
    setError(null);
    setLocating(true);

    try {
      const coords = await getCurrentPosition();

      if (!mapRef.current || !window.naver) {
        setError("지도가 아직 준비되지 않았어요");
        return;
      }
      const position = new window.naver.maps.LatLng(
        coords.latitude,
        coords.longitude
      );

      //기존 내 위치 마커 제거
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setMap(null);
      }

      //파란 점 마커
      myLocationMarkerRef.current = new window.naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: `
            <div style="
              width: 20px; height: 20px;
              background: #2563eb;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 2px #2563eb, 0 2px 6px rgba(0,0,0,0.4);
            "></div>
          `,
          anchor: new window.naver.maps.Point(10,10),
        },
        title:"현재 내 위치",
        zIndex: 1000, //답사지 마커보다 위에 표시
      });

      //내 위치로 지도 이동
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(15);
    } catch (e) {
      setError(e instanceof Error ? e.message : "위치를 가져오지 못했어요");
    } finally {
      setLocating(false);
    }
  }

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

      {/*내 위치 버튼 - 눈에 띄게 설정*/}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleShowMyLocation}
          disabled={!isLoaded || locating}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <span className="text-base">📍</span>
            {locating ? "위치 확인 중...": "내 위치"}
          </button>
          <span className="text-xs text-gray-500">
            버튼을 누르면 현재 위치가 표시됩니다
          </span>
      </div>

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