// node grades.test.mjs — 실패하면 에러로 멈춤 (정답지: 영상/cardnews-reel/capture/ep03-plan.md)
import assert from 'node:assert/strict';
import { semester, target, cumulative, fmt, title } from './grades.js';

const S = [
  { credits: 3, grade: 'A+' },
  { credits: 3, grade: 'B0' },
  { credits: 2, grade: 'C+' },
  { credits: 1, grade: 'P' },
  { credits: 3, grade: 'B+', retake: true, prev: 'F' },
  { credits: 3, grade: '' },
];

// 함정 1·2: 가중평균 38/11 = 3.45, P는 평점에서 빠지고 취득엔 포함
let r = semester(S);
assert.equal(fmt(r.gpa), '3.45');
assert.deepEqual([r.cr, r.earned, r.pending], [11, 12, 3]);

// 함정 4: 목표 3.5 → A0 (B+면 3.46으로 모자람)
let t = target(S, 3.5);
assert.deepEqual([t.state, t.letter, fmt(t.need), fmt(t.result)], ['need', 'A0', '3.67', '3.57']);
assert.equal(fmt(semester(S.map((s) => (s.grade === '' ? { ...s, grade: 'B+' } : s))).gpa), '3.46');
assert.equal(target(S, 3.0).state, 'need');
assert.equal(target(S, 4.4).state, 'impossible');
assert.equal(target(S, 2.0).state, 'done');
assert.equal(target(S.slice(0, 5), 3.5).state, 'none');

// 함정 3: 재수강 — 지난 학기 15학점 평점 3.0(미적분 F 3학점 포함)이면 F를 빼고 누적
assert.equal(fmt(cumulative(S, 3.0, 15)), '3.61'); // (45 + 38 - 0) / (15 + 11 - 3)
// 재수강 상한 B+: 재수강 과목 B+ 그대로, A0 상한이면 A+를 A0로
assert.equal(fmt(semester([{ credits: 3, grade: 'A+', retake: true }], '4.5', 'A0').gpa), '4.00');

// 4.3 만점, 빈 입력, F는 취득 안 됨
assert.equal(fmt(semester([{ credits: 3, grade: 'A+' }], '4.3').gpa), '4.30');
assert.equal(semester([]).gpa, null);
assert.equal(semester([{ credits: 3, grade: 'F' }]).earned, 0);

// 칭호
assert.equal(title(3.45).emoji, '🙂');
assert.equal(title(4.1).emoji, '🏆');
assert.equal(title(3.9, '4.3').emoji, '🏆'); // 4.5 만점으로 환산 ≈ 4.08
assert.equal(title(3.8, '4.3').emoji, '😌'); // ≈ 3.98
console.log('grades ok');
