import * as React from 'react';
import MonacoEditor from '../monaco';
import yaml from 'js-yaml';
import './index.scss';

const modes = ['json', 'yaml'] as const;
type Mode = typeof modes[number]

interface Props {
  data: any;
  onChange(newData: any): void;
  className?: string;
  mode?: Mode;
  children?: React.ReactNode | React.ReactNodeArray;
}

const JSONEditor = (props: Props) => {
  const uuid = React.useMemo(() => `${Math.random().toString(36)}-${Date.now().toString(36)}`, []);
  const [text, setText] = React.useState('');
  const [supressEffect, setSupressEffect] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>(props.mode || 'json');
  React.useEffect(() => setMode(props.mode || 'json'), [props.mode]);

  const restore = React.useCallback(() => {
    if (mode === 'json') setText(JSON.stringify(props.data, null, 2));
    if (mode === 'yaml') setText(yaml.dump(props.data));
  }, [props.data, mode]);

  const tempTimer = React.useRef<any>(null);
  const editorRef = React.useRef<MonacoEditor>(null);
  const monacoEditor = editorRef.current?.editor;

  const apply = React.useCallback((text: string) => {
    try {
      let value = undefined;

      if (mode === 'json') value = JSON.parse(text);
      if (mode === 'yaml') value = yaml.load(text);

      setSupressEffect(true);
      if (tempTimer.current) clearTimeout(tempTimer.current);
      tempTimer.current = setTimeout(() => {
        setSupressEffect(false);
        tempTimer.current = null;
      }, 200);

      props.onChange(value);
    } catch (error) {
      alert(`Error: ${error}`);
      console.error(error);
    }
  }, [props.onChange, mode]);

  React.useEffect(() => {
    if (!supressEffect) restore();
  }, [restore]);

  React.useEffect(() => {
    if (!monacoEditor) return;

    const listener = monacoEditor.onKeyDown((e) => {
      if ((e.metaKey || e.altKey) && e.code === 'Enter') {
        e.stopPropagation();
        e.preventDefault();

        setTimeout(() => apply(monacoEditor.getValue()), 100);
      }
    });

    return () => listener.dispose();
  }, [monacoEditor, apply]);

  return <div className={`jsonEditor ${props.className}` || ''}>
    <div className="jsonEditor-toolbar">
      <button onClick={restore}>重置</button>
      <button onClick={() => apply(monacoEditor!.getValue())}>提交 (<kbd>Alt+Enter</kbd>)</button>

      {modes.map(it => <label key={it}>
        <input type="radio" checked={mode === it} onChange={() => setMode(it)} />
        {it}
      </label>)}

      {props.children}
    </div>
    <div className="jsonEditor-body">
      <MonacoEditor
        filepath={`inmemory://model/${uuid}.${mode}`}
        value={text}
        onChange={setText}
        language={mode}
        height="100%"
        ref={editorRef}
      />
    </div>
  </div>;
};

export default React.memo(JSONEditor);
