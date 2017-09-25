import { map } from "lodash/fp"
import * as d3 from "d3-selection"
import * as $ from "jquery"
import "d3-transition"
import { scaleLinear as d3ScaleLinear } from "d3-scale"
import { symbol as d3Symbol, symbolDiamond, symbolSquare, symbolCircle } from "d3-shape"
import { TNode, TLink, TScale } from "../typings"

abstract class AbstractRenderer {
  computed: any
  config: any
  data: TNode[] | TLink[]

  draw(svg: any, config: any, data: TNode[] | TLink[]): void {
    this.data = data
    this.config = config
    this.updateDraw(svg)
  }

  abstract updateDraw(svg: any): void

  sizeScale(range: [number, number]): TScale {
    const sizes: number[] = map((el: TLink | TNode): number => {
      return el.size()
    })(this.data)
    return d3ScaleLinear()
      .domain([0, Math.max(...sizes)])
      .range(range)
  }
}

export default AbstractRenderer
