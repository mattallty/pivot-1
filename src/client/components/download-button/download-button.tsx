require('./download-button.css');

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as filesaver from 'browser-filesaver';

import { $, Expression, Executor, Dataset, Set } from 'plywood';
import { Stage, Clicker, Essence, DataSource, Filter, Dimension, Measure } from '../../../common/models/index';
// import { ... } from '../../config/constants';
import { STRINGS } from "../../config/constants";
import { setToString } from "../../../common/utils/general/general";
import { classNames } from "../../utils/dom/dom";
import { SvgIcon } from '../svg-icon/svg-icon';
import { Button, ButtonType } from '../button/button';


// styled link, not button
export type FileFormat = "csv" | "tsv" | "json" | "txt";

export interface DownloadButtonProps extends React.Props<any> {
  dataset: Dataset;
  type?: ButtonType;
  fileName?: string;
  fileFormat?: FileFormat;
}

export interface DownloadButtonState {
}

export class DownloadButton extends React.Component<DownloadButtonProps, DownloadButtonState> {
  static defaultFileFormat: FileFormat = 'tsv';

  static renderDisabled(type: ButtonType) {
    return <Button
      type={type}
      title={STRINGS.download}
      active={false}
    />;
  }

  static getMIMEType(fileType: string) {
    switch (fileType) {
      case 'csv':
        return 'text/csv';
      case 'tsv':
        return 'text/tsv';
      default:
        return 'application/json';
    }
  }

  downloadFile(): void {
    const { fileFormat } = this.props;
    var { fileName } = this.props;
    const type = `${DownloadButton.getMIMEType(fileFormat)};charset=utf-8`;
    const blob = new Blob([this.datasetToFileString()], {type});
    if (!fileName) fileName = `${new Date()}-data`;
    fileName += `.${fileFormat || 'json'}`;
    filesaver.saveAs(blob, fileName);
  }

  datasetToFileString(): string {
    const { fileFormat, dataset } = this.props;
    if (fileFormat === 'csv') {
      return dataset.toCSV({
        formatter: {
          'SET/STRING': ((v: Set) => {
            return setToString(v, { encloseIn: ["\"[", "\"]"] });
          }),
          'STRING': ((v: string) => {
            if (v) var noLineBreaks = v.replace(/(?:\r\n|\r|\n)/g, '');
            return `"${noLineBreaks}"`;
          })
        }
      });
    } else if (fileFormat === 'tsv') {
      return dataset.toTSV({
        formatter: {
          'SET/STRING': ((v: Set) => {
            return setToString(v, { encloseIn: ["[", "]"] });
          }),
          'STRING': ((v: string) => {
            if (v) var noLineBreaks = v.replace(/(?:\r\n|\r|\n)/g, '');
            return noLineBreaks;
          })
        }
      });
    } else {
      return JSON.stringify(dataset.toJS(), null, 2);
    }
  }

  render() {
    const { dataset, type } = this.props;
    if (!dataset) return DownloadButton.renderDisabled(type);
    return <Button
      type={type}
      onClick={this.downloadFile.bind(this)}
      title={STRINGS.download}
      />;
  }
}
