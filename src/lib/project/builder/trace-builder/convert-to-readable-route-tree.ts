import * as Type from "lib/types"

export const getParent = (
  child: Type.AnyElement,
  allElms: Type.AnyElement[]
) => {
  return allElms.find(
    (candParent) =>
      candParent[`${candParent.type}_id`] === child[`${candParent.type}_id`] &&
      candParent !== child
  )
}

export const getChildren = (
  parent: Type.AnyElement,
  allElms: Type.AnyElement[]
) => {
  return allElms.filter(
    (elm) =>
      elm[`${parent.type}_id`] === parent[`${parent.type}_id`] && elm !== parent
  )
}

export const getReadableName = (elm: any) => {
  return elm[`${elm.type}_id`] + ` (ftype:${elm.ftype} name:${elm.name})`
}

export const convertToReadableTreeUsingRoot = (
  rootElm: Type.AnyElement,
  allElms: Type.AnyElement[]
) => {
  const children = getChildren(rootElm, allElms)
  const tree = {}
  for (const child of children) {
    tree[getReadableName(child)] = convertToReadableTreeUsingRoot(
      child,
      allElms
    )
  }
  return tree
}

export const convertToReadableTraceTree = (allElms: Type.AnyElement[]): any => {
  const componentsWithoutParent = []
  for (const elm of allElms) {
    if (!getParent(elm, allElms)) {
      componentsWithoutParent.push(elm)
    }
  }
  console.log({ componentsWithoutParent })
  const tree = {}
  for (const elm of componentsWithoutParent) {
    tree[getReadableName(elm)] = convertToReadableTreeUsingRoot(elm, allElms)
  }
  return tree
}
