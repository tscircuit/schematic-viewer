# Rectilinear Steiner Minimal Trees

> Note: I'm not the original author of this library. I wasn't able to
> find the source of the [original library](https://www.npmjs.com/package/rsmt), and wanted to update it, adding tests,
> making it work in browser and adding typescript support.

A library to obtain Rectilinear Steiner Minimal Trees.

For more info on the problem that this solves, check [Rectilinear Steiner tree](https://en.wikipedia.org/wiki/Rectilinear_Steiner_tree). This library implements a fast algorithm that provides exact (ie: minimal) solutions.

## Usage

To use it, just do:

```ts
import rsmt from `rsmt-ts`

const nodes = [[0, 0], [1, 2], [4, 1], ...]
const solution = await rsmt(nodes)

/*
solution = {
  terminals: [[0, 0], [1, 2], [4, 1], ...],
  steiners: [[0, 1], ...],
  edges: [[[0, 0], [0, 1]], ...],
  edgeIds: [[1, -1], ...]
}
*/
```

## Acknowledgements

This library is a reimplementation of the algorithms used in [GeoSteiner](http://www.geosteiner.com/), based on the paper "_A New Exact Algorithm for Rectilinear Steiner Trees_" (David M. Warme, 1997).

We also make use of an emscripten build of glpk, named [glpk.js](https://github.com/jvail/glpk.js/).

Thank you to [Glue Digital](glue.digital) who I did the [original npm module.](https://www.npmjs.com/package/rsmt)
