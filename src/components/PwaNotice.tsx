// PwaNotice: 오프라인 준비 완료 알림 · 「업데이트 있음」 알림
// 서비스 워커(=앱 파일을 폰에 미리 저장해 두고, 인터넷이 없을 때 대신 꺼내 주는 작은 도우미)와 대화하는 부분
import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000

export function PwaNotice() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // 앱을 오래 켜 둬도 1시간마다 새 버전이 있는지 살짝 확인 (인터넷 될 때만)
    onRegisteredSW(_url, reg) {
      if (!reg) return
      setInterval(() => {
        if (navigator.onLine) reg.update().catch(() => {})
      }, HOUR)
    },
  })

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-lg px-4" role="status">
      <div className="rounded-3xl bg-slate-900 p-4 text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
        {needRefresh ? (
          <>
            <div className="text-lg font-bold">🔄 업데이트 있음</div>
            <p className="mb-3 text-sm opacity-80">새 버전이 준비됐어요. 입력한 금액·체크·수정 내용은 그대로 남아요.</p>
            <div className="flex gap-2">
              <button onClick={() => updateServiceWorker(true)} className="flex-1 rounded-2xl bg-sky-500 py-3 font-bold text-white">
                지금 업데이트
              </button>
              <button onClick={() => setNeedRefresh(false)} className="rounded-2xl px-4 py-3 font-bold opacity-80">
                나중에
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold">✅ 오프라인 준비 완료</div>
              <p className="text-sm opacity-80">이제 인터넷 없이도 앱이 열려요</p>
            </div>
            <button onClick={() => setOfflineReady(false)} className="shrink-0 rounded-2xl bg-sky-500 px-4 py-2.5 font-bold text-white">
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
