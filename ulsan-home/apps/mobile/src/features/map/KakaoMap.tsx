import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type RefAttributes } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import WebView, { type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';

import type { BBox, LatLng, MapMarker } from '@/data';
import { MAP_BASE_URL, buildKakaoMapHtml } from '@/map-web/kakao-map-html';
import type { PriceLabel } from '@/stores/app-store';

// react-native-webview 의 타입 선언(P=undefined → never)이 최신 TypeScript와 맞지 않아 타입만 바로잡는다
type WebViewRef = WebView<object>;
const RNWebView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebViewRef>>;

export const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY ?? '';

type Props = {
  initialCenter: LatLng;
  initialLevel: number;
  markers: MapMarker[];
  priceLabel: PriceLabel;
  focus: { location: LatLng; level: number } | null;
  myLocation: LatLng | null;
  onIdle: (bbox: BBox, level: number) => void;
  onMarkerPress: (m: { id: string; kind: MapMarker['kind']; location: LatLng }) => void;
  onMapPress: (p: LatLng) => void;
  onError: (message: string) => void;
};

type FromWeb =
  | { type: 'ready' }
  | { type: 'idle'; bbox: BBox; level: number }
  | { type: 'markerPress'; id: string; kind: MapMarker['kind']; lat: number; lng: number }
  | { type: 'mapPress'; lat: number; lng: number }
  | { type: 'error'; message: string };

export function KakaoMap(props: Props) {
  const { markers, priceLabel, focus, myLocation, onIdle, onMarkerPress, onMapPress, onError } = props;
  const ref = useRef<WebViewRef>(null);
  const [ready, setReady] = useState(false);
  const dark = useColorScheme() === 'dark';

  // HTML은 처음 한 번만 만든다 (다시 만들면 지도가 처음부터 다시 로드됨)
  const [html] = useState(() =>
    buildKakaoMapHtml({ appKey: KAKAO_JS_KEY, center: props.initialCenter, level: props.initialLevel, dark }),
  );

  const post = useCallback((msg: object) => {
    ref.current?.injectJavaScript(`window.__fromApp && window.__fromApp(${JSON.stringify(msg)}); true;`);
  }, []);

  useEffect(() => {
    if (ready) post({ type: 'setMarkers', markers, priceLabel });
  }, [ready, markers, priceLabel, post]);

  useEffect(() => {
    if (ready && focus) post({ type: 'moveTo', lat: focus.location.lat, lng: focus.location.lng, level: focus.level });
  }, [ready, focus, post]);

  useEffect(() => {
    if (ready && myLocation) post({ type: 'setMyLocation', ...myLocation });
  }, [ready, myLocation, post]);

  useEffect(() => {
    if (ready) post({ type: 'setTheme', dark });
  }, [ready, dark, post]);

  const source = useMemo(() => ({ html, baseUrl: MAP_BASE_URL }), [html]);

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: FromWeb;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'ready':
        setReady(true);
        break;
      case 'idle':
        onIdle(msg.bbox, msg.level);
        break;
      case 'markerPress':
        onMarkerPress({ id: msg.id, kind: msg.kind, location: { lat: msg.lat, lng: msg.lng } });
        break;
      case 'mapPress':
        onMapPress({ lat: msg.lat, lng: msg.lng });
        break;
      case 'error':
        onError(msg.message);
        break;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <RNWebView
        ref={ref}
        source={source}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onError={(e: { nativeEvent: { description: string } }) => onError(e.nativeEvent.description)}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
