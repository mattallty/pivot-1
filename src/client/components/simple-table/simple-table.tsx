require('./simple-table.css');

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { $, Datum, Expression, Executor, Dataset } from 'plywood';
import { Stage, Clicker, Essence, DataSource, Filter, Dimension, Measure } from '../../../common/models/index';
import { SvgIcon } from '../svg-icon/svg-icon';
import { Loader } from '../loader/loader';
import { QueryError } from '../query-error/query-error';
import { Fn } from "../../../common/utils/general/general";

// I am: import { SimpleTable } from '../simple-table/simple-table';

// dynamic inline positioning styles
export interface InlineStyle {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  display?: string;
}

export interface SimpleTableProps extends React.Props<any> {
  scrollLeft: number;
  scrollTop: number;
  rowHeight: number;
  headerColumns: JSX.Element[];
  rowWidth?: number;
  preRows?: JSX.Element;
  dataLength: number;
  rows: JSX.Element[];
  postRows?: JSX.Element;
  scrollContainer?: JSX.Element;
  loading: boolean;
  error: Error;
}

export interface SimpleTableState {

}

export class SimpleTable extends React.Component<SimpleTableProps, SimpleTableState> {
  static getFirstElementToShow( rowHeight: number, scrollTop: number) {
    return Math.max(0, Math.floor(scrollTop / rowHeight));
  }

  static getLastElementToShow(rowHeight: number, datasetLength: number, scrollTop: number, visibleHeight: number) {
    return Math.min(datasetLength, Math.ceil((scrollTop + visibleHeight) / rowHeight));
  }

  static getRowStyle(topValue: number): InlineStyle {
    return {
      top: topValue
    };
  }

  static getScrollerStyle(rowWidth: number, bodyHeight: number, spaceLeft: number, headerHeight: number, spaceRight: number, bodyPaddingBottom: number): InlineStyle {
    return {
      width: spaceLeft + rowWidth + spaceRight,
      height: headerHeight + bodyHeight + bodyPaddingBottom
    };
  }

  getHeaderStyle(): InlineStyle {
    const { scrollLeft, rowWidth } = this.props;
    return {
      width: rowWidth,
      left: -scrollLeft
    };
  }

  getBodyStyle(): InlineStyle {
    const { scrollLeft, scrollTop, rowWidth, dataLength, rowHeight } = this.props;
    return {
      left: -scrollLeft,
      top: -scrollTop,
      width: rowWidth,
      height: dataLength * rowHeight
    };
  }

  render() {
    var { headerColumns, preRows, rows, postRows, loading, error, scrollContainer  } = this.props;
    return <div className="simple-table">
      <div className="header-cont">
        <div className="header" style={this.getHeaderStyle()}>{headerColumns}</div>
      </div>
      { preRows }
      <div className="body-cont">
        <div className="body" style={this.getBodyStyle()}>{rows}</div>
      </div>
      { postRows }
      { scrollContainer }
    </div>;
  }
}
