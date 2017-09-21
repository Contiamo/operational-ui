import * as React from "react"
import { Link } from "react-router-dom"

import Playground from "../../components/Playground/Playground"
import { Sidebar, SidebarItem, SidebarLink, Card, CardHeader } from "contiamo-ui-components"

import Table from "../../components/PropsTable/PropsTable"
import * as snippet from "./snippets/sidebar.snippet"
import propDescription from "./propDescription"

export const fetch = (text: any) => new Promise(resolve => setTimeout(() => resolve(text), 2000))

export default () => (
  <Card>
    <CardHeader>Sidebar</CardHeader>

    <p>
      The sidebar is a dynamic list-style navigational element to be used in cases with a large number of list-style
      actionable items. This component involves composition of two constituent elements. Namely,
    </p>
    <ul>
      <li>
        <a href="#sidebar-item">SidebarItem</a>
      </li>
      <li>
        <a href="#sidebar-link">SidebarLink</a>
      </li>
    </ul>

    <div style={{ marginBottom: 32 }} />

    <h4>Usage</h4>
    <Playground snippet={String(snippet)} components={{ Sidebar, SidebarItem, SidebarLink }} scope={{ fetch }} />

    <div style={{ marginBottom: 32 }} />

    <CardHeader id="sidebar-item">SidebarItem</CardHeader>
    <h4>An expandable group of SidebarLinks, with added asynchronous functionality.</h4>

    <Table props={propDescription.sidebarItem} />
    <p style={{ marginTop: 16, marginBottom: 32 }}>
      <strong>
        Note: This component is wrapped with <Link to="/tooltips">withTooltip</Link> and thus exposes all of the props
        that such components do.
      </strong>
    </p>

    <CardHeader id="sidebar-link">SidebarLink</CardHeader>
    <p>A link, but with onClick instead of href.</p>

    <Table props={propDescription.sidebarLink} />
    <p style={{ marginTop: 16, marginBottom: 32 }}>
      <strong>
        Note: This component is wrapped with <Link to="/tooltips">withTooltip</Link> and thus exposes all of the props
        that such components do.
      </strong>
    </p>
  </Card>
)
