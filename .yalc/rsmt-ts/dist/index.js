"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_glpk = __toESM(require("glpk.js"));
function getEmptyRects(terminals, successors) {
  const ret = [];
  for (let i = 0; i < terminals.length; i++) {
    ret[i] = [];
    for (let j = 0; j < i; j++) {
      ret[i][j] = false;
    }
  }
  const set = (i, j) => {
    if (i > j) {
      ret[i][j] = true;
    } else if (i < j) {
      ret[j][i] = true;
    }
  };
  for (let i = 0; i < terminals.length; i++) {
    const p = terminals[i];
    const [x, y] = p;
    let topDist = Infinity;
    let bottomDist = Infinity;
    let oldTopDist = Infinity;
    let oldBottomDist = Infinity;
    let topX = x;
    let bottomX = x;
    for (let j = successors.east[i]; j >= 0; j = successors.east[j]) {
      const q = terminals[j];
      const dx = q[0] - x;
      let dy = q[1] - y;
      if (dx === 0 || dy === 0) {
        set(i, j);
        continue;
      }
      if (dy > 0) {
        if (dy <= topDist) {
          set(i, j);
          if (q[0] > topX) {
            oldTopDist = topDist;
            topX = q[0];
          }
          topDist = dy;
        } else if (q[0] === topX && dy <= oldTopDist) {
          set(i, j);
        }
      } else {
        dy = -dy;
        if (dy <= bottomDist) {
          set(i, j);
          if (q[0] > bottomX) {
            oldBottomDist = bottomDist;
            bottomX = q[0];
          }
          bottomDist = dy;
        } else if (q[0] === bottomX && dy <= oldBottomDist) {
          set(i, j);
        }
      }
    }
  }
  return ret;
}
function isEmptyRect(emptyRects, i, j) {
  if (i > j) {
    return emptyRects[i][j];
  } else if (i < j) {
    return emptyRects[j][i];
  } else {
    return true;
  }
}
var DSUF = class {
  map;
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  areConnected(i, j) {
    return this.map.has(i) && this.map.get(i).has(j);
  }
  connect(i, j) {
    const seti = this.map.get(i);
    const setj = this.map.get(j);
    if (!seti && !setj) {
      const union = /* @__PURE__ */ new Set([i, j]);
      this.map.set(i, union);
      this.map.set(j, union);
    } else if (!seti) {
      setj.add(i);
      this.map.set(i, setj);
    } else if (!setj) {
      seti.add(j);
      this.map.set(j, seti);
    } else if (seti !== setj) {
      const [bigger, smaller] = seti.size > setj.size ? [seti, setj] : [setj, seti];
      smaller.forEach((t) => {
        bigger.add(t);
        this.map.set(t, bigger);
      });
      bigger.add(i);
      bigger.add(j);
    }
  }
  find(i) {
    const set = this.map.get(i);
    return set ? set.values().next().value : i;
  }
};
function mst(edges) {
  edges.sort((a, b) => a.len - b.len);
  const dsuf = new DSUF();
  const ret = [];
  edges.forEach((e) => {
    if (!dsuf.areConnected(e.p1, e.p2)) {
      ret.push(e);
      dsuf.connect(e.p1, e.p2);
    }
  });
  return ret;
}
function RDIST(t1, t2) {
  return Math.abs(t1[0] - t2[0]) + Math.abs(t1[1] - t2[1]);
}
function DSTDIR(dir, a, b) {
  const axis = dir % 2;
  return Math.abs(a[axis] - b[axis]);
}
function DSTDIRP(dir, a, b) {
  const axis = 1 - dir % 2;
  return Math.abs(a[axis] - b[axis]);
}
function SPOINT(dir, a, b) {
  return dir % 2 ? [a[0], b[1]] : [b[0], a[1]];
}
function getEdges(terminals, emptyRects = []) {
  const edges = [];
  for (let i = 0; i < terminals.length; i++) {
    for (let j = i + 1; j < terminals.length; j++) {
      edges.push({
        p1: i,
        p2: j,
        len: RDIST(terminals[i], terminals[j])
      });
    }
  }
  return edges;
}
function getRmst(terminals, emptyRects = []) {
  const edges = getEdges(terminals, emptyRects);
  const theMst = mst(edges);
  return theMst;
}
function getBSDs(mst2) {
  const edges = [{ p1: 0, p2: 0, len: 0 }, ...mst2];
  const adjacency = getAdjacency(mst2);
  const bsds = { parent: [], edge: [], adjacency, edges };
  let next = mst2.length + 1;
  bsds.parent[next] = bsds.edge[next] = null;
  for (let i = 1; i < edges.length; i++) {
    let { p1: u, p2: v } = edges[i];
    let pu = bsds.parent[u];
    let pv = bsds.parent[v];
    while (u !== v && pu && pv) {
      u = pu;
      v = pv;
      pu = bsds.parent[u];
      pv = bsds.parent[v];
    }
    if (!pu && !pv) {
      next++;
      bsds.parent[u] = next;
      bsds.parent[v] = next;
      bsds.edge[u] = i;
      bsds.edge[v] = i;
    } else if (!pu && pv) {
      bsds.parent[u] = pv;
      bsds.edge[u] = i;
    } else if (pu && !pv) {
      bsds.parent[v] = pu;
      bsds.edge[v] = i;
    }
  }
  for (let i = 0; i <= next; i++) {
    if (!bsds.parent[i])
      bsds.parent[i] = null;
    if (!bsds.edge[i])
      bsds.edge[i] = null;
  }
  return bsds;
}
function bsd(bsds, i, j) {
  if (i === j)
    return 0;
  let index = -1;
  while (i !== j) {
    let ei = bsds.edge[i];
    let ej = bsds.edge[j];
    if (ei > index)
      index = ei;
    if (ej > index)
      index = ej;
    i = bsds.parent[i];
    j = bsds.parent[j];
  }
  return bsds.edges[index].len;
}
function getAdjacency(edges) {
  const ret = [];
  edges.forEach((edge, i) => {
    const { p1, p2 } = edge;
    if (!ret[p1])
      ret[p1] = [];
    if (!ret[p2])
      ret[p2] = [];
    ret[p1].push({ edge: i, node: p2 });
    ret[p2].push({ edge: i, node: p1 });
  });
  return ret;
}
function getBmst(terms, bsds) {
  const edges = [];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      edges.push({
        p1: i,
        p2: j,
        len: bsd(bsds, terms[i], terms[j])
      });
    }
  }
  const theMst = mst(edges);
  return theMst;
}
function getBmstLength(terms, bsds) {
  const theMst = getBmst(terms, bsds);
  let total = 0;
  theMst.forEach((e) => {
    total += e.len;
  });
  return total;
}
function rfst(terminals) {
  const successors = getSuccessors(terminals);
  const emptyRects = getEmptyRects(terminals, successors);
  const ub0 = getUb0(terminals, successors);
  const mst2 = getRmst(terminals);
  const bsds = getBSDs(mst2);
  const zt = getZt(terminals, successors, ub0, emptyRects, bsds);
  const ub1 = getUb1(terminals, successors, zt);
  const ctx = {
    terminals,
    successors,
    emptyRects,
    ub0,
    bsds,
    zt,
    ub1,
    fsp: [],
    fsphash: {}
  };
  for (let dir = 0; dir < 2; dir++) {
    for (let i = 0; i < terminals.length; i++) {
      const fts = {
        terms: [i],
        longterms: [i, -1],
        maxedges: [],
        shortterm: [],
        lrindex: [],
        term_check: [],
        hash: [],
        length: 0,
        dir,
        ubLength: 0,
        ubShortleg: [Infinity, Infinity],
        longindex: 0
      };
      fts.maxedges[i] = 0;
      for (let j = 0; j < terminals.length; j++) {
        fts.lrindex[j] = 0;
        fts.term_check[j] = false;
        fts.hash[j] = null;
      }
      growFST(ctx, fts);
    }
  }
  mst2.forEach(({ p1, p2, len }) => {
    testAndSaveFst(ctx, {
      terms: [p1, p2],
      length: len,
      dir: 0,
      type: 1
    });
  });
  return { terminals, fsts: ctx.fsp };
}
function getSuccessors(terminals) {
  const { x: xOrdered, y: yOrdered } = getOrderedIndices(terminals);
  const west = [];
  const east = [];
  const north = [];
  const south = [];
  for (let i = 0; i < terminals.length; i++) {
    west[i] = east[i] = north[i] = south[i] = -1;
  }
  for (let i = 1; i < terminals.length; i++) {
    west[xOrdered[i]] = xOrdered[i - 1];
    east[xOrdered[i - 1]] = xOrdered[i];
    north[yOrdered[i]] = yOrdered[i - 1];
    south[yOrdered[i - 1]] = yOrdered[i];
  }
  return { west, east, north, south };
}
function getOrderedIndices(terminals) {
  const indicesX = Array.from(Array(terminals.length).keys());
  const indicesY = indicesX.slice();
  indicesX.sort((a, b) => {
    const [tax, tay] = terminals[a];
    const [tbx, tby] = terminals[b];
    if (tax > tbx)
      return 1;
    if (tax < tbx)
      return -1;
    if (tay > tby)
      return 1;
    if (tay < tby)
      return -1;
    return a - b;
  });
  indicesY.sort((a, b) => {
    const [tax, tay] = terminals[a];
    const [tbx, tby] = terminals[b];
    if (tay > tby)
      return 1;
    if (tay < tby)
      return -1;
    if (tax > tbx)
      return 1;
    if (tax < tbx)
      return -1;
    return a - b;
  });
  return { x: indicesX, y: indicesY };
}
function getUb0(terminals, successors) {
  const dirs = ["east", "south", "west", "north"];
  const ub0 = {};
  dirs.forEach((d, di) => {
    const succ = successors[d];
    const arr = ub0[d] = [];
    terminals.forEach((p, i) => {
      let bound = Infinity;
      for (let j = succ[i]; j >= 0; j = succ[j]) {
        const p2 = terminals[j];
        const d1 = DSTDIR(di, p, p2);
        if (d1 > bound)
          break;
        const d2 = DSTDIRP(di, p, p2);
        if (d1 > d2) {
          const d3 = d1 + d2;
          if (d3 < bound) {
            bound = d3;
          }
        }
      }
      arr[i] = bound;
    });
  });
  return ub0;
}
function getZt(terminals, successors, ub0s, emptyRects, bsds) {
  const dirs = ["east", "south", "west", "north"];
  const zt = {};
  dirs.forEach((d, di) => {
    zt[d] = [];
    const dirp = dirs[[3, 2, 3, 2][di]];
    const succ = successors[d];
    const ub0 = ub0s[d];
    const ub0p = ub0s[dirp];
    for (let i = 0; i < terminals.length; i++) {
      zt[d][i] = [];
      const p1 = terminals[i];
      let limit = ub0[i];
      for (let j = succ[i]; j >= 0; j = succ[j]) {
        const p2 = terminals[j];
        const d1 = DSTDIR(di, p1, p2);
        if (d1 === 0)
          continue;
        if (d1 > limit)
          break;
        const d2 = DSTDIRP(di, p1, p2);
        if (d2 === 0)
          break;
        const lr = isLeft(di, p1, p2) === [0, 1, 1, 0][di];
        if (!lr)
          continue;
        if (d2 > ub0p[j])
          continue;
        const b = bsd(bsds, i, j);
        if (d1 > b)
          continue;
        if (d2 > b)
          continue;
        if (isEmptyRect(emptyRects, i, j)) {
          zt[d][i].push(j);
        }
      }
    }
  });
  return zt;
}
function isLeft(dir, p1, p2) {
  const isRTL = [0, 1, 1, 0][dir];
  const axis = [1, 0, 1, 0][dir];
  const ret = isRTL ? p2[axis] >= p1[axis] : p2[axis] <= p1[axis];
  return ret ? 1 : 0;
}
function getUb1(terminals, successors, zt) {
  const dirs = ["east", "south", "west", "north"];
  const ub1s = {};
  dirs.forEach((d, di) => {
    const succ = successors[d];
    const ub1 = ub1s[d] = [];
    const dzt = zt[d];
    terminals.forEach((p1, i) => {
      const shortLegCandidates = dzt[i];
      if (!shortLegCandidates.length) {
        ub1[i] = 0;
        return;
      }
      const last = shortLegCandidates[shortLegCandidates.length - 1];
      let bound = Infinity;
      const p3 = terminals[last];
      const steiner = SPOINT(di, p1, p3);
      const d3 = DSTDIRP(di, p1, p3);
      for (let j = succ[last]; j >= 0; j = succ[j]) {
        const p2 = terminals[j];
        const d1 = DSTDIR(di, steiner, p2);
        if (d1 > bound)
          break;
        const d2 = DSTDIRP(di, steiner, p2);
        const lr = isLeft(di, p1, p2) === [0, 1, 1, 0][di];
        if (lr && d3 > d2) {
          bound = d1;
          break;
        }
        if (d1 > d2) {
          const d4 = d1 + d2;
          if (d4 < bound) {
            bound = d4;
          }
        }
      }
      ub1[i] = DSTDIR(di, p1, p3) + bound;
    });
  });
  return ub1s;
}
function growFST(ctx, fst) {
  const r = fst.terms[0];
  const l = fst.terms[fst.terms.length - 1];
  const lastlr = fst.lrindex[l];
  const dirName = ["east", "south", "west", "north"][fst.dir];
  const succ = ctx.successors[dirName];
  const root = ctx.terminals[r];
  const last = ctx.terminals[l];
  let maxBackbone = Infinity;
  const lastDstDirp = DSTDIRP(fst.dir, root, last);
  let needsRestore = false;
  for (; ; ) {
    let i = fst.longterms[++fst.longindex];
    let lr;
    let p;
    let dstdirp;
    if (i < -1) {
      break;
    }
    if (i === -1) {
      for (i = succ[fst.longterms[fst.longindex - 1]]; i >= 0; i = succ[i]) {
        p = ctx.terminals[i];
        dstdirp = DSTDIRP(fst.dir, root, p);
        if (dstdirp === 0) {
          lr = 2;
          fst.lrindex[i] = 2;
          fst.shortterm[i] = 0;
          fst.longterms[fst.longindex] = i;
          fst.longterms[fst.longindex + 1] = -2;
          break;
        }
        lr = isLeft(fst.dir, root, p);
        const dirp2 = fst.dir + (lr ? 1 : -1) & 3;
        const dirpName2 = ["east", "south", "west", "north"][dirp2];
        const candidates = ctx.zt[dirpName2][i].slice().reverse();
        const j2 = candidates.find(
          (k) => isLeft(fst.dir, root, ctx.terminals[k]) === lr
        );
        fst.shortterm[i] = j2 !== void 0 ? j2 : -1;
        let ub1 = 0;
        if (j2 >= 0) {
          ub1 = ctx.ub1[dirpName2][i];
        }
        let d12 = ctx.ub0[dirpName2][i];
        if (d12 < ub1) {
          d12 = ub1;
        }
        if (dstdirp > d12)
          continue;
        fst.lrindex[i] = lr;
        fst.longterms[fst.longindex] = i;
        fst.longterms[fst.longindex + 1] = -1;
        break;
      }
      if (i < 0) {
        fst.longterms[fst.longindex] = -2;
        break;
      }
    } else {
      p = ctx.terminals[i];
      lr = fst.lrindex[i];
      dstdirp = DSTDIRP(fst.dir, root, p);
    }
    const dstdir = DSTDIR(fst.dir, last, p);
    if (fst.terms.length >= 3 && dstdir === 0)
      continue;
    if (dstdirp < dstdir) {
      const d12 = dstdir + dstdirp;
      if (d12 < maxBackbone) {
        maxBackbone = d12;
      }
    }
    if (fst.terms.length >= 2 && lr === lastlr && dstdirp < lastDstDirp) {
      if (dstdir < maxBackbone) {
        maxBackbone = dstdir;
      }
    }
    if (dstdir > maxBackbone)
      break;
    if (lr === 2) {
      if (fst.terms.length >= 2) {
        fst.terms.push(i);
        testAndSaveFst(ctx, {
          ...fst,
          length: fst.length + dstdir + dstdirp,
          type: 1
        });
        fst.terms.pop();
      }
      break;
    }
    if (fst.terms.length >= 2 && lr === lastlr)
      continue;
    if (!isEmptyRect(ctx.emptyRects, l, i))
      continue;
    let passBsd = true;
    let minBsd = Infinity;
    for (let j2 = 0; j2 < fst.terms.length; j2++) {
      const k = fst.terms[j2];
      let d12 = fst.maxedges[k];
      if (dstdir > d12) {
        d12 = dstdir;
        fst.maxedges[k] = d12;
        needsRestore = true;
      }
      const b = bsd(ctx.bsds, i, k);
      if (d12 > b) {
        passBsd = false;
        break;
      }
      if (b < minBsd) {
        minBsd = b;
      }
    }
    if (!passBsd)
      continue;
    let newUbLength = fst.ubLength + minBsd;
    const dirp = fst.dir + (lr + lr - 1) & 3;
    const dirpName = ["east", "south", "west", "north"][dirp];
    let tryType1 = false;
    let tryGrowing = false;
    let j = fst.shortterm[i];
    if (j < 0)
      tryType1 = true;
    if (!isEmptyRect(ctx.emptyRects, r, j))
      tryType1 = true;
    if (dstdirp > ctx.ub1[dirpName][i])
      tryType1 = true;
    let q;
    if (!tryType1) {
      q = ctx.terminals[j];
      for (let j2 = 0; j2 < fst.terms.length; j2++) {
        const k = fst.terms[j2];
        let d12 = fst.maxedges[k];
        let d2 = DSTDIRP(fst.dir, root, q);
        let d3 = DSTDIRP(fst.dir, p, q);
        if (d2 > d12)
          d12 = d2;
        if (d12 > d3)
          d3 = d12;
        if (d3 > bsd(ctx.bsds, i, k))
          tryType1 = true;
        d3 = DSTDIR(fst.dir, p, q);
        if (d12 > d3)
          d3 = d12;
        if (d3 > bsd(ctx.bsds, j, k))
          tryType1 = true;
      }
    }
    if (!tryType1) {
      if (DSTDIRP(fst.dir, root, q) > fst.ubShortleg[lr ? 1 : 0])
        tryGrowing = true;
      if (!tryGrowing) {
        fst.terms.push(i, j);
        testAndSaveFst(ctx, {
          ...fst,
          length: fst.length + DSTDIR(fst.dir, last, q) + DSTDIRP(fst.dir, root, p),
          type: 2
        });
        fst.terms.pop();
        fst.terms.pop();
      }
    }
    if (!tryGrowing) {
      if (dstdirp > ctx.ub0[dirpName][i])
        continue;
      let passBsd2 = true;
      for (let j2 = 0; j2 < fst.terms.length; j2++) {
        const k = fst.terms[j2];
        let d12 = fst.maxedges[k];
        if (dstdirp > d12)
          d12 = dstdirp;
        if (d12 > bsd(ctx.bsds, k, i)) {
          passBsd2 = false;
          break;
        }
      }
      if (!passBsd2)
        continue;
      if (fst.length + dstdir > newUbLength)
        continue;
      if (fst.length + dstdir + dstdirp > newUbLength)
        tryGrowing = true;
      if (fst.terms.length <= 1)
        tryGrowing = true;
      if (!isEmptyRect(ctx.emptyRects, r, i))
        tryGrowing = true;
      if (dstdirp > fst.ubShortleg[lr])
        tryGrowing = true;
      if (!tryGrowing) {
        fst.terms.push(i);
        newUbLength = testAndSaveFst(ctx, {
          ...fst,
          length: fst.length + dstdir + dstdirp,
          type: 1
        });
        fst.terms.pop();
      }
    }
    if (fst.terms.length >= ctx.terminals.length)
      continue;
    let d1 = fst.ubShortleg[lr];
    if (dstdirp < d1)
      d1 = dstdirp;
    const newUbShortleg = [];
    newUbShortleg[lr] = d1;
    d1 = fst.ubShortleg[1 - lr];
    if (fst.terms.length >= 2) {
      let d2 = ctx.ub0[dirpName][i];
      if (minBsd < d2)
        d2 = minBsd;
      d2 -= dstdirp;
      if (d2 < d1)
        d1 = d2;
      if (dstdir < d1)
        d1 = dstdir;
      if (fst.terms.length >= 3) {
        let lp = fst.terms[fst.terms.length - 2];
        d2 = DSTDIRP(fst.dir, root, ctx.terminals[lp]);
        if (dstdirp < d2)
          d2 = dstdirp;
        d2 = DSTDIR(fst.dir, ctx.terminals[lp], p) - d2;
        if (d2 < d1)
          d1 = d2;
      }
    }
    newUbShortleg[1 - lr] = d1;
    fst.terms.push(i);
    fst.maxedges[i] = dstdirp;
    growFST(ctx, {
      ...fst,
      length: fst.length + dstdir + dstdirp,
      ubLength: newUbLength,
      ubShortleg: newUbShortleg
    });
    fst.terms.pop();
  }
  if (needsRestore) {
    let longLegMax = 0;
    for (let i = fst.terms.length - 1; i > 0; i--) {
      const k = fst.terms[i];
      const p = ctx.terminals[k];
      let d1 = DSTDIRP(fst.dir, root, p);
      if (longLegMax > d1)
        d1 = longLegMax;
      fst.maxedges[k] = d1;
      const j = fst.terms[i - 1];
      const q = ctx.terminals[j];
      d1 = DSTDIR(fst.dir, q, p);
      if (d1 > longLegMax)
        longLegMax = d1;
    }
    fst.maxedges[r] = longLegMax;
  }
}
function testAndSaveFst(ctx, fst) {
  const size = fst.terms.length;
  const dir = fst.dir;
  let type = fst.type;
  if (size >= 2 ** 31 - 1)
    return fst.length;
  if (size > 2) {
    const b = getBmstLength(fst.terms, ctx.bsds);
    if (fst.length >= b)
      return b;
  }
  if (dir === 1) {
    if (size === 3)
      return fst.length;
    if (size === 4 && fst.type !== 1)
      return fst.length;
  }
  if (size > 4) {
    for (let i2 = 1; i2 < size; i2++) {
      const p = ctx.terminals[fst.terms[i2]];
      const q = ctx.terminals[fst.terms[i2 - 1]];
      const d12 = DSTDIR(dir, p, q);
      if (d12 === 0)
        return fst.length;
    }
  } else if (size === 4) {
    const p12 = ctx.terminals[fst.terms[0]];
    const p22 = ctx.terminals[fst.terms[1]];
    if (DSTDIR(dir, p12, p22) === 0)
      return fst.length;
    const p3 = ctx.terminals[fst.terms[2]];
    const p4 = ctx.terminals[fst.terms[3]];
    if (DSTDIR(dir, p3, p4) === 0)
      return fst.length;
    if (DSTDIR(dir, p22, p3) === 0) {
      if (DSTDIRP(dir, p12, p4) !== 0)
        return fst.length;
      type = 3;
    }
  } else if (size === 3) {
    const p12 = ctx.terminals[fst.terms[0]];
    const p22 = ctx.terminals[fst.terms[1]];
    const p3 = ctx.terminals[fst.terms[2]];
    const z12 = (DSTDIR(dir, p12, p22) === 0 ? 1 : 0) + (DSTDIRP(dir, p12, p22) === 0 ? 1 : 0);
    const z13 = (DSTDIR(dir, p12, p3) === 0 ? 1 : 0) + (DSTDIRP(dir, p12, p3) === 0 ? 1 : 0);
    const z23 = (DSTDIR(dir, p22, p3) === 0 ? 1 : 0) + (DSTDIRP(dir, p22, p3) === 0 ? 1 : 0);
    if (z12 + z13 > 1)
      return fst.length;
    if (z12 + z23 > 1)
      return fst.length;
    if (z13 + z23 > 1)
      return fst.length;
  }
  let i = 0;
  let last = size - 1;
  if (type === 2) {
    last = size - 2;
    if ((size & 1) === 0)
      i = 1;
  } else if ((size & 1) !== 0)
    i = 1;
  const p1 = ctx.terminals[fst.terms[0]];
  const p2 = ctx.terminals[fst.terms[size - 1]];
  while (i < last) {
    let s1 = SPOINT(dir, p1, ctx.terminals[fst.terms[i]]);
    let s2 = SPOINT(dir, p2, ctx.terminals[fst.terms[i + 1]]);
    if (!diamondEmpty(ctx, s1, s2, fst.terms[i], dir))
      return fst.length;
    i++;
    if (i >= last)
      break;
    s1 = SPOINT(dir, p2, ctx.terminals[fst.terms[i]]);
    s2 = SPOINT(dir, p2, ctx.terminals[fst.terms[i + 1]]);
    if (!diamondEmpty(ctx, s1, s2, fst.terms[i], dir))
      return fst.length;
    i++;
  }
  const d1 = DSTDIRP(
    ctx.terminals[fst.terms[size - 1]],
    ctx.terminals[fst.terms[0]],
    dir
  );
  i = size - (fst.type === 1 ? 3 : 4);
  while (i > 0) {
    if (DSTDIRP(ctx.terminals[fst.terms[i]], ctx.terminals[fst.terms[0]], dir) <= d1) {
      return fst.length;
    }
    i -= 2;
  }
  const hash = fst.terms.slice().sort().join(",");
  const dupe = ctx.fsphash[hash];
  if (dupe) {
    if (dupe.length <= fst.length) {
      return dupe.length;
    }
    const idx = ctx.fsp.indexOf(dupe);
    if (idx >= 0) {
      ctx.fsp.splice(idx, 1);
    }
  }
  fst.pterms = fst.terms.map((t) => ctx.terminals[t]);
  buildRFSTGraph(ctx, fst);
  const info = {
    terminalIndices: fst.terms.map((t) => t + 1),
    steinerPoints: fst.steins,
    edges: fst.edges.map((e) => [
      e.p1 < fst.terms.length ? e.p1 + 1 : (e.p1 - fst.terms.length + 1) * -1,
      e.p2 < fst.terms.length ? e.p2 + 1 : (e.p2 - fst.terms.length + 1) * -1
    ]),
    length: fst.length
  };
  ctx.fsp.push(info);
  ctx.fsphash[hash] = info;
  return fst.length;
}
function buildRFSTGraph(ctx, fst) {
  const p1 = fst.pterms[0];
  const p2 = fst.pterms[1];
  fst.steins = [];
  fst.edges = [];
  const size = fst.terms.length;
  if (size <= 2) {
    if (p1[0] !== p2[0] && p1[1] !== p2[1]) {
      const p3 = p1[0] < p2[0] ? SPOINT(1, p1, p2) : SPOINT(1, p2, p1);
      fst.steins.push(p3);
      fst.edges.push({ p1: 0, p2: 2, len: RDIST(p1, p3) });
      fst.edges.push({ p1: 1, p2: 2, len: RDIST(p2, p3) });
      return;
    } else {
      fst.edges.push({ p1: 0, p2: 1, len: RDIST(p1, p2) });
      return;
    }
  }
  if (fst.type === 3) {
    const p3 = SPOINT(fst.dir, p1, p2);
    fst.steins.push(p3);
    for (let i = 0; i < 4; i++) {
      fst.edges.push({ p1: i, p2: 4, len: RDIST(fst.pterms[i], fst.steins[0]) });
    }
    return;
  }
  let k = size - 1;
  if (fst.type === 2)
    k--;
  k = fst.terms[k];
  if (fst.dir === 1 && fst.lrindex[k] === 1) {
    let p12 = fst.type === 1 ? fst.pterms[0] : fst.pterms[size - 1];
    let p22 = fst.pterms[size - 2];
    for (let i = size - 3; i >= 0; i--) {
      fst.steins[i] = SPOINT(fst.dir, p12, p22);
      p12 = fst.pterms[0];
      p22 = fst.pterms[i];
    }
  } else {
    if (fst.type === 1) {
      k = (size & 1) === 0 ? size - 1 : 0;
    } else {
      k = (size & 1) === 0 ? 0 : size - 1;
    }
    let p12 = fst.pterms[k];
    let p22 = fst.pterms[1];
    for (let i = 0; i < size - 2; i++) {
      fst.steins[i] = SPOINT(fst.dir, p12, p22);
      p12 = fst.pterms[size - 1];
      p22 = fst.pterms[i + 2];
    }
  }
  let j = 0;
  for (let i = 0; i < size - 2; i++) {
    const nj = size + i;
    fst.edges.push({ p1: j, p2: nj });
    fst.edges.push({ p1: nj, p2: i + 1 });
    j = nj;
  }
  fst.edges.push({ p1: j, p2: size - 1 });
  const nedges = (size <= 2 ? 1 : fst.type === 3 ? 4 : 2 * size - 3) + 1;
  let includeCorner = true;
  for (let i = 0; i < nedges - 1; i++) {
    const { p1: j2, p2: k2 } = fst.edges[i];
    const p12 = j2 < size ? fst.pterms[j2] : fst.steins[j2 - size];
    const p22 = k2 < size ? fst.pterms[k2] : fst.steins[k2 - size];
    if (includeCorner && p12[0] !== p22[0] && p12[1] !== p22[1]) {
      includeCorner = false;
      const p3 = p12[0] < p22[0] ? SPOINT(1, p12, p22) : SPOINT(1, p22, p12);
      fst.steins.push(p3);
      fst.edges[i] = {
        p1: j2,
        p2: size + fst.steins.length - 1,
        len: RDIST(p12, p3)
      };
      fst.edges.push({
        p1: k2,
        p2: size + fst.steins.length - 1,
        len: RDIST(p22, p3)
      });
    } else {
      fst.edges[i].len = RDIST(p12, p22);
    }
  }
}
function diamondEmpty(ctx, p, q, i, dir) {
  const dirName = ["east", "south", "west", "north"][dir];
  const oppositeDirName = ["east", "south", "west", "north"][dir + 2];
  let succ = ctx.successors[dirName];
  const d = RDIST(p, q);
  for (let j = succ[i]; j >= 0; j = succ[j]) {
    const r = ctx.terminals[j];
    const dstdir = DSTDIR(dir, r, q);
    if (dstdir > d)
      break;
    const dstdirp = DSTDIRP(dir, r, q);
    if (RDIST(r, p) < d && dstdir + dstdirp < d) {
      return false;
    }
  }
  succ = ctx.successors[oppositeDirName];
  for (let j = succ[i]; j >= 0; j = succ[j]) {
    const r = ctx.terminals[j];
    const dstdir = DSTDIR(dir, r, p);
    if (dstdir > d)
      break;
    const dstdirp = DSTDIRP(dir, r, p);
    if (RDIST(r, q) < d && dstdir + dstdirp < d) {
      return false;
    }
  }
  return true;
}
var constants = {
  GLP_MIN: 1,
  GLP_MAX: 2,
  GLP_CV: 1,
  GLP_IV: 2,
  GLP_BV: 3,
  GLP_FR: 1,
  GLP_LO: 2,
  GLP_UP: 3,
  GLP_DB: 4,
  GLP_FX: 5,
  GLP_MSG_OFF: 0,
  GLP_MSG_ERR: 1,
  GLP_MSG_ON: 2,
  GLP_MSG_ALL: 3,
  GLP_MSG_DBG: 4,
  GLP_UNDEF: 1,
  GLP_FEAS: 2,
  GLP_INFEAS: 3,
  GLP_NOFEAS: 4,
  GLP_OPT: 5,
  GLP_UNBND: 6
};
var solve = async (lp, msgLevel) => {
  const solve2 = (await (0, import_glpk.default)()).solve;
  return solve2(lp, msgLevel);
};
function updateBestSolutionSet(edges, bbip) {
  const nedges = bbip.cip.edges.length;
  const edgeMask = /* @__PURE__ */ new Set();
  for (let i = 0; i < edges.length; i++) {
    edgeMask.add(edges[i]);
  }
  let length = 0;
  for (let i = 0; i < nedges; i++) {
    if (edgeMask.has(i)) {
      length += bbip.cip.edges[i].length;
    }
  }
  if (bbip.solution && length >= bbip.solution.length) {
    return false;
  }
  bbip.solution = {
    length,
    edges: []
  };
  for (let i = 0; i < nedges; i++) {
    if (edgeMask.has(i)) {
      bbip.solution.edges.push(i);
    }
  }
  bbip.upperbound = length;
  return true;
}
function startupHeuristicUpperBound(cip) {
  const { terminals, edges } = cip;
  const n = edges.length;
  const fstLen = edges.map((e) => e.length);
  const mstLen = [];
  const rankings = [];
  let nranks = 0;
  for (let i = 0; i < n; i++) {
    const terms = edges[i].terminalIndices.map((ti) => terminals[ti - 1]);
    const mst2 = getRmst(terms);
    mstLen[i] = mst2.map((e) => e.len).reduce((s, l) => s + l);
  }
  let ranking = computeFstRanking(fstLen, mstLen);
  rankings[nranks++] = ranking;
  for (let i = 0; i < n; i++) {
    mstLen[i] = edges[i].terminalIndices.length - 1;
  }
  ranking = computeFstRanking(fstLen, mstLen);
  rankings[nranks++] = ranking;
  const mstEdges = sortedMstEdges(edges);
  return {
    rankings,
    mstEdges
  };
}
function computeFstRanking(num, den) {
  const factor = 1e12;
  const indices = num.map((_, i) => i);
  const ratios = indices.map(
    (i) => Math.round(num[i] / den[i] * factor) / factor
  );
  indices.sort((a, b) => ratios[a] - ratios[b]);
  const ranking = [];
  for (let i = 0; i < indices.length; i++)
    ranking[indices[i]] = i;
  return ranking;
}
function sortedMstEdges(edges) {
  const mstEdges = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].edges.length === 2) {
      mstEdges.push(i);
    }
  }
  mstEdges.sort((a, b) => edges[a].length - edges[b].length);
  return mstEdges;
}
function computeHeuristicUpperBound(solution, bbip) {
  if (!bbip.ubip) {
    bbip.ubip = startupHeuristicUpperBound(bbip.cip);
  }
  const oldUb = bbip.upperbound || Infinity;
  bbip.ubip.bestZ = oldUb;
  const edgesIntegral = [];
  const edgesFractional = [];
  const edgesZero = [];
  for (let i = 0; i < bbip.cip.edges.length; i++) {
    const weight = solution.vars["e" + i];
    if (weight <= 1e-5) {
      edgesZero.push(i);
    } else if (weight + 1e-5 >= 1) {
      edgesIntegral.push(i);
    } else {
      edgesFractional.push(i);
    }
  }
  bbip.ubip.rankings.forEach((ranking, i) => {
    edgesIntegral.sort(sortByRank(ranking));
    edgesFractional.sort(sortByLpAndRank(solution.vars, ranking));
    edgesZero.sort(sortByRank(ranking));
    const edgeList = [...edgesIntegral, ...edgesFractional, ...edgesZero];
    tryTrees(edgeList, bbip);
    edgeList.sort((a, b) => {
      const la = bbip.cip.edges[a].edges.length;
      const lb = bbip.cip.edges[b].edges.length;
      if (la === 2 && lb !== 2)
        return 1;
      if (lb === 2 && la !== 2)
        return -1;
      return 0;
    });
    tryTrees(edgeList, bbip);
  });
  return bbip.ubip.bestZ < oldUb;
}
function sortByRank(ranking) {
  return (a, b) => ranking[a] - ranking[b];
}
function sortByLpAndRank(x, ranking) {
  return (a, b) => {
    const w1 = x["e" + a];
    const w2 = x["e" + b];
    if (w1 !== w2)
      return w1 - w2;
    return ranking[a] - ranking[b];
  };
}
function tryTrees(edgeList, bbip) {
  const used = /* @__PURE__ */ new Set();
  let l = ubKruskal(edgeList, used, bbip);
  if (l === Infinity)
    return;
  const tempEdges = [null, ...edgeList];
  let limit;
  for (limit = 2; 1 << limit < edgeList.length; limit++) {
  }
  let smallGap = 1e-4 * Math.abs(bbip.ubip.bestZ || Infinity);
  if (smallGap < 1e-4)
    smallGap = 1e-4;
  let haveReset = false;
  let orgLimit = limit;
  let oldL = Infinity;
  let k = edgeList.length + 1;
  for (let i = 0; i < edgeList.length; i++) {
    let e = edgeList[i];
    if (used.has(e))
      continue;
    tempEdges[0] = e;
    used.clear();
    l = ubKruskal(tempEdges, used, bbip);
    if (l < oldL) {
      k = 1;
      for (let j = 0; j < edgeList.length; j++) {
        let e2 = edgeList[j];
        if (used.has(e2) || bbip.cip.edges[e2].terminalIndices.length === 2) {
          tempEdges[k++] = e2;
        }
      }
      oldL = l;
      smallGap = 1e-4 * Math.abs(bbip.ubip.bestZ);
      if (smallGap < 1e-4)
        smallGap = 1e-4;
    }
    let currGap = l - bbip.ubip.bestZ;
    if (!haveReset && currGap <= smallGap) {
      const fraction = (smallGap - currGap) / smallGap;
      const quadratic = Math.floor(fraction * orgLimit ** 2);
      limit = 2 * orgLimit + quadratic;
      i = 0;
      haveReset = true;
    }
    if (--limit <= 0)
      break;
  }
}
function ubKruskal(edgeList, used, bbip) {
  const nverts = bbip.cip.terminals.length;
  const nedges = edgeList.length;
  const dsuf = new DSUF();
  let components = nverts;
  let length = 0;
  const treeEdges = [];
  let ep2 = 0;
  let ep3 = nedges;
  while (components > 1) {
    if (ep2 >= ep3) {
      length = Infinity;
      break;
    }
    const e = edgeList[ep2++];
    const mark = /* @__PURE__ */ new Set();
    let vp1 = 0;
    const vp2 = bbip.cip.edges[e].edges.length * 2;
    while (true) {
      if (vp1 >= vp2) {
        treeEdges.push(e);
        length += bbip.cip.edges[e].length;
        used.add(e);
        const [i, ...roots] = Array.from(mark);
        roots.forEach((j2) => dsuf.connect(i, j2));
        components -= mark.size - 1;
        break;
      }
      const tij = bbip.cip.edges[e].edges[vp1 >> 1][vp1 & 1] - 1;
      vp1++;
      if (tij < 0)
        continue;
      const oj = bbip.cip.edges[e].terminalIndices[tij] - 1;
      const j = dsuf.find(oj);
      if (mark.has(j)) {
        break;
      }
      mark.add(j);
    }
  }
  if (components === 1) {
    if (updateBestSolutionSet(treeEdges, bbip)) {
      bbip.ubip.bestZ = bbip.upperbound;
    }
  }
  return length;
}
function getConstraintPool(data) {
  const nterms = data.terminals.length;
  const vertMask = new Set(data.initialVertMask);
  const edgeMask = new Set(data.initialEdgeMask);
  const pool = [];
  pool.push({
    name: "spanning",
    vars: data.edges.filter((_, i) => edgeMask.has(i)).map((e, i) => ({
      name: "e" + i,
      coef: e.terminalIndices.length - 1
    })),
    selected: true,
    bnds: {
      type: constants.GLP_FX,
      lb: vertMask.size - 1
    }
  });
  data.terminals.forEach((_, i) => {
    if (!vertMask.has(i))
      return;
    pool.push({
      name: "cutset-" + i,
      vars: data.termTrees[i].filter((j) => edgeMask.has(j)).map((j) => ({
        name: "e" + j,
        coef: 1
      })),
      selected: true,
      bnds: {
        type: constants.GLP_LO,
        lb: 1
      }
    });
  });
  const fsmask = /* @__PURE__ */ new Set();
  for (let i = 0; i < nterms; i++) {
    const tlist = [];
    const counts = data.terminals.map((_) => 0);
    const tmask = /* @__PURE__ */ new Set();
    if (!vertMask.has(i))
      continue;
    data.termTrees[i].forEach((fs) => {
      if (!edgeMask.has(fs))
        return;
      fsmask.add(fs);
      const fst = data.edges[fs];
      fst.edges.forEach((edge) => {
        edge.forEach((vtx) => {
          if (vtx > 0) {
            const j = fst.terminalIndices[vtx - 1] - 1;
            if (j <= i)
              return;
            if (!vertMask.has(j))
              return;
            counts[j]++;
            if (tmask.has(j))
              return;
            tmask.add(j);
            tlist.push(j);
          }
        });
      });
    });
    tlist.forEach((j) => {
      if (counts[j] < 2)
        return;
      pool.push({
        name: "2sec-" + i + "," + j,
        vars: data.termTrees[j].filter((fs) => fsmask.has(fs)).map((fs) => ({
          name: "e" + fs,
          coef: 1
        })),
        selected: false,
        bnds: {
          type: constants.GLP_UP,
          ub: 1
        }
      });
    });
    data.termTrees[i].forEach((fs) => fsmask.delete(fs));
  }
  const poolDupes = /* @__PURE__ */ new Set();
  const poolUniq = pool.filter((r) => {
    const s = JSON.stringify({ ...r, name: null });
    const ret = !poolDupes.has(s);
    poolDupes.add(s);
    return ret;
  });
  return poolUniq;
}
function getInitialFormulation(cip, pool) {
  const objective = {
    direction: constants.GLP_MIN,
    name: "obj",
    vars: cip.edges.map((e, i) => ({
      name: "e" + i,
      coef: e.length
    }))
  };
  const binaries = cip.edges.map((_, i) => "e" + i);
  const bounds = cip.edges.map((_, i) => ({
    name: "e" + i,
    type: constants.GLP_DB,
    lb: 0,
    ub: 1
  }));
  return {
    name: "LP",
    objective,
    bounds,
    subjectTo: pool
  };
}
async function solveLpOverConstraintPool(bbip) {
  const pool = bbip.cpool;
  let solution;
  while (true) {
    const tableaux = pool.filter((r) => r.selected);
    const lp = { ...bbip.lp, subjectTo: tableaux };
    solution = await solve(lp, constants.GLP_MSG_OFF);
    if (solution.result.status !== constants.GLP_OPT)
      break;
    let anyViolations = false;
    for (let i = 0; i < pool.length; i++) {
      const row = pool[i];
      const slack = computeSlackValue(solution, row);
      if (slack > 1e-5)
        continue;
      if (row.selected)
        continue;
      if (slack < -1e-5) {
        row.selected = true;
        anyViolations = true;
      }
    }
    if (!anyViolations)
      break;
  }
  return {
    status: solution.result.status,
    z: solution.result.z,
    name: solution.name,
    time: solution.time,
    vars: solution.result.vars
  };
}
function computeSlackValue(solution, row) {
  const sv = solution.result.vars;
  const sum = row.vars.reduce((s, v) => s + v.coef * sv[v.name], 0);
  switch (row.bnds.type) {
    case constants.GLP_UP:
      return row.bnds.ub - sum;
    case constants.GLP_FX:
      return Math.abs(sum - row.bnds.lb);
    case constants.GLP_LO:
      return sum - row.bnds.lb;
  }
  return 0;
}
function createBBTree() {
  let serial = 0;
  return {
    nextSerial: () => serial++,
    first: null,
    heapBest: new Heap(nodeIsBetter),
    heapWorst: new Heap(nodeIsWorse)
  };
}
function nodeIsBetter(a, b) {
  if (a.z < b.z)
    return true;
  if (a.z > b.z)
    return false;
  if (a.num >= b.num)
    return true;
  return false;
}
function nodeIsWorse(a, b) {
  return a.z >= b.z;
}
var Heap = class {
  isParent;
  array;
  indices;
  constructor(isParent) {
    this.isParent = isParent;
    this.array = [];
    this.indices = /* @__PURE__ */ new Map();
  }
  getRoot() {
    return this.array[0];
  }
  insert(node) {
    let i;
    for (i = this.array.length; i > 0; ) {
      const j = i - 1 >> 1;
      const node2 = this.array[j];
      if (this.isParent(node2, node))
        break;
      this.indices.set(node2, i);
      this.array[i] = node2;
      i = j;
    }
    this.indices.set(node, i);
    this.array[i] = node;
  }
  remove(node) {
    let i = this.indices.get(node);
    if (i === void 0)
      return;
    this.indices.delete(node);
    const node2 = this.array.pop();
    if (node === node2)
      return;
    while (i > 0) {
      const j = i - 1 >> 1;
      const node3 = this.array[j];
      if (this.isParent(node3, node2))
        break;
      this.indices.set(node3, i);
      this.array[i] = node3;
      i = j;
    }
    while (i < this.array.length) {
      let j = (i << 1) + 1;
      if (j >= this.array.length)
        break;
      let node3 = this.array[j];
      if (j + 1 < this.array.length) {
        const node4 = this.array[j + 1];
        if (this.isParent(node4, node3)) {
          j++;
          node3 = node4;
        }
      }
      if (this.isParent(node2, node3))
        break;
      this.indices.set(node3, i);
      this.array[i] = node3;
      i = j;
    }
    this.indices.set(node2, i);
    this.array[i] = node2;
  }
  size() {
    return this.array.length;
  }
};
function prepare(terminals, edges) {
  const initialVertMask = new Set(terminals.map((_, i) => i));
  const initialEdgeMask = new Set(edges.map((_, i) => i));
  const termTrees = getTermTrees(edges);
  return {
    terminals,
    edges,
    initialVertMask,
    initialEdgeMask,
    termTrees
  };
}
function getTermTrees(edges) {
  const termTrees = [];
  edges.forEach((fst, i) => {
    fst.edges.forEach((edge) => {
      edge.forEach((vtx) => {
        if (vtx >= 0) {
          const vtxIdx = fst.terminalIndices[vtx - 1] - 1;
          if (!termTrees[vtxIdx])
            termTrees[vtxIdx] = [];
          if (termTrees[vtxIdx].indexOf(i) === -1) {
            termTrees[vtxIdx].push(i);
          }
        }
      });
    });
  });
  return termTrees;
}
function getBbInfo(cip) {
  const cpool = getConstraintPool(cip);
  const lp = getInitialFormulation(cip, cpool);
  const bbtree = createBBTree();
  const root = {
    z: -Infinity,
    optimal: false,
    num: bbtree.nextSerial(),
    iter: 0,
    parent: -1,
    var: -1,
    dir: 0,
    depth: 0
  };
  const bbip = {
    cpool,
    lp,
    bbtree,
    cip,
    prevlb: -Infinity,
    bestZ: Infinity
  };
  bbtree.first = root;
  bbtree.heapBest.insert(root);
  bbtree.heapWorst.insert(root);
  return bbip;
}
async function branchAndCut(cip, bbip) {
  bbip.ubip = startupHeuristicUpperBound(cip);
  for (; ; ) {
    const node = selectNextNode(bbip.bbtree);
    if (!node)
      break;
    newLowerBound(node.z, bbip);
    const lp = node.lp;
    const nextBest = bbip.bbtree.heapBest.getRoot();
    bbip.preemptZ = nextBest ? nextBest.z : bbip.bestZ;
    bbip.node = node;
    await computeGoodLowerBound(bbip);
    break;
  }
}
function selectNextNode(bbtree) {
  return bbtree.heapBest.getRoot();
}
async function computeGoodLowerBound(bbip) {
  while (true) {
    let result = await solveLpOverConstraintPool(bbip);
    const z = result.z;
    bbip.node.iter++;
    switch (result.status) {
      case constants.GLP_OPT:
        if (z >= bbip.bestZ) {
          bbip.node.z = bbip.bestZ;
          return "cutoff";
        }
        break;
      case constants.GLP_INFEAS:
        bbip.node.z = bbip.bestZ;
        return "infeasible";
      default:
        throw new Error("Solve status = " + result.status);
    }
    const { isInt, numFractional } = integerFeasibleSolution(result, bbip.cip);
    if (bbip.node.z > bbip.preemptZ) {
      return "preempted";
    }
    newLowerBound(z, bbip);
    if (computeHeuristicUpperBound(result, bbip)) {
      newUpperBound(bbip.upperbound, bbip);
    }
    {
      break;
    }
  }
}
function integerFeasibleSolution(solution, cip) {
  let numFractional = 0;
  for (let i = 0; i < cip.edges.length; i++) {
    if (solution.vars["e" + i] <= 1e-5)
      continue;
    if (solution.vars["e" + i] + 1e-5 >= 1)
      continue;
    numFractional++;
  }
  if (numFractional) {
    return { isInt: false, numFractional };
  }
  let j = 0;
  let startingEdge = -1;
  const integralEdges = /* @__PURE__ */ new Set();
  for (let i = 0; i < cip.edges.length; i++) {
    if (solution.vars["e" + i] >= 0.5) {
      integralEdges.add(i);
      startingEdge = i;
      j += cip.edges[i].terminalIndices.length - 1;
    }
  }
  if (j !== cip.terminals.length - 1) {
    return { isInt: false, numFractional };
  }
  if (startingEdge < 0) {
    return { isInt: true, numFractional };
  }
  const vertsLeft = new Set(cip.terminals.map((_, i) => i));
  integralEdges.delete(startingEdge);
  const stack = [startingEdge];
  while (stack.length) {
    const fs = stack.pop();
    cip.edges[fs].terminalIndices.forEach((tpp) => {
      const t = tpp - 1;
      if (!vertsLeft.has(t))
        return;
      vertsLeft.delete(t);
      cip.termTrees[t].forEach((fs2) => {
        if (!integralEdges.has(fs2))
          return;
        integralEdges.delete(fs2);
        stack.push(fs2);
      });
    });
  }
  const notReached = vertsLeft.size !== 0;
  if (notReached) {
    return { isInt: false, numFractional };
  }
  return { isInt: true, numFractional };
}
function newLowerBound(lb, bbip) {
  let prev = bbip.prevlb;
  if (lb <= prev) {
    return;
  }
  if (prev <= -Infinity) {
    prev = lb;
  }
  let oldGap, newGap;
  if (bbip.bestZ >= Infinity || bbip.bestZ === 0) {
    oldGap = newGap = 99.9;
  } else {
    oldGap = 100 * (bbip.bestZ - prev) / bbip.bestZ;
    newGap = 100 * (bbip.bestZ - lb) / bbip.bestZ;
  }
  bbip.prevlb = lb;
}
function newUpperBound(ub, bbip) {
  let prev = bbip.bestZ;
  if (prev >= Infinity) {
    prev = ub;
  }
  let oldGap, newGap;
  if (bbip.prevlb <= -Infinity) {
    oldGap = newGap = 99.9;
  } else {
    oldGap = 100 * (prev - bbip.prevlb) / prev;
    newGap = 100 * (ub - bbip.prevlb) / ub;
  }
}
function buildSolution(bbip) {
  const terminals = bbip.cip.terminals;
  const solution = bbip.solution;
  const length = solution.length;
  const steiners = [];
  const edges = [];
  const edgeIds = [];
  solution.edges.forEach((e) => {
    const fst = bbip.cip.edges[e];
    const steinerOffset = steiners.length;
    fst.steinerPoints.forEach((p) => steiners.push(p));
    const id2absolute = (n) => n > 0 ? fst.terminalIndices[n - 1] : -steinerOffset + n;
    const id2coords = (n) => n > 0 ? terminals[n - 1] : steiners[-n - 1];
    fst.edges.forEach((v) => {
      edgeIds.push(v.map(id2absolute));
      edges.push(v.map(id2coords));
    });
  });
  return {
    terminals,
    steiners,
    edges,
    edgeIds,
    length
  };
}
async function bb(terminals, edges) {
  const data = prepare(terminals, edges);
  const bbip = getBbInfo(data);
  await branchAndCut(data, bbip);
  return buildSolution(bbip);
}
function rsmt(terminals) {
  if (terminals.length < 2) {
    return {
      terminals,
      steiners: [],
      edges: [],
      edgeIds: [],
      length: 0
    };
  }
  const { fsts } = rfst(terminals);
  return bb(terminals, fsts);
}
var src_default = rsmt;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=index.js.map