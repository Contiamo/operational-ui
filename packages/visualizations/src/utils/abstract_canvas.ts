import State from "./state"
import Events from "./event_catalog"
import * as d3 from "d3-selection"
import { reduce, isArray } from "lodash/fp"

type ChartState = {
  current: any
  previous: any
}

abstract class AbstractCanvas {
  container: d3.Selection<Element, null, Window, undefined>
  el: d3.Selection<Element, null, Window, undefined>
  protected elements: any = {}
  protected state: ChartState

  constructor(context: any, state: ChartState) {
    this.state = state
    this.container = d3.select(context)
    this.el = this.createEl()
    this.el.attr("class", "processflow")
    this.insertEl()
    this.createInitialElements()
    // this.listenToMouseOver()
  }

  abstract createEl(): d3.Selection<Element, null, Window, undefined>

  insertEl(): void {
    this.container.node().appendChild(this.el.node())
  }

  createInitialElements(): void {
    return
  }

  // prefixedId(id: string): string {
  //   return this.state.uid + id
  // }
  //
  // listenToMouseOver(): void {
  //   let el: d3.Selection<Node> = this.mouseOverElement()
  //   if (el) {
  //     $(el.node())
  //       .on(
  //         "mouseenter",
  //         _.bind(function(): void {
  //           this.state.trigger(Events.CHART.HOVER)
  //           this.trackMouseMove()
  //         }, this),
  //       )
  //       .on(
  //         "mouseleave",
  //         _.bind(function(): void {
  //           this.state.trigger(Events.CHART.OUT)
  //           this.stopMouseMove()
  //         }, this),
  //       )
  //       .on(
  //         "mouseclick",
  //         _.bind(function(): void {
  //           this.state.trigger(Events.CHART.CLICK)
  //         }, this),
  //       )
  //   }
  // }

  rootElement(): Node {
    return this.container.node()
  }

  // abstract mouseOverElement(): d3.Selection<Node>
  //
  // trackMouseMove(): void {
  //   return
  // }
  //
  // stopMouseMove(): void {
  //   return
  // }

  seriesElements(): string[] | string[][] {
    return []
  }

  insertSeries(): { [key: string]: any[] } {
    let that: AbstractCanvas = this
    return reduce((memo: any, se: string | string[]): any => {
      let renderer: string = isArray(se) ? se[0] : se
      memo[renderer] = this.elements.series[renderer].append("svg:g")
      return memo
    }, {})(this.seriesElements())
  }

  // insertElement(name: string, element: d3.Selection<Node>): void {
  //   this.elements[name].node().appendChild(element.node())
  // }
  //
  // insertFocus(element: d3.Selection<Node>): void {
  //   let ref: Node = this.el.node()
  //   ref.parentNode.appendChild(element.node())
  // }
  //
  // insertComponentFocus(element: d3.Selection<Node>): void {
  //   let ref: Node = this.container.node()
  //   ref.insertBefore(element.node(), ref.nextSibling)
  // }
  //
  // toggleSmall(value?: boolean): void {
  //   this.el.classed(this.state.options.smallClass, value)
  // }

  draw(computed: any): void {
    const config = this.state.current.state.config
    this.container.style("width", config.width + "px").style("height", config.height + "px")

    this.el.style("width", config.width + "px").style("height", config.height + "px")

    this.el
      .select("marker#arrow")
      .attr("fill", config.arrowFill)
      .attr("stroke", config.linkStroke)

    computed.el = this.el
  }

  margin(side: string): number {
    return parseInt(this.el.style("margin-" + side), 10) || 0
  }

  resize(computed: any): void {
    return this.draw(computed)
  }

  remove(): void {
    // $(this.mouseOverElement().node()).off()
    this.elements = {}
    this.container.remove()
    this.container = undefined
    this.el = undefined
  }
}

export default AbstractCanvas
