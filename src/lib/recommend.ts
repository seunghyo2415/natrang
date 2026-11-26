// recommend.ts: 지금 상황(장소·일정 종류·시간)에 맞는 추천 문구 고르기
import tipsJson from '../data/tips.json'
import type { ItemKind } from '../types'

export interface Recommendation {
  id: string
  when: { places?: string[]; kinds?: string[]; days?: number[]; from?: string; to?: string }
  icon: string
  title: string
  text: string
  placeId?: string
}

const recs = tipsJson.recommendations as Recommendation[]

/** 조건에 맞는 추천을 최대 max개 (구체적인 조건이 많은 것 먼저) */
export function pickRecommendations(
  ctx: { placeId?: string; kind: ItemKind; day: number; localTime: string },
  max = 3,
): Recommendation[] {
  const match = recs.filter(({ when: w }) => {
    if (w.places && (!ctx.placeId || !w.places.includes(ctx.placeId))) return false
    if (w.kinds && !w.kinds.includes(ctx.kind)) return false
    if (w.days && !w.days.includes(ctx.day)) return false
    if (w.from && ctx.localTime < w.from) return false
    if (w.to && ctx.localTime > w.to) return false
    return true
  })
  const score = (r: Recommendation) => Object.keys(r.when).length
  return match.sort((a, b) => score(b) - score(a)).slice(0, max)
}
