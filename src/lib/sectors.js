// Plain module (no React) so the API functions can use it too.

/* Categories are free-form Korean text from the generator (180+ variants).
   Map them onto a small, stable sector list for filters; order matters —
   "AI 신약개발" should land in 헬스·바이오 before the generic AI bucket. */
export const SECTORS = [
  { key: 'health', label: '헬스·바이오', re: /헬스|의료|바이오|신약|치료|DTx|뇌과학|장수|청각|슬립|세포|합성생물|약 배송|진단/i },
  { key: 'robotics', label: '로보틱스·제조', re: /로봇|로보|자율|물류 자동화|라스트마일|산업|스마트팩토리|예지|IoT|피지컬/i },
  { key: 'mobility', label: '모빌리티·우주', re: /모빌리티|eVTOL|항공|우주|발사체|스페이스|위성|디펜스|국방/i },
  { key: 'climate', label: '기후·에너지', re: /기후|클린|에너지|탄소|카본|공기 포집|배터리|EV 인프라|그리드|수처리|워터|지속가능|농|애그|단백질|푸드|바이오소재|화학/i },
  { key: 'fintech', label: '핀테크', re: /핀테크|FinTech|금융|뱅킹|결제|보험|인슈어|머니|Web3|크립토|블록체인|오라클/i },
  { key: 'infra', label: 'AI 인프라·반도체', re: /반도체|NPU|GPU|데이터센터|추론|클라우드|서버리스|MLOps|ML 인프라|인프라|양자|하드웨어|엣지|온디바이스|경량화|아키텍처/i },
  { key: 'devtools', label: '개발자 도구', re: /데브|개발자|코딩|DevOps|옵저버빌리티|스펙 기반/i },
  { key: 'enterprise', label: '엔터프라이즈', re: /SaaS|엔터프라이즈|HR|성과|지식|문서|검색|보안|인증|컴플라이언스|규제|리갈|프로젝트|공급망|물류 플랫폼|데이터 플랫폼|고객지원|프롭|부동산|건설|외식|빌딩|B2B/i },
  { key: 'consumer', label: '컨슈머·교육', re: /에듀|EdTech|학습|교육|튜터|게이밍|크리에이|퍼블리싱|VR|XR|공간 컴퓨팅|컨슈머|모바일 앱|실시간 3D/i },
  { key: 'ai', label: 'AI 모델·에이전트', re: /AI|LLM|파운데이션|에이전트|모델|음성|진화 알고리즘|비전/i },
]
export const OTHER_SECTOR = { key: 'other', label: '기타' }

export function sectorOf(categories = []) {
  for (const c of categories) {
    const hit = SECTORS.find((s) => s.re.test(c))
    if (hit) return hit
  }
  return OTHER_SECTOR
}

