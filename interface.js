/** interface.js — interação do jogador, painéis, histórico e promoção. */
const UI = {
  sel: null, mv: [], promoting: false,
  init() {
    this.g = new Game();
    Board.build(document.getElementById('board'), i => this.click(i));
    document.getElementById('btn-undo').onclick = () => { this.g.undo(); this.clear(); this.draw(); };
    document.getElementById('btn-restart').onclick = () => {
      if (confirm('Reiniciar a partida? O progresso atual será perdido.')) { this.g.reset(); this.clear(); this.draw(); }
    };
    this.draw();
  },
  clear() { this.sel = null; this.mv = []; this.promoting = false; document.getElementById('promo').hidden = true; },
  click(i) {
    const g = this.g;
    if (g.over || this.promoting) return;
    const hit = this.mv.filter(m => m.to === i);
    if (this.sel !== null && hit.length) {
      if (hit[0].promo) return this.askPromo(hit[0].to);
      g.play(this.sel, i); this.clear();
    } else {
      const p = g.s.b[i];
      if (p && p[0] === g.s.turn && i !== this.sel) { this.sel = i; this.mv = g.moves(i); } else this.clear();
    }
    this.draw();
  },
  askPromo(to) {
    this.promoting = true;
    const box = document.getElementById('promo'), c = this.g.s.turn;
    box.innerHTML = '<p>Promover infantaria a:</p>';
    for (const t of 'qrbn') {
      const b = document.createElement('button');
      b.append(Pieces.el(c + t));
      b.append(Pieces.info[t].nome);
      b.onclick = () => { const from = this.sel; this.clear(); this.g.play(from, to, t); this.draw(); };
      box.append(b);
    }
    box.hidden = false;
  },
  draw() {
    const g = this.g, s = g.s, A = Pieces.armies;
    Board.render(s, { sel: this.sel, targets: this.mv, last: g.last(), check: g.check ? s.b.indexOf(s.turn + 'k') : -1 });
    const st = document.getElementById('status');
    if (g.over) st.textContent = g.over.type === 'mate' ? `XEQUE-MATE. Vitória: ${A[g.over.winner].nome}` : `EMPATE: ${g.over.why}`;
    else st.textContent = `Vez dos ${A[s.turn].nome}` + (g.check ? ': XEQUE!' : '');
    st.className = g.over ? 'over' : g.check ? 'check' : '';
    for (const c of ['w', 'b']) {
      const p = document.getElementById('p-' + c);
      p.classList.toggle('active', !g.over && s.turn === c);
      p.querySelector('.turn').textContent = g.over ? (g.over.winner === c ? 'Vitoriosos' : '') : s.turn === c ? 'Em ação' : 'Aguardando';
      p.querySelector('.cap').textContent = g.log.filter(e => e.cap && e.piece[0] === c).map(e => Pieces.info[e.cap[1]].ico).join(' ');
    }
    const h = document.getElementById('hist');
    h.replaceChildren();
    g.log.forEach((e, i) => {
      const li = document.createElement('li');
      li.textContent = `${(i >> 1) + 1}. ${A[e.piece[0]].nome} ${Pieces.info[e.piece[1]].ico} ${e.txt}`;
      h.append(li);
    });
    h.scrollTop = h.scrollHeight;
    document.getElementById('btn-undo').disabled = !g.log.length;
  }
};
