// 학점셈 로직 (화면과 분리해서 grades.test.mjs로 검증)
// 과목: { name, credits, grade: 'A+'..'F' | 'P' | 'NP' | '' (미정), retake, prev (재수강 전 성적) }
export const SCALES = {
  '4.5': [['A+', 4.5], ['A0', 4.0], ['B+', 3.5], ['B0', 3.0], ['C+', 2.5], ['C0', 2.0], ['D+', 1.5], ['D0', 1.0], ['F', 0]],
  '4.3': [['A+', 4.3], ['A0', 4.0], ['A-', 3.7], ['B+', 3.3], ['B0', 3.0], ['B-', 2.7], ['C+', 2.3], ['C0', 2.0], ['C-', 1.7], ['D+', 1.3], ['D0', 1.0], ['D-', 0.7], ['F', 0]],
};
export const CREDITS = [0.5, 1, 2, 3, 4];

const pt = (scale, g) => SCALES[scale].find(([l]) => l === g)?.[1];
const isLetter = (scale, g) => pt(scale, g) != null;

// 재수강 상한(예: A0까지) — 학교마다 다름. cap이 없으면 그대로
function point(s, scale, cap) {
  const p = pt(scale, s.grade);
  return s.retake && cap && pt(scale, cap) != null ? Math.min(p, pt(scale, cap)) : p;
}

export function semester(subjects, scale = '4.5', cap = '') {
  let pts = 0, cr = 0, earned = 0, pending = 0;
  for (const s of subjects) {
    const c = +s.credits || 0;
    if (s.grade === '') { pending += c; continue; }
    if (s.grade === 'P') { earned += c; continue; } // P/F는 평점에서 빠지고 P만 취득
    if (s.grade === 'NP' || !isLetter(scale, s.grade)) continue;
    pts += c * point(s, scale, cap);
    cr += c;
    if (s.grade !== 'F') earned += c;
  }
  return { pts, cr, earned, pending, gpa: cr ? pts / cr : null };
}

// 미정 과목이 모두 같은 성적을 받는다고 보고, 목표에 필요한 최소 등급
export function target(subjects, goal, scale = '4.5', cap = '') {
  const { pts, cr, pending } = semester(subjects, scale, cap);
  if (!pending || !(goal > 0)) return { state: 'none' };
  const need = (goal * (cr + pending) - pts) / pending;
  if (need <= 0) return { state: 'done', need };
  const hit = [...SCALES[scale]].reverse().find(([, p]) => p >= need - 1e-9);
  if (!hit) return { state: 'impossible', need };
  return { state: 'need', need, letter: hit[0], result: (pts + hit[1] * pending) / (cr + pending) };
}

// 누적: 지난 학기 평점·평점 학점 + 이번 학기. 재수강 과목의 이전 성적은 빼기
export function cumulative(subjects, prevGpa, prevCr, scale = '4.5', cap = '') {
  const { pts, cr } = semester(subjects, scale, cap);
  let P = (+prevGpa || 0) * (+prevCr || 0) + pts, C = (+prevCr || 0) + cr;
  for (const s of subjects) {
    if (s.retake && isLetter(scale, s.prev) && isLetter(scale, s.grade)) { P -= s.credits * pt(scale, s.prev); C -= s.credits; }
  }
  return C > 0 && prevCr > 0 ? P / C : null;
}

// 소수 셋째 자리에서 반올림
export const fmt = (g) => (g == null ? '-' : (Math.round(g * 100 + 1e-9) / 100).toFixed(2));

// 학점 칭호 (기준은 재미용, 학사경고 기준은 학교마다 다름)
export function title(gpa, scale = '4.5') {
  if (gpa == null) return { emoji: '📚', text: '성적을 넣어 보세요' };
  const r = (gpa / +scale) * 4.5;
  if (r >= 4.0) return { emoji: '🏆', text: '장학금 각' };
  if (r >= 3.5) return { emoji: '😌', text: '부모님께 보여드릴 수 있음' };
  if (r >= 3.0) return { emoji: '🙂', text: '무난무난' };
  if (r >= 2.5) return { emoji: '😅', text: '아슬아슬' };
  return { emoji: '🚨', text: '학사경고 조심' };
}
