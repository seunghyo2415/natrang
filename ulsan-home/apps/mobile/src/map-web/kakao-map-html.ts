/**
 * WebView 안에서 실행되는 카카오맵 페이지.
 *
 * 앱 → 지도 : window.__fromApp({ type, ... })   (injectJavaScript 로 호출)
 *   - setMarkers { markers, priceLabel }
 *   - moveTo     { lat, lng, level }
 *   - setMyLocation { lat, lng }
 *   - setTheme   { dark }
 * 지도 → 앱 : window.ReactNativeWebView.postMessage(JSON.stringify({ type, ... }))
 *   - ready
 *   - idle        { bbox: { sw, ne }, level }
 *   - markerPress { id, kind, lat, lng }
 *   - mapPress    { lat, lng }
 *   - error       { message }
 *
 * 카카오 JavaScript 키는 "공개용" 키라 앱에 들어가도 되지만,
 * 카카오 개발자 콘솔에서 허용 도메인(http://localhost)을 등록해야 동작합니다.
 */
export const MAP_BASE_URL = 'http://localhost';

export function buildKakaoMapHtml(opts: {
  appKey: string;
  center: { lat: number; lng: number };
  level: number;
  dark: boolean;
}) {
  const init = JSON.stringify(opts);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
  body { font-family: -apple-system, 'Noto Sans KR', sans-serif; -webkit-tap-highlight-color: transparent; }
  .m { transform: translateY(-4px); cursor: pointer; user-select: none; }
  .cx { background: #1F6FEB; color: #fff; border-radius: 10px; padding: 5px 8px; font-size: 12px;
        line-height: 1.25; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,.25); white-space: nowrap; position: relative; }
  .cx:after { content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px;
        border: 6px solid transparent; border-bottom: 0; border-top-color: #1F6FEB; }
  .cx b { display: block; font-size: 13px; }
  .cx .n { opacity: .9; font-size: 11px; max-width: 96px; overflow: hidden; text-overflow: ellipsis; }
  .rg { background: rgba(21,23,26,.88); color: #fff; border-radius: 999px; padding: 8px 12px; font-size: 13px;
        text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.3); white-space: nowrap; }
  .rg b { font-size: 14px; }
  .rg .s { display: block; font-size: 11px; opacity: .85; }
  .dark .rg { background: rgba(241,243,245,.92); color: #15171A; }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #1F6FEB; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(31,111,235,.25); }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  var INIT = ${init};
  var map = null, overlays = [], meOverlay = null;
  if (INIT.dark) document.body.classList.add('dark');

  function send(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  window.onerror = function (m) { send({ type: 'error', message: String(m) }); };

  function fmtPrice(manwon) {
    if (manwon == null) return '-';
    if (manwon >= 10000) {
      var e = manwon / 10000;
      return (e >= 10 ? e.toFixed(0) : e.toFixed(1).replace(/\\.0$/, '')) + '억';
    }
    return Math.round(manwon).toLocaleString('ko-KR') + '만';
  }

  function el(cls, parts) {
    var d = document.createElement('div');
    d.className = 'm ' + cls;
    parts.forEach(function (p) {
      var s = document.createElement(p[0]);
      if (p[1]) s.className = p[1];
      s.textContent = p[2];
      d.appendChild(s);
    });
    return d;
  }

  function clearOverlays() {
    overlays.forEach(function (o) { o.setMap(null); });
    overlays = [];
  }

  function setMarkers(markers, priceLabel) {
    clearOverlays();
    markers.forEach(function (m) {
      var node;
      if (m.kind === 'region') {
        var sub = m.avgPricePerPyeong != null ? '평당 ' + fmtPrice(m.avgPricePerPyeong) : '';
        node = el('rg', [['b', '', m.name + ' ' + m.count + '단지'], ['span', 's', sub]]);
      } else {
        var main = priceLabel === 'price' ? fmtPrice(m.recentPrice)
                 : priceLabel === 'pyeong' ? '평당 ' + fmtPrice(m.pricePerPyeong) : '';
        node = el('cx', main ? [['b', '', main], ['div', 'n', m.name]] : [['div', 'n', m.name]]);
      }
      node.addEventListener('click', function (ev) {
        ev.stopPropagation();
        send({ type: 'markerPress', id: m.id, kind: m.kind, lat: m.location.lat, lng: m.location.lng });
      });
      var o = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(m.location.lat, m.location.lng),
        content: node, yAnchor: 1, clickable: true, zIndex: m.kind === 'region' ? 2 : 3
      });
      o.setMap(map);
      overlays.push(o);
    });
  }

  function reportIdle() {
    var b = map.getBounds(), sw = b.getSouthWest(), ne = b.getNorthEast();
    send({ type: 'idle', level: map.getLevel(),
      bbox: { sw: { lat: sw.getLat(), lng: sw.getLng() }, ne: { lat: ne.getLat(), lng: ne.getLng() } } });
  }

  window.__fromApp = function (msg) {
    if (!map) return;
    if (msg.type === 'setMarkers') setMarkers(msg.markers, msg.priceLabel);
    else if (msg.type === 'moveTo') {
      map.setLevel(msg.level);
      map.setCenter(new kakao.maps.LatLng(msg.lat, msg.lng));
    } else if (msg.type === 'setMyLocation') {
      var pos = new kakao.maps.LatLng(msg.lat, msg.lng);
      if (!meOverlay) {
        var d = document.createElement('div'); d.className = 'me';
        meOverlay = new kakao.maps.CustomOverlay({ position: pos, content: d, zIndex: 5 });
        meOverlay.setMap(map);
      } else meOverlay.setPosition(pos);
    } else if (msg.type === 'setTheme') {
      document.body.classList.toggle('dark', !!msg.dark);
    }
  };

  var loadTimer = setTimeout(function () {
    if (!map) send({ type: 'error', message: '지도를 불러오지 못했어요 (시간 초과). 키와 허용 도메인을 확인하세요.' });
  }, 10000);

  var s = document.createElement('script');
  s.src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' + encodeURIComponent(INIT.appKey);
  s.onerror = function () { send({ type: 'error', message: '카카오맵 SDK를 내려받지 못했어요. 인터넷 연결을 확인하세요.' }); };
  s.onload = function () {
    if (!window.kakao || !kakao.maps) {
      send({ type: 'error', message: '카카오맵 키가 올바르지 않거나 허용 도메인이 등록되지 않았어요.' });
      return;
    }
    kakao.maps.load(function () {
      clearTimeout(loadTimer);
      map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(INIT.center.lat, INIT.center.lng), level: INIT.level
      });
      map.setMaxLevel(12);
      kakao.maps.event.addListener(map, 'idle', reportIdle);
      kakao.maps.event.addListener(map, 'click', function (e) {
        send({ type: 'mapPress', lat: e.latLng.getLat(), lng: e.latLng.getLng() });
      });
      send({ type: 'ready' });
      reportIdle();
    });
  };
  document.head.appendChild(s);
})();
</script>
</body>
</html>`;
}

/** 카카오 지도 레벨(1=가장 가까이 ~ 14=가장 멀리) → 마커 묶음 단위 */
export function levelToMode(level: number): 'sigungu' | 'dong' | 'complex' {
  if (level >= 8) return 'sigungu';
  if (level >= 6) return 'dong';
  return 'complex';
}
