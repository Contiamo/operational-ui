import { isEqual } from "lodash"
import * as React from "react"
import nanoid from "nanoid"

import { DefaultProps } from "../types"
import styled from "../utils/styled"
import ContextMenuItem, { IContextMenuItem } from "./ContextMenu.Item"

export interface ContextMenuProps extends DefaultProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode)
  /** Specify whether the menu items are visible. Overrides internal open state that triggers on click. */
  open?: boolean
  /** Condensed mode */
  condensed?: boolean
  /** onClick method for all menu items */
  onClick?: (item: IContextMenuItem) => void
  /** Handles click events anywhere outside the context menu container, including menu items. */
  onOutsideClick?: () => void
  /** Suppresses the default behavior of closing the context menu when one of its items is clicked. */
  keepOpenOnItemClick?: boolean
  /** Menu items */
  items: Array<string | IContextMenuItem>
  /** Where shall we place an icon in rows? */
  iconLocation?: "left" | "right"
  /** Alignment */
  align?: "left" | "right"
  /** Custom width */
  width?: number
  /* Is the child disabled? */
  disabled?: boolean
  /**
   * Whether to include the click element in the context menu styling.
   * Only recommended when the click element is the same width as the context menu.
   */
  embedChildrenInMenu?: boolean
}

export interface State {
  isOpen: boolean
  focusedItemIndex: number
}

const isChildAFunction = (children: ContextMenuProps["children"]): children is (isActive: boolean) => React.ReactNode =>
  typeof children === "function"

const Container = styled("div")<{ align: ContextMenuProps["align"]; isOpen: boolean }>(({ isOpen, theme, align }) => ({
  label: "contextmenu",
  cursor: "pointer",
  position: "relative",
  width: "fit-content",
  display: "flex",
  alignItems: "center",
  justifyContent: align === "left" ? "flex-start" : "flex-end",
  zIndex: isOpen ? theme.zIndex.selectOptions + 1 : theme.zIndex.selectOptions,
  outline: "none",
}))

const rowHeight = 40

const MenuContainer = styled("div")<{
  embedChildrenInMenu?: ContextMenuProps["embedChildrenInMenu"]
  numRows: number
  align: ContextMenuProps["align"]
}>(({ theme, numRows, align, embedChildrenInMenu }) => ({
  position: "absolute",
  top: embedChildrenInMenu ? 0 : "100%",
  left: align === "left" ? 0 : "auto",
  maxHeight: 360,
  overflow: "auto",
  boxShadow: theme.shadows.popup,
  width: "100%",
  minWidth: "fit-content",
  display: "grid",
  gridTemplateRows: `repeat(${numRows}, ${rowHeight}px)`,
}))

/**
 * Overlay to prevent mouse events when the context menu is open
 */
const InvisibleOverlay = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  cursor: "default",
  zIndex: theme.zIndex.selectOptions + 1,
}))

class ContextMenu extends React.Component<ContextMenuProps, Readonly<State>> {
  private menu: HTMLDivElement | null = null
  private uniqueId = this.props.id || (nanoid()[0] as string)

