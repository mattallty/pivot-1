require('./scroller.css');

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { $, Expression, Executor, Dataset } from 'plywood';
import { Stage, Clicker, Essence, DataSource, Filter, Dimension, Measure } from '../../../common/models/index';
// import { ... } from '../../config/constants';
import { SvgIcon } from '../svg-icon/svg-icon';
import { Fn } from "../../../common/utils/general/general";

export interface ScrollerProps extends React.Props<any> {
  onScroll: Fn;
  style?: Lookup<any>;
  ref?: string;
  className?: string;
  onMouseLeave?: Fn;
  onMouseMove?: Fn;
  onClick?: Fn;
}

export interface ScrollerState {
}

export class Scroller extends React.Component<ScrollerProps, ScrollerState> {

  render() {
    const { style, onScroll, onMouseLeave, onMouseMove, onClick } = this.props;
    return <div
      className="scroller"
      ref="base"
      onScroll={onScroll}
      onMouseLeave={onMouseLeave || null}
      onMouseMove={onMouseMove || null}
      onClick={onClick || null}
    >
      <div className="scroller-inner" style={style}></div>
    </div>;
  }
}
