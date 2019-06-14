import React, { useCallback, useEffect, useState, useRef } from "react"
import Spinner from "../Spinner/Spinner"
import styled from "../utils/styled"
import { IconComponentType } from "../Icon/Icon"
import { inputFocus } from "../utils"
import { useUniqueId } from "../useUniqueId"

export interface Tab {
  name: string
  children: React.ReactNode
  hidden?: boolean
  icon?: IconComponentType
  iconColor?: string
  loading?: boolean
}

export interface Props {
  tabs: Tab[]
  activeTabName?: string
  onTabChange?: (newTabName: string) => void
  children: (childrenConfig: { tabsBar: React.ReactNode; activeChildren: React.ReactNode }) => React.ReactNode
}

export interface State {
  activeTab: number
}

const tabsBarHeight = 48

const TabsBar = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  height: tabsBarHeight,
  position: "relative",
  margin: `0 ${theme.space.element}px`,
  "&::before": {
    content: "''",
    display: "block",
    position: "absolute",
    width: "100%",
    height: 0,
    top: tabsBarHeight - 1,
    left: 0,
    borderBottom: `1px solid ${theme.color.border.select}`,
  },
}))

const TabContainer = styled("div")<{ active?: boolean }>(({ theme, active }) => ({
  width: 150,
  height: "100%",
  display: "flex",
  alignItems: "center",
  fontFamily: theme.font.family.main,
  fontSize: theme.font.size.small,
  padding: `0px ${theme.space.element}px`,
  border: `1px solid ${theme.color.border.select}`,
  zIndex: 2,
  ...(active
    ? {
        backgroundColor: theme.color.white,
        color: theme.color.text.action,
        fontWeight: theme.font.weight.bold,
        borderBottomColor: theme.color.white,
      }
    : {
        backgroundColor: theme.color.background.lighter,
        color: theme.color.text.dark,
        fontWeight: theme.font.weight.regular,
        borderBottomColor: theme.color.border.select,
      }),
  borderRightWidth: 0,
  ":last-child": {
    borderRightWidth: 1,
  },
  ":hover": {
    cursor: "pointer",
  },
  ":focus": {
    ...inputFocus({ theme, isError: false }),
    borderRightWidth: 1,
    zIndex: 3,
  },
}))

const TabName = styled("p")(() => ({
  width: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textAlign: "center",
}))

const getTabIndexByName = (tabs: Tab[], tabName?: string): number => {
  if (tabName) {
    const index = tabs.findIndex(({ name }) => name === tabName)
    return index === -1 ? 0 : index
  }
  return 0
}

interface TabProps {
  index: number
  tab: Tab
  onTabClick: (index: number) => void
  isActive: boolean
  isKeyboardActive: boolean
}

const SingleTab = ({ index, isActive, onTabClick, tab, isKeyboardActive }: TabProps) => {
  const ref = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isActive && isKeyboardActive && ref.current) {
      ref.current.focus()
    }
  }, [isKeyboardActive, isActive])

  return (
    <TabContainer
      ref={ref}
      role="tab"
      active={isActive}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onTabClick(index)}
      onMouseDown={e => e.preventDefault()}
    >
      {tab.loading ? (
        <Spinner left size={14} />
      ) : (
        tab.icon && React.createElement(tab.icon, { size: 14, color: tab.iconColor, left: true })
      )}
      <TabName>{tab.name}</TabName>
    </TabContainer>
  )
}

const Tabs = ({ onTabChange, tabs, activeTabName, children }: Props) => {
  const activeTabIndex = getTabIndexByName(tabs, activeTabName)
  const [activeTab, setActiveTab] = useState(activeTabIndex)
  const uid = useUniqueId()
  const isKeyboardActive = useRef(false)

  const onTabClick = useCallback(
    (index: number) => {
      setActiveTab(index)
      if (onTabChange) {
        onTabChange(tabs[index].name)
      }
    },
    [onTabChange, tabs, setActiveTab],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      isKeyboardActive.current = true
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault()
          onTabClick(activeTab + 1 >= tabs.length ? 0 : activeTab + 1)
          break
        case "ArrowLeft":
          event.preventDefault()
          onTabClick(activeTab - 1 < 0 ? tabs.length - 1 : activeTab - 1)
          break
        case "Home":
          event.preventDefault()
          // Activate first tab
          onTabClick(0)
          break
        case "End":
          event.preventDefault()
          // Activate last tab
          onTabClick(tabs.length - 1)
          break
      }
    },
    [activeTab, onTabClick],
  )

  // Work around: wrap return in fragment- to prevent type error and not having to change childrens return type
  // https://github.com/Microsoft/TypeScript/issues/21699
  return (
    <>
      {children({
        tabsBar: (
          <TabsBar role="tablist" id={uid} onKeyDown={onKeyDown} onMouseDown={() => (isKeyboardActive.current = false)}>
            {tabs
              .filter(({ hidden }) => !hidden)
              .map((tab, index: number) => (
                <SingleTab
                  key={index}
                  index={index}
                  tab={tab}
                  onTabClick={onTabClick}
                  isActive={activeTab === index}
                  isKeyboardActive={isKeyboardActive.current}
                />
              ))}
          </TabsBar>
        ),
        activeChildren: tabs[activeTab].children,
      })}
    </>
  )
}

export default Tabs
