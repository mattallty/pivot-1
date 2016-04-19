require('./raw-data-modal.css');

import * as React from 'react';
import { List } from 'immutable';
import { $, Expression, Executor, Dataset, PlywoodValue, Datum, Set, AttributeInfo } from 'plywood';
import { Essence, Stage, FilterClause, Dimension, Measure, DataSource } from '../../../common/models/index';

import { Fn, makeTitle, hasOwnProperty, setToString, arraySum } from "../../../common/utils/general/general";
import { formatTimeRange, DisplayYear } from "../../utils/date/date";
import { formatLabel } from "../../../common/utils/formatter/formatter";
import { STRINGS, SEGMENT, SPLIT} from '../../config/constants';
import { Modal } from '../modal/modal';
import { Button } from '../button/button';
import { DownloadButton } from '../download-button/download-button';
import { Scroller } from '../scroller/scroller';
import { SvgIcon } from '../../components/svg-icon/svg-icon';
import { Loader } from '../loader/loader';
import { QueryError } from '../query-error/query-error';
import { SimpleTable, InlineStyle } from '../../components/simple-table/simple-table';

const SPACE_RIGHT = 10;
const SPACE_LEFT = 10;
const HEADER_HEIGHT = 38;
const BODY_PADDING_BOTTOM = 90;
const ROW_HEIGHT = 30;
const LIMIT = 100;
const TIME_COL_WIDTH = 170;
const BOOLEAN_COL_WIDTH = 50;
const NUMBER_COL_WIDTH = 70;
const DEFAULT_COL_WIDTH = 100;

export interface RawDataModalProps extends React.Props<any> {
  onClose: Fn;
  stage: Stage;
  essence: Essence;
  parentId?: string;
}

export interface RawDataModalState {
  dataset?: Dataset;
  error?: Error;
  loading?: boolean;
  scrollLeft?: number;
  scrollTop?: number;
}

function getColumnWidth(type: string): number {
  switch (type) {
    case 'boolean':
      return BOOLEAN_COL_WIDTH;
    case 'number':
      return NUMBER_COL_WIDTH;
    default:
      return DEFAULT_COL_WIDTH;
  }
}

export class RawDataModal extends React.Component<RawDataModalProps, RawDataModalState> {
  static id = 'raw-data-table';

  public mounted: boolean;
  public attributesWidth: number[];

  constructor() {
    super();
    this.state = {
      loading: false,
      dataset: null,
      scrollLeft: 0,
      scrollTop: 0,
      error: null
    };

    this.attributesWidth = [];
  }

