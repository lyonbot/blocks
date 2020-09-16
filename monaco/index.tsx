import * as React from 'react';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import { getMonaco, Monaco } from './getMonaco';
import debounce from 'lodash/debounce';
import './index.css';

interface IProps {
  value: string
  filepath: string
  language?: string
  className?: string
  width?: string | number
  height?: string | number

  onReady?(self: MonacoEditor): void
  onChange?(value: string): void
}

type IState = ReturnType<typeof initialState>
const initialState = () => ({
  loading: '载入编辑器中...',
  value: '',
  filepath: '',
  language: 'javascript',
  className: '',
  width: '' as (string | number),
  height: '' as (string | number),
});

const NO_OP = () => { };

export default class MonacoEditor extends React.Component<IProps, IState> {
  state = initialState()

  container = React.createRef<HTMLDivElement>()
  editor: MonacoEditorNS.IStandaloneCodeEditor
  model: MonacoEditorNS.ITextModel
  monaco: Monaco

  constructor(props: IProps) {
    super(props);
  }

  handleContentChange = debounce(() => {
    const value = this.model.getValue();
    if (this.state.value !== value) {
      this.state.value = value;
      (this.props.onChange || NO_OP)(value);
    }
  }, 500)

  componentDidMount() {
    getMonaco().then((monaco) => {
      this.monaco = monaco;

      const { state } = this;
      const model = monaco.editor.createModel(state.value, state.language, monaco.Uri.parse(state.filepath));
      const editor = monaco.editor.create(this.container.current!, {
        model,
        fontSize: 14,
      });

      editor.onDidChangeModelContent(this.handleContentChange);
      editor.onDidBlurEditorText(() => this.handleContentChange.flush());

      this.model = model;
      this.editor = editor;

      this.setState({ loading: '' });
      (this.props.onReady || NO_OP)(this);
    });

    window.addEventListener('resize', this._resizeHandler, false);
  }

  componentWillUnmount() {
    this.handleContentChange.flush();
    this.editor.dispose();
    this.model.dispose();
    window.removeEventListener('resize', this._resizeHandler, false);
  }

  private _resizeHandler = () => {
    const { editor } = this;
    if (editor) editor.layout();
  }

  static getDerivedStateFromProps(props: IProps): Partial<IState> {
    return {
      value: props.value,
      filepath: props.filepath,
      language: props.language || 'javascript',
      className: props.className || '',
      width: props.width || '',
      height: props.height || '',
    };
  }

  /** [old, new] */
  private _SCUHint: { [k in keyof IState]?: [IState[k], IState[k]] } = {}
  shouldComponentUpdate(nextProps: IProps, nextState: IState) {
    const { state } = this;
    const hint: MonacoEditor['_SCUHint'] = {};
    let changed = false;
    for (const key in state) {
      const oldV = state[key];
      const newV = nextState[key];
      if (oldV !== newV) {
        hint[key] = [oldV, newV];
        changed = true;
      }
    }
    this._SCUHint = hint;
    return changed;
  }

  render() {
    const { monaco, state } = this;
    const { loading, width, height } = state;

    if (!loading && this._SCUHint) {
      const hint = this._SCUHint;
      const { model } = this;
      Object.keys(hint).forEach((key: keyof IState) => {
        if (key === 'filepath') {
          const model2 = monaco.editor.createModel(
            model.getValue(),
            state.language,
            monaco.Uri.parse(state.filepath),
          );
          this.editor.setModel(model2);
          this.model = model2;
          model.dispose();
        } else {
          if (key === 'value') model.setValue(state.value);
          if (key === 'language') monaco.editor.setModelLanguage(model, state.language);
        }
      });
    }

    const style = { width, height };

    return <div
      ref={this.container}
      className={`x-monaco-editor ${state.className}`}
      style={style}
    />;
  }
}
