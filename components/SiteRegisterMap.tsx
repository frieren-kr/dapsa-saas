/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Script from "next/script";
import { createSite } from "@/app/projects/[id]/actions";

declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

interface SiteRegisterMapProps {
  projectId: string;
}

interface SearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function SiteRegisterMap({ projectId }: SiteRegisterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [isPending, startTransition] = useTransition();

  // SDK 로드 후 지도 초기화
  useEffect(() => {
    if (!isLoaded) return;
    if (!mapContainerRef.current) return;
    if (!window.naver) return;

    // 대한민국 중심 좌표로 시작
    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center: new window.naver.maps.LatLng(36.5, 127.8),
      zoom: 7,
    });
    mapRef.current = map;

    // 인증 실패 콜백
    window.navermap_authFailure = () => {
      setError("네이버 지도 인증 실패. Client ID나 도메인 등록을 확인하세요.");
    };
    // 지도 클릭 리스너 - 좌표 직접 지정용
    window.naver.maps.Event.addListener(map, "click", (e: any) => {
        const lat = e.coord.lat();
        const lng = e.coord.lng();

        const result: SearchResult = {
            name: "",
            address: `직접 지정한 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            latitude: lat,
            longitude: lng,
        };

        setSearchResult(result);
        setSiteName(""); // 사용자가 이름 직접 입력하도록 비움

        // 마커 갱신
        if (markerRef.current) {
            markerRef.current.setMap(null);
        }
        markerRef.current = new window.naver.maps.Marker({
            position: e.coord,
            map,
        });
    });
  }, [isLoaded]);

  // 검색 실행 - 네이버 Geocoding submodule 사용
  function handleSearch() {
    if (!window.naver?.maps?.Service) {
      setError("지도 SDK가 아직 준비 안 됐어요. 잠시만요.");
      return;
    }
    if (!query.trim()) return;

    setError(null);

    window.naver.maps.Service.geocode(
      { query: query.trim() },
      (status: any, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          setError("검색에 실패했어요. 다시 시도해주세요.");
          return;
        }

        const items = response.v2.addresses;
        if (!items || items.length === 0) {
          setError("검색 결과가 없어요. 다른 키워드를 시도해보세요.");
          return;
        }

        // 첫 번째 결과 사용
        const item = items[0];
        const lat = parseFloat(item.y);
        const lng = parseFloat(item.x);
        const displayName = item.roadAddress || item.jibunAddress || query;

        const result: SearchResult = {
          name: query.trim(), // 검색어를 임시 이름으로
          address: displayName,
          latitude: lat,
          longitude: lng,
        };

        setSearchResult(result);
        setSiteName(""); // 답사지 이름 기본값

        // 지도 이동 + 마커 표시
        const position = new window.naver.maps.LatLng(lat, lng);
        mapRef.current.setCenter(position);
        mapRef.current.setZoom(16);

        if (markerRef.current) {
          markerRef.current.setMap(null); // 기존 마커 제거
        }
        markerRef.current = new window.naver.maps.Marker({
          position,
          map: mapRef.current,
        });
      }
    );
  }

  // 저장 실행
  function handleSave() {
    if (!searchResult) return;
    if (!siteName.trim()) {
      setError("답사지 이름을 입력하세요");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createSite({
        projectId,
        name: siteName.trim(),
        latitude: searchResult.latitude,
        longitude: searchResult.longitude,
        address: searchResult.address,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // 성공 - 폼 초기화
      setQuery("");
      setSearchResult(null);
      setSiteName("");
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    });
  }

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`}
        onReady={() => setIsLoaded(true)}
        onError={() => setError("네이버 지도 SDK 로드 실패")}
      />

      <div className="space-y-3">
        {/* 검색창 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="주소로 검색 (예: 경복궁 ~> 사직로 161)"
            className="flex-1 rounded border px-3 py-2 text-gray-900"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={!isLoaded}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            검색
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 지도 */}
        <p className="text-xs text-gray-500">
            주소로 검색이 어려운 곳은 지도를 직접 클릭해서 좌표를 지정할 수 있어요.
        </p>
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "400px" }}
          className="rounded border"
        />

        {/* 검색 결과 표시 + 저장 폼 */}
        {searchResult && (
          <div className="rounded border bg-gray-50 p-4">
            <p className="mb-1 text-xs text-gray-500">
              위도 {searchResult.latitude.toFixed(6)} · 경도{" "}
              {searchResult.longitude.toFixed(6)}
            </p>
            <p className="mb-3 text-sm text-gray-700">
              주소: {searchResult.address}
            </p>

            <label className="mb-1 block text-sm font-medium text-gray-900">
              답사지 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              maxLength={100}
              className="mb-3 w-full rounded border px-3 py-2 text-gray-900"
              placeholder="예: 근정전, 광화문"
            />

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded bg-black py-2 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "이 위치를 답사지로 등록"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}