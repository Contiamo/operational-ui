import { defaults, filter, flow, forEach, identity, includes, isFinite, last, sortBy } from "lodash/fp"
import { axisPosition, insertElements, positionBackgroundRect } from "./axis_utils"
import { setTextAttributes, setLineAttributes } from "../../utils/d3_utils"
import { computeDomain, computeScale, computeSteps, computeTicks } from "../../utils/quant_axis_utils"
import * as styles from "./styles"

import {
  AxisAttributes,
  AxisClass,
  AxisComputed,
  QuantAxisOptions,
  AxisPosition,
  ChartConfig,
  Computed,
  D3Selection,
  EventBus,
  Object,
  Partial,
  State,
  StateWriter,
  XAxisConfig,
  YAxisConfig
} from "../typings"

class QuantAxis implements AxisClass<number> {
  computed: AxisComputed
  data: number[]
  end: number
  el: D3Selection
  events: EventBus
  expand: "smart" | "zero" | "custom" = "smart"
  interval: number // @TODO should the use be allowed to define the interval?
  isXAxis: boolean
  position: AxisPosition
  previous: AxisComputed
  start: number
  state: State
  stateWriter: StateWriter
  type: "time" | "quant" | "categorical" = "quant"
  unit: string

  constructor(state: State, stateWriter: StateWriter, events: EventBus, el: D3Selection, position: AxisPosition) {
    this.state = state
    this.stateWriter = stateWriter
    this.events = events
    this.position = position
    this.isXAxis = position[0] === "x"
    this.el = insertElements(el, position, this.state.current.get("computed").canvas.drawingDims)
    // this.el.on("mouseenter", this.onComponentHover(this))
  }

  // Quant axis only supports finite numbers
  validate(value: any): boolean {
    return isFinite(value)
  }

  private updateOptions(options: QuantAxisOptions): void {
    forEach.convert({ cap: false })((option: any, key: string): void => {
      ;(this as any)[key] = option
    })(options)
  }

  update(options: QuantAxisOptions, data: number[]): void {
    this.updateOptions(options)
    this.data = flow(filter(this.validate), sortBy(identity))(data)
  }

  draw(): void {
    this.drawTicks()
    this.drawBorder()
    positionBackgroundRect(this.el, this.state.current.get("config").duration)
  }

  // Computations
  compute(): void {
    this.previous = this.computed
    const computed: Partial<AxisComputed> = this.computeInitial()
    computed.ticks = computeTicks(computed.steps)
    computed.scale = computeScale(computed.range, computed.ticks)
    this.computed = computed as AxisComputed
    this.previous = defaults(this.previous)(this.computed)
  }

  private computeRange(): [number, number] {
    const config: ChartConfig = this.state.current.get("config")
    const computed: Computed = this.state.current.get("computed")
    const computedAxes: Object<number> = computed.axes.margins || {}
    const margin = (axis: AxisPosition): number =>
      includes(axis)(computed.axes.requiredAxes) ? computedAxes[axis] || config[axis].margin : 0
    return this.isXAxis
      ? [0, computed.canvas.drawingDims.width]
      : [computed.canvas.drawingDims.height, margin("x2") || (config[this.position] as YAxisConfig).minTopOffsetTopTick]
  }

  // @TODO typing
  computeInitial(): Partial<AxisComputed> {
    const options: XAxisConfig | YAxisConfig = this.state.current.get("config")[this.position]
    const computed: Partial<AxisComputed> = {}
    computed.range = this.computeRange()
    computed.domain = computeDomain(this.data, this.start, this.end, this.expand)
    computed.steps = computeSteps(computed.domain, computed.range, options.tickSpacing, options.minTicks)
    return computed
  }

  computeAligned(computed: Partial<AxisComputed>): void {
    this.previous = this.computed
    computed.domain = computed.steps.slice(0, 2) as [number, number]
    computed.scale = computeScale(computed.range, computed.domain)
    computed.ticks = computeTicks(computed.steps)
    // computed.baseline = this.computeBaseline(computed.domain, computed.scale)
    this.computed = computed as AxisComputed
    this.previous = defaults(this.previous)(this.computed)
  }

  private drawTicks(): void {
    const config: ChartConfig = this.state.current.get("config")
    const attributes: AxisAttributes = this.getAttributes()
    const startAttributes: AxisAttributes = this.getStartAttributes(attributes)

    const ticks: any = this.el
      .selectAll(`text.${styles.tick}.${styles[this.position]}`)
      // @TODO add tick mapper
      .data(this.computed.ticks)

    ticks
      .enter()
      .append("svg:text")
      .call(setTextAttributes, startAttributes)
      .merge(ticks)
      .attr("class", `${styles.tick} ${styles[this.position]}`)
      .call(setTextAttributes, attributes, config.duration)

    ticks
      .exit()
      .transition()
      .duration(config.duration)
      .call(setTextAttributes, defaults({ opacity: 1e6 })(attributes))
      .remove()

    this.adjustMargins()
  }

  private adjustMargins(): void {
    const computedMargins: Object<number> = this.state.current.get("computed").axes.margins || {}
    const config: XAxisConfig | YAxisConfig = this.state.current.get("config")[this.position]
    let requiredMargin: number = config.margin

    // @TODO Adjust for flags

    // Adjust for ticks
    if (this.isXAxis) {
      return
    }
    const axisWidth: number = this.el.node().getBBox().width
    requiredMargin = Math.max(requiredMargin, Math.ceil(axisWidth) + config.outerPadding)
    if (computedMargins[this.position] === requiredMargin) {
      return
    }

    computedMargins[this.position] = requiredMargin
    this.stateWriter("margins", computedMargins)
    this.events.emit("margins:update")
    this.el.attr(
      "transform",
      `translate(${axisPosition(this.position, this.state.current.get("computed").canvas.drawingDims).join(",")})`
    )
  }

  private tickFormatter(): (x: number) => string {
    const numberFormatter: (x: number) => string = this.state.current.get("config").numberFormatter
    const unitTick: number = this.isXAxis ? this.computed.ticks[0] : last(this.computed.ticks)
    return (x: number): string => (x === unitTick && this.unit ? this.unit : numberFormatter(x))
  }

  private getAttributes(): AxisAttributes {
    const tickOffset: number = this.state.current.get("config")[this.position].tickOffset
    return {
      dx: this.isXAxis ? 0 : tickOffset,
      dy: this.isXAxis ? tickOffset : "-0.4em",
      text: this.tickFormatter(),
      x: this.isXAxis ? this.computed.scale : 0,
      y: this.isXAxis ? 0 : this.computed.scale
    }
  }

  private getStartAttributes(attributes: AxisAttributes): AxisAttributes {
    return defaults({
      x: this.isXAxis ? this.previous.scale : 0,
      y: this.isXAxis ? 0 : this.previous.scale
    })(attributes)
  }

  private drawBorder(): void {
    const drawingDims: any = this.state.current.get("computed").canvas.drawingDims
    const border: Object<number> = {
      x1: 0,
      x2: this.isXAxis ? drawingDims.width : 0,
      y1: this.isXAxis ? 0 : drawingDims.height,
      y2: 0
    }
    this.el.select(`line.${styles.border}`).call(setLineAttributes, border)
  }

  remove(): void {}
}

export default QuantAxis
