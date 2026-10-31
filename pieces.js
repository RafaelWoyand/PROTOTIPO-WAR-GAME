/** pieces.js — mapeia as peças do xadrez para unidades da Segunda Guerra.
 *  Códigos internos: 'w' = Aliados, 'b' = Eixo; k,q,r,b,n,p = rei...peão. */
const Pieces = {
  info: {
    k: { nome: 'General',        ico: '🎖️', cod: 'GEN' },
    q: { nome: 'Comandante',     ico: '⭐', cod: 'CMD' },
    r: { nome: 'Tanque',         ico: '🛡️', cod: 'TNK' },
    b: { nome: 'Artilharia',     ico: '💥', cod: 'ART' },
    n: { nome: 'Reconhecimento', ico: '🚙', cod: 'REC' },
    p: { nome: 'Infantaria',     ico: '🪖', cod: 'INF' }
  },
  armies: { w: { nome: 'Aliados', cls: 'aliados' }, b: { nome: 'Eixo', cls: 'eixo' } },
  /** Cria o token visual de uma unidade (ex.: 'wk'). */
  el(code) {
    const i = this.info[code[1]], a = this.armies[code[0]];
    const d = document.createElement('div');
    d.className = 'unit ' + a.cls;
    d.title = `${i.nome} (${a.nome})`;
    d.innerHTML = `<span class="ico">${i.ico}</span><span class="cod">${i.cod}</span>`;
    return d;
  }
};
