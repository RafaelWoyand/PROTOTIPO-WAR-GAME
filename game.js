/** game.js — regras do xadrez (Rules) e controle da partida (Game).
 *  Tabuleiro: array de 64 casas, índice 0 = a8, 63 = h1. Peça = 'wp', 'bk'... ou null.
 *  Estado imutável: {b, turn, cast, ep, half}. */
const Rules = (() => {
  const N = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  const K = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const D = [[1,1],[1,-1],[-1,1],[-1,-1]], R = [[1,0],[-1,0],[0,1],[0,-1]];
  const ok = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const opp = c => (c === 'w' ? 'b' : 'w');
  const sq = i => 'abcdefgh'[i & 7] + (8 - (i >> 3));

  function start() {
    const b = Array(64).fill(null), o = 'rnbqkbnr';
    for (let f = 0; f < 8; f++) { b[f] = 'b' + o[f]; b[8 + f] = 'bp'; b[48 + f] = 'wp'; b[56 + f] = 'w' + o[f]; }
    return { b, turn: 'w', cast: { wK: 1, wQ: 1, bK: 1, bQ: 1 }, ep: -1, half: 0 };
  }

  /** A casa `s` é atacada por alguma peça da cor `by`? */
  function attacked(b, s, by) {
    const r = s >> 3, c = s & 7, at = (rr, cc) => (ok(rr, cc) ? b[rr * 8 + cc] : null);
    const pr = by === 'w' ? r + 1 : r - 1;
    for (const dc of [-1, 1]) if (at(pr, c + dc) === by + 'p') return true;
    for (const [dr, dc] of N) if (at(r + dr, c + dc) === by + 'n') return true;
    for (const [dr, dc] of K) if (at(r + dr, c + dc) === by + 'k') return true;
    for (const [dirs, types] of [[R, 'rq'], [D, 'bq']])
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (ok(rr, cc)) {
          const p = b[rr * 8 + cc];
          if (p) { if (p[0] === by && types.includes(p[1])) return true; break; }
          rr += dr; cc += dc;
        }
      }
    return false;
  }

  /** Movimentos pseudo-legais (ainda sem verificar se deixam o rei em xeque). */
  function pseudo(s, i) {
    const p = s.b[i], c = p[0], t = p[1], r = i >> 3, f = i & 7, o = opp(c), m = [];
    const add = (to, x) => m.push({ from: i, to, ...x });
    if (t === 'p') {
      const d = c === 'w' ? -1 : 1, st = c === 'w' ? 6 : 1, last = c === 'w' ? 0 : 7, r1 = r + d;
      const push = (to, x = {}) => { if (to >> 3 === last) for (const q of 'qrbn') add(to, { ...x, promo: q }); else add(to, x); };
      if (ok(r1, f) && !s.b[r1 * 8 + f]) {
        push(r1 * 8 + f);
        if (r === st && !s.b[(r + 2 * d) * 8 + f]) add((r + 2 * d) * 8 + f, { dbl: 1 });
      }
      for (const dc of [-1, 1]) {
        if (!ok(r1, f + dc)) continue;
        const to = r1 * 8 + f + dc, q = s.b[to];
        if (q && q[0] === o) push(to, { cap: 1 });
        else if (to === s.ep) add(to, { ep: 1, cap: 1 });
      }
    } else if (t === 'n' || t === 'k') {
      for (const [dr, dc] of t === 'n' ? N : K) {
        if (!ok(r + dr, f + dc)) continue;
        const to = (r + dr) * 8 + f + dc, q = s.b[to];
        if (!q || q[0] === o) add(to, { cap: q ? 1 : 0 });
      }
      if (t === 'k') {
        const row = c === 'w' ? 56 : 0;
        if (i === row + 4 && !attacked(s.b, i, o)) {
          if (s.cast[c + 'K'] && !s.b[row + 5] && !s.b[row + 6] && s.b[row + 7] === c + 'r' && !attacked(s.b, row + 5, o))
            add(row + 6, { castle: 'K' });
          if (s.cast[c + 'Q'] && !s.b[row + 1] && !s.b[row + 2] && !s.b[row + 3] && s.b[row] === c + 'r' && !attacked(s.b, row + 3, o))
            add(row + 2, { castle: 'Q' });
        }
      }
    } else {
      for (const [dr, dc] of t === 'r' ? R : t === 'b' ? D : [...R, ...D]) {
        let rr = r + dr, cc = f + dc;
        while (ok(rr, cc)) {
          const to = rr * 8 + cc, q = s.b[to];
          if (!q) add(to, { cap: 0 });
          else { if (q[0] === o) add(to, { cap: 1 }); break; }
          rr += dr; cc += dc;
        }
      }
    }
    return m;
  }

  /** Aplica um movimento e devolve o novo estado. */
  function apply(s, mv) {
    const b = s.b.slice(), p = b[mv.from], c = p[0], cast = { ...s.cast };
    b[mv.from] = null;
    b[mv.to] = mv.promo ? c + mv.promo : p;
    if (mv.ep) b[mv.to + (c === 'w' ? 8 : -8)] = null;
    if (mv.castle) {
      const row = (mv.from >> 3) << 3;
      if (mv.castle === 'K') { b[row + 5] = b[row + 7]; b[row + 7] = null; }
      else { b[row + 3] = b[row]; b[row] = null; }
    }
    if (p[1] === 'k') cast[c + 'K'] = cast[c + 'Q'] = 0;
    for (const [q, k] of [[0, 'bQ'], [7, 'bK'], [56, 'wQ'], [63, 'wK']]) if (mv.from === q || mv.to === q) cast[k] = 0;
    return { b, turn: opp(c), cast, ep: mv.dbl ? (mv.from + mv.to) / 2 : -1, half: p[1] === 'p' || mv.cap ? 0 : s.half + 1 };
  }

  const kingPos = (b, c) => b.indexOf(c + 'k');
  const inCheck = (s, c = s.turn) => attacked(s.b, kingPos(s.b, c), opp(c));
  /** Movimentos legais da peça na casa i. */
  function legal(s, i) {
    const c = s.b[i][0];
    return pseudo(s, i).filter(mv => { const n = apply(s, mv); return !attacked(n.b, kingPos(n.b, c), opp(c)); });
  }
  function all(s) {
    const out = [];
    s.b.forEach((p, i) => { if (p && p[0] === s.turn) out.push(...legal(s, i)); });
    return out;
  }
  const key = s => s.b.map(p => p || '-').join('') + s.turn + Object.values(s.cast).join('') + s.ep;
  function insufficient(b) {
    const ps = b.filter(p => p && p[1] !== 'k');
    return !ps.length || (ps.length === 1 && 'bn'.includes(ps[0][1]));
  }
  return { start, apply, legal, all, inCheck, attacked, key, insufficient, sq };
})();