  private toggle = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    this.setState(prevState => ({
      isOpen: !prevState.isOpen,
      focusedItemIndex: -1, // reset focus on open and close
    }))
  }

  private focusElement = () => {
    if (this.menu && this.menu.querySelector('[tabindex="0"]')) {
      setTimeout(() => (this.menu!.querySelector('[tabindex="0"]') as HTMLDivElement).focus())
    }
  }

  private onUpPress = () => ({
    focusedItemIndex: this.state.focusedItemIndex === 0 ? this.props.items.length - 1 : this.state.focusedItemIndex - 1,
  })

  private onHomePress = () => ({
    focusedItemIndex: 0,
  })

  private onDownPress = () => ({
    focusedItemIndex: this.state.focusedItemIndex === this.props.items.length - 1 ? 0 : this.state.focusedItemIndex + 1,
  })

  private onEndPress = () => ({
    focusedItemIndex: this.props.items.length - 1,
  })

  private handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = e

    switch (key) {
      case "Enter":
      case "Space":
      case " ":
        if (this.props.onClick && !this.props.disabled) {
          e.preventDefault() // prevent document scroll.
          if (!this.state.isOpen) {
            this.toggle(e)
            return
          }
          this.props.onClick(this.makeItem(this.props.items[this.state.focusedItemIndex]))
          if (!this.props.keepOpenOnItemClick) {
            this.setState(() => ({ isOpen: false }))
          }
          return
        }
        return

      case "Escape":
        this.setState(() => ({ isOpen: false }))
        return

      case "ArrowUp":
      case "ArrowDown":
        e.preventDefault() // prevent document scroll.
        this.setState(key === "ArrowUp" ? this.onUpPress : this.onDownPress)
        this.focusElement()
        return

      case "Home":
        e.preventDefault()
        this.setState(this.onHomePress)
        this.focusElement()
        return

      case "End":
        e.preventDefault()
        this.setState(this.onEndPress)
        this.focusElement()
        return
    }
  }

  /**
   * Preserve the public API: if users submit strings in props.items,
   * convert them into actual ContextMenuItems.
   */
  private makeItem = (itemFromProps: ContextMenuProps["items"][-1]) =>
    typeof itemFromProps === "string" ? { label: itemFromProps } : itemFromProps

  public readonly state: State = {
    isOpen: false,
    focusedItemIndex: 0,
  }

  public static defaultProps: Partial<ContextMenuProps> = {
    align: "left",
    embedChildrenInMenu: false,
  }

  public componentDidUpdate(prevProps: ContextMenuProps) {
    // Reset focused item to first if items change.
    if (!isEqual(this.props.items, prevProps.items)) {
      this.setState(() => ({ focusedItemIndex: this.props.items.length - 1 }))
    }
  }

  public render() {
    if (!this.props.items) {
      throw new Error("No array of items has been provided for the ContextMenu.")
    }

    const {
      keepOpenOnItemClick,
      condensed,
      iconLocation,
      children,
      open,
      embedChildrenInMenu,
      align,
      disabled,
      items,
      width,
      ...props
    } = this.props
    const isOpen = open || this.state.isOpen
    const renderedChildren = isChildAFunction(children) ? children(this.state.isOpen) : children
    return (
      <>
        {isOpen && <InvisibleOverlay onClick={this.toggle} />}
        <Container
          {...props}
          aria-activedescendant={`operational-ui__ContextMenuItem-${this.uniqueId}-${this.state.focusedItemIndex}`}
          aria-disabled={Boolean(disabled)}
          aria-expanded={isOpen}
          isOpen={isOpen}
          align={align}
          onClick={e => {
            if (!disabled) {
              this.toggle(e)
            }
          }}
          onKeyDown={this.handleKeyPress}
        >
          {renderedChildren}
          {isOpen && (
            <MenuContainer
              numRows={items.length}
              align={this.props.align}
              ref={node => (this.menu = node)}
              embedChildrenInMenu={this.props.embedChildrenInMenu}
            >
              {embedChildrenInMenu && renderedChildren}
              {items.map((itemFromProps, index: number) => {
                const item = this.makeItem(itemFromProps)
                const clickHandler = item.onClick ? item.onClick : this.props.onClick

                return (
                  <ContextMenuItem
                    id={`operational-ui__ContextMenuItem-${this.uniqueId}-${index}`}
                    isActive={item.isActive}
                    tabIndex={this.state.focusedItemIndex === index ? 0 : -1} // ref "tabindex roving": https://developers.google.com/web/fundamentals/accessibility/focus/using-tabindex
                    onClick={e => {
                      if (keepOpenOnItemClick) {
                        e.stopPropagation()
                      }
                      if (clickHandler) {
                        return clickHandler(item)
                      }
                    }}
                    key={`contextmenu-${index}`}
                    condensed={condensed}
                    align={align}
                    iconLocation={iconLocation}
                    width={width || "100%"}
                    item={item}
                  />
                )
              })}
            </MenuContainer>
          )}
        </Container>
      </>
    )
  }
}

export default ContextMenu
