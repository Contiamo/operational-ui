import * as React from "react"

import Icon from "../Icon/Icon"
import IconButton from "../Internals/IconButton"
import SmallNameTag from "../Internals/SmallNameTag"
import { DefaultProps } from "../types"
import constants, { expandColor } from "../utils/constants"
import styled from "../utils/styled"
import { Tree as ITree } from "./Tree.types"
import { arePathsEqual, containsPath, getInitialOpenPaths, getMaxDepth, togglePath } from "./Tree.utils"

export interface TreeProps extends DefaultProps {
  /** An array of tree structures */
  trees: ITree[]
  /** A flag toggling drag-and-drop reordering of tree items */
  onReorder?: (source: number[], target: number[]) => void
}

export interface State {
  /** Stores all open paths. E.g. if this.state.openPaths is [ [ 0 ], [ 1, 2 ] ], then the first root, and the third child of the second root are open.  */
  openPaths: number[][]
  reorderSource?: number[]
  reorderTarget?: number[]
}

const Container = styled("div")`
  display: block;
`

const TreeContainer = styled("div")`
  & + & {
    margin-top: ${({ theme }) => theme.space.base}px;
  }
`

const TreeChildren = styled("div")`
  margin-left: ${({ theme }) => theme.space.content}px;
`

const TreeItem = styled("div")<{
  hasChildren: boolean
  hasTag: boolean
  isTopLevel: boolean
  isDisabled: boolean
  isRemovable: boolean
  isReorderDropTarget: boolean
  isFirst: boolean
}>`
  display: flex;
  align-items: center;
  cursor: pointer;
  :last-child {
    margin-bottom: 0px;
  }
  ${({ theme, hasChildren, hasTag, isFirst, isTopLevel, isDisabled, isReorderDropTarget }) => `
    box-shadow: ${isReorderDropTarget ? `0 -2px 0 2px ${theme.color.primary}` : "none"};
    font-size: ${theme.font.size.fineprint}px;
    font-weight: ${isTopLevel && !hasTag ? theme.font.weight.bold : theme.font.weight.medium};
    color: ${theme.color.text.dark};
    margin-top: ${!isFirst && isTopLevel && hasChildren ? 8 : 0}px; 
    margin-bottom: ${hasChildren ? 4 : 0}px;
    opacity: ${isDisabled ? "0.4" : "1.0"};
    :hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    & svg {
      color: ${theme.color.text.lightest};
    }
    & > svg:first-child {
      flex-shrink: 0;
      visibility: ${hasChildren ? "visible" : "hidden"};
    }
  `};
`

const FillerTreeItem = styled("div")<{ isReorderDropTarget: boolean }>`
  height: 6px;
  border-top: 2px solid;
  border-color: ${props => (props.isReorderDropTarget ? props.theme.color.primary : "transparent")};
`

const TreeLabel = styled("span")`
  padding-left: ${props => props.theme.space.base}px;
  display: inline-block;
  word-wrap: break-word;
  flex: 1;
`

export interface ReorderProps {
  onReorder: TreeProps["onReorder"]
  reorderSource?: number[]
  reorderTarget?: number[]
  setReorderSource: (reorderSourcePath?: number[]) => void
  setReorderTarget: (reorderTargetPath?: number[]) => void
}

/**
 * Computes all props related to drag-and-drop reordering, taking appropriate state values, state setters,
 * as well as the path that the node is currently on. Note that the first argument doesn't vary from node to node,
 * while the second indicates the current node path.
 */
const reorderDndProps = ({
  onReorder,
  reorderSource,
  reorderTarget,
  setReorderSource,
  setReorderTarget,
}: ReorderProps) => (node: { path: number[]; filler?: boolean }) =>
  onReorder
    ? {
        isReorderDropTarget: Boolean(onReorder && reorderTarget && arePathsEqual(reorderTarget, node.path)),
        ...(node.filler
          ? {}
          : {
              draggable: true,
              onDragStart: () => {
                setReorderSource([...node.path])
              },
              onDragEnd: () => {
                setReorderSource(undefined)
              },
            }),
        onDragOver: (ev: React.SyntheticEvent) => {
          ev.preventDefault()
          // Reorder source is not available when the drag source is outside this tree, and should not be handled
          if (!reorderSource) {
            return
          }
          if (arePathsEqual(reorderSource, node.path)) {
            return
          }
          if (!reorderTarget) {
            setReorderTarget([...node.path])
            return
          }
          if (arePathsEqual(reorderTarget, node.path)) {
            return
          }
          setReorderTarget([...node.path])
        },
        onDragLeave: () => {
          // Reorder source is not available when the drag source is outside this tree, and should not be handled
          if (!reorderSource) {
            return
          }
          setReorderTarget(undefined)
        },
        onDrop: () => {
          setReorderSource(undefined)
          setReorderTarget(undefined)
          if (reorderSource && reorderTarget) {
            onReorder(reorderSource, reorderTarget)
          }
        },
      }
    : {}