/** Controle da partida: turnos, histórico, desfazer e fim de jogo. */
class Game {
  constructor() { this.reset(); }
  reset() { this.s = Rules.start(); this.log = []; this.keys = [Rules.key(this.s)]; this.update(); }
  update() {
    const n = Rules.all(this.s).length, chk = Rules.inCheck(this.s), kk = this.keys;
    let over = null;
    if (!n) over = chk ? { type: 'mate', winner: this.s.turn === 'w' ? 'b' : 'w' } : { type: 'draw', why: 'Afogamento (sem jogadas legais)' };
    else if (this.s.half >= 100) over = { type: 'draw', why: 'Regra dos 50 lances' };
    else if (Rules.insufficient(this.s.b)) over = { type: 'draw', why: 'Material insuficiente' };
    else if (kk.filter(k => k === kk[kk.length - 1]).length >= 3) over = { type: 'draw', why: 'Tripla repetição' };
    this.check = chk; this.over = over;
  }
  /** Movimentos legais da peça em i (vazio se não for a vez dela ou se o jogo acabou). */
  moves(i) { const p = this.s.b[i]; return !this.over && p && p[0] === this.s.turn ? Rules.legal(this.s, i) : []; }
  /** Executa a jogada se for legal; devolve true/false. */
  play(from, to, promo) {
    const mv = this.moves(from).find(m => m.to === to && (m.promo || null) === (promo || null));
    if (!mv) return false;
    const p = this.s.b[from], cap = mv.ep ? this.s.b[to + (p[0] === 'w' ? 8 : -8)] : this.s.b[to];
    const e = { prev: this.s, mv, piece: p, cap };
    this.log.push(e);
    this.s = Rules.apply(this.s, mv); this.keys.push(Rules.key(this.s)); this.update();
    e.txt = (mv.castle ? (mv.castle === 'K' ? 'O-O' : 'O-O-O') : Rules.sq(from) + (cap ? 'x' : '-') + Rules.sq(to) + (mv.promo ? '=' + mv.promo.toUpperCase() : ''))
      + (this.over && this.over.type === 'mate' ? '#' : this.check ? '+' : '');
    return true;
  }
  undo() { if (!this.log.length) return false; this.s = this.log.pop().prev; this.keys.pop(); this.update(); return true; }
  last() { const e = this.log[this.log.length - 1]; return e ? e.mv : null; }
}
if (typeof module !== 'undefined') module.exports = Rules;
