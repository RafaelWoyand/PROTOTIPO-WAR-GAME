/** board.js — constrói e desenha o tabuleiro 8x8 com coordenadas nas bordas. */
const Board = {
  cells: [],
  build(root, onClick) {
    root.innerHTML = ''; this.cells = [];
    const lab = t => { const d = document.createElement('div'); d.className = 'lab'; d.textContent = t; return d; };
    const files = () => { root.append(lab('')); for (const f of 'abcdefgh') root.append(lab(f)); root.append(lab('')); };
    files();
    for (let r = 0; r < 8; r++) {
      root.append(lab(8 - r));
      for (let c = 0; c < 8; c++) {
        const i = r * 8 + c, d = document.createElement('div');
        d.dataset.c = (r + c) % 2 ? 'dark' : 'light';
        d.onclick = () => onClick(i);
        this.cells[i] = d; root.append(d);
      }
      root.append(lab(8 - r));
    }
    files();
  },
  /** o = {sel, targets:[movimentos], last:movimento, check:índice do rei em xeque} */
  render(s, o) {
    const tg = new Map(o.targets.map(m => [m.to, m]));
    s.b.forEach((p, i) => {
      const d = this.cells[i];
      let c = 'sq ' + d.dataset.c;
      if (i === o.sel) c += ' sel';
      if (tg.has(i)) c += tg.get(i).cap ? ' tgt cap' : ' tgt';
      if (o.last && (i === o.last.from || i === o.last.to)) c += ' last';
      if (i === o.check) c += ' chk';
      d.className = c;
      d.replaceChildren(...(p ? [Pieces.el(p)] : []));
    });
  }
};