  componentDidMount() {
    this.mounted = true;
    const { essence } = this.props;
    this.fetchData(essence);
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchData(essence: Essence): void {
    const { dataSource } = essence;
    const $main = $('main');
    const query = $main.filter(essence.getEffectiveFilter(RawDataModal.id).toExpression()).limit(LIMIT);
    this.setState({ loading: true });
    dataSource.executor(query)
      .then(
        (dataset: Dataset) => {
          if (!this.mounted) return;
          this.setState({
            dataset,
            loading: false
          });
        },
        (error: Error) => {
          if (!this.mounted) return;
          this.setState({
            error,
            loading: false
          });
        }
      );
  }

  onScroll(e: UIEvent) {
    const target = e.target as Element;
    this.setState({
      scrollLeft: target.scrollLeft,
      scrollTop: target.scrollTop
    });
  }

  getStringifiedFilters(): List<string> {
    const { essence } = this.props;
    const { dataSource } = essence;
    return essence.getEffectiveFilter(RawDataModal.id).clauses.map((clause, i) => {
      const dimension = dataSource.getDimensionByExpression(clause.expression);
      if (!dimension) return null;
      return formatLabel({ dimension, clause, essence, verbose: true });
    }).toList();
  }

  renderFilters(): List<JSX.Element> {
    const stringifiedFilters = this.getStringifiedFilters();
    var filters = stringifiedFilters.map((filter: string, i: number) => {
      return <li className="filter" key={i}>{filter}</li>;
    });
    filters = filters.concat(<li className="filter" key="filter">limit: {LIMIT}</li>);
    return filters.toList();
  }

  renderHeader(dataset: Dataset): JSX.Element[] {
    if (!dataset) return null;
    const { essence } = this.props;
    const { dataSource } = essence;
    const attributes = dataset.attributes;
    const timeAttribute: string = dataSource.timeAttribute.name;
    const timeColStyle = { width: TIME_COL_WIDTH };
    var cols = [ <div className="table-header" style={timeColStyle} key="time">
      <span className="title-wrap">
        {makeTitle(timeAttribute)}
      </span>
    </div> ];
    this.attributesWidth = [TIME_COL_WIDTH];
    attributes.map((attribute, i) => {
      const name = attribute.name;
      if (name === timeAttribute) return;
      const width = getColumnWidth(attribute.type);
      const style = { width };
      const key = name;
      this.attributesWidth = this.attributesWidth.concat(width);
      cols = cols.concat(<div className="table-header" style={style} key={i}>
        <div className="title-wrap">
          {makeTitle(key)}
        </div>
      </div>);
    });
    return cols;
  }

  renderRows(dataset: Dataset, scrollTop: number, stage: Stage): JSX.Element[] {
    if (!dataset) return null;
    const { essence } = this.props;
    const { dataSource } = essence;
    const rawData = dataset.data;
    const firstElementToShow = SimpleTable.getFirstElementToShow(ROW_HEIGHT, scrollTop);
    const lastElementToShow = SimpleTable.getLastElementToShow(ROW_HEIGHT, rawData.length, scrollTop, stage.height);
    const attributes = dataset.attributes;
    const timeAttribute: string = dataSource.timeAttribute.name;
    const rows = rawData.slice(firstElementToShow, lastElementToShow);
    var rowY = firstElementToShow * ROW_HEIGHT;
    return rows.map((datum: Datum, i: number) => {
      const colStyle = { width: TIME_COL_WIDTH };
      var cols = [ <div className="cell" key="time" style={colStyle}>
        <span className="cell-value">
          { `${new Date(datum[timeAttribute].toString()).toISOString()}` }
        </span>
      </div> ];

      attributes.map((attribute: AttributeInfo, colNumber: number) => {
        const name = attribute.name;
        if (name === timeAttribute) return;
        const colStyle = {
          width: this.attributesWidth[colNumber]
        };
        const key = name;
        const value: PlywoodValue = datum[key];
        var displayValue = value;

        if (Set.isSet(value)) {
          displayValue = setToString(value);
        }

        cols = cols.concat(<div className="cell" key={key} style={colStyle}>
          <span className="cell-value">
            {displayValue}
          </span>
        </div>);
      });

      const rowStyle = { top: rowY };
      rowY += ROW_HEIGHT;
      return <div className="row" style={rowStyle} key={i}>{cols}</div>;
    });
  }

  makeFileName(): string {
    const { essence } = this.props;
    const visType = essence.visualization.title.toLowerCase();
    const filters = this.getStringifiedFilters();
    var wordsOnly = "";
    if (filters.size > 2) {
      wordsOnly = `filters-${filters.size}`;
    } else {
      wordsOnly = filters.map((filter) => {
        return filter.toLowerCase().replace(/[^0-9a-z]/g, '');
      }).join('-');
    }
    const dsName = essence.dataSource.name.toLowerCase().substr(0, 5);
    return `${dsName}-${visType}-${wordsOnly}`;
  }

  render() {
    const { onClose, stage } = this.props;
    const { dataset, loading, scrollTop, scrollLeft, error } = this.state;
    const headerColumns = this.renderHeader(dataset);
    const rows = this.renderRows(dataset, scrollTop, stage);
    const rowWidth = arraySum(this.attributesWidth);
    const title = `${makeTitle(SEGMENT.toLowerCase())} ${STRINGS.rawData}`;
    const dataLength = dataset ? dataset.data.length : 0;
    const bodyHeight = dataLength * ROW_HEIGHT;

    var horizontalScrollShadowStyle: InlineStyle = { display: 'none' };
    if (scrollTop) {
      horizontalScrollShadowStyle = {
        width: rowWidth - scrollLeft
      };
    }

    var loader: JSX.Element = null;
    if (loading) {
      loader = <Loader/>;
    }

    var queryError: JSX.Element = null;
    if (error) {
      queryError = <QueryError error={error}/>;
    }

    const postRows = <div className="post-body">
      {queryError}
      {loader}
      <div className="horizontal-scroll-shadow" style={horizontalScrollShadowStyle}></div>
    </div>;

    const scrollerStyle = SimpleTable.getScrollerStyle(rowWidth, bodyHeight, SPACE_LEFT, HEADER_HEIGHT, SPACE_RIGHT, BODY_PADDING_BOTTOM);
    const scrollContainer = <Scroller style={scrollerStyle} onScroll={this.onScroll.bind(this)}/>;
    var downloadButton: JSX.Element = null;
    const showDownload = true;
    if (showDownload) {
      downloadButton = <DownloadButton
        type="secondary"
        fileName={this.makeFileName()}
        fileFormat={DownloadButton.defaultFileFormat}
        dataset={dataset} />;
    }

    return <Modal
      className="raw-data-modal"
      title={title}
      onClose={onClose}
    >
      <div className="content">
        <ul className="filters">{this.renderFilters()}</ul>
        <SimpleTable
          scrollLeft={scrollLeft}
          scrollTop={scrollTop}
          rowHeight={ROW_HEIGHT}
          loading={loading}
          error={error}
          headerColumns={headerColumns}
          rowWidth={rowWidth}
          rows={rows}
          postRows={postRows}
          scrollContainer={error ? null : scrollContainer}
          dataLength={dataLength}
        />
        <div className="button-bar">
          <Button type="primary" className="close" onClick={onClose} title={STRINGS.close}/>
          { downloadButton }
        </div>
      </div>
    </Modal>;
  }
}