const TreeRecursive: React.SFC<
  {
    tree: ITree
    path: number[]
    isFirst: boolean
    recursiveTogglePath: (path: number[]) => void
    openPaths: number[][]
    maxDepth: number
  } & ReorderProps
> = ({
  tree,
  path,
  recursiveTogglePath,
  openPaths,
  maxDepth,
  isFirst,
  onReorder,
  reorderSource,
  reorderTarget,
  setReorderSource,
  setReorderTarget,
}) => {
  const isOpen = containsPath(path)(openPaths)
  const { label, tag, disabled, initiallyOpen, childNodes, color, onRemove, ...treeHtmlProps } = tree
  const tagColor = expandColor(constants, color) || ""
  return (
    <TreeContainer>
      <TreeItem
        {...treeHtmlProps}
        hasTag={Boolean(tree.tag)}
        hasChildren={tree.childNodes.length > 0}
        isTopLevel={path.length < 2}
        isDisabled={Boolean(tree.disabled)}
        isRemovable={Boolean(onRemove)}
        isReorderDropTarget={false}
        isFirst={isFirst}
        {...reorderDndProps({
          onReorder,
          reorderSource,
          reorderTarget,
          setReorderSource,
          setReorderTarget,
        })({ path })}
        onClick={() => {
          if (treeHtmlProps.onClick) {
            treeHtmlProps.onClick()
          }
          recursiveTogglePath(path)
        }}
      >
        {maxDepth > 1 &&
          childNodes.length !== 0 && (
            <IconButton>
              <Icon size={12} name={isOpen ? "ChevronDown" : "Add"} />
            </IconButton>
          )}
        {tree.tag && <SmallNameTag color={tagColor}>{tree.tag}</SmallNameTag>}
        <TreeLabel>{tree.label}</TreeLabel>
        {onRemove && (
          <IconButton
            onClick={ev => {
              ev.stopPropagation()
              onRemove()
            }}
          >
            <Icon size={12} name="No" />
          </IconButton>
        )}
      </TreeItem>
      {isOpen &&
        tree.childNodes.length > 0 &&
        !tree.disabled && (
          <TreeChildren>
            {tree.childNodes.map((childTree, index) => (
              <TreeRecursive
                key={index}
                tree={childTree}
                path={[...path, index]}
                recursiveTogglePath={recursiveTogglePath}
                openPaths={openPaths}
                maxDepth={maxDepth}
                onReorder={onReorder}
                reorderSource={reorderSource}
                reorderTarget={reorderTarget}
                setReorderSource={setReorderSource}
                setReorderTarget={setReorderTarget}
                isFirst={index === 0}
              />
            ))}
            {onReorder && (
              <FillerTreeItem
                isReorderDropTarget={false}
                {...reorderDndProps({
                  onReorder,
                  reorderSource,
                  setReorderSource,
                  reorderTarget,
                  setReorderTarget,
                })({ path: [...path, tree.childNodes.length], filler: true })}
              />
            )}
          </TreeChildren>
        )}
    </TreeContainer>
  )
}

class Tree extends React.Component<TreeProps, State> {
  public readonly state: State = {
    openPaths: this.getOpenPaths(),
  }

  private getOpenPaths() {
    return this.props.trees
      .map((tree, index) => getInitialOpenPaths([index])(tree))
      .reduce((current, accumulator) => [...current, ...accumulator], [])
  }

  public componentDidUpdate(prevProps: TreeProps) {
    if (getMaxDepth(this.props.trees) !== getMaxDepth(prevProps.trees)) {
      this.setState(() => ({
        openPaths: this.getOpenPaths(),
      }))
    }
  }

  private togglePath = (path: number[]) => {
    this.setState(prevState => ({
      openPaths: togglePath(path)(prevState.openPaths),
    }))
  }

  private setReorderSource = (reorderSource?: number[]) => {
    this.setState(() => ({
      reorderSource,
    }))
  }

  private setReorderTarget = (reorderTarget?: number[]) => {
    this.setState(() => ({
      reorderTarget,
    }))
  }

  public render() {
    const { trees, onReorder, ...props } = this.props
    return (
      <Container {...props}>
        {trees.map((tree, index) => (
          <TreeRecursive
            key={index}
            tree={tree}
            path={[index]}
            isFirst={index === 0}
            recursiveTogglePath={this.togglePath}
            openPaths={this.state.openPaths}
            maxDepth={getMaxDepth(trees)}
            onReorder={onReorder}
            reorderSource={this.state.reorderSource}
            setReorderSource={this.setReorderSource}
            reorderTarget={this.state.reorderTarget}
            setReorderTarget={this.setReorderTarget}
          />
        ))}
        {onReorder && (
          <FillerTreeItem
            isReorderDropTarget={false}
            {...reorderDndProps({
              onReorder,
              reorderSource: this.state.reorderSource,
              setReorderSource: this.setReorderSource,
              reorderTarget: this.state.reorderTarget,
              setReorderTarget: this.setReorderTarget,
            })({ path: [trees.length], filler: true })}
          />
        )}
      </Container>
    )
  }
}

export default Tree
