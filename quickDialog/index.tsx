import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';

interface QuickDialogCtl {
  close(): void
}

interface Props {
  title: string
  disableMaskClose?: boolean
  disablCloseButton?: boolean
  width?: number
  height?: number
  content(props: { ctl: QuickDialogCtl }): JSX.Element
}

export default function openQuickDialog(props: Props) {
  const domContainer = document.createElement('div');
  const ctl: QuickDialogCtl = {
    close() {
      ReactDOM.unmountComponentAtNode(domContainer);
      domContainer.parentElement!.removeChild(domContainer);
    },
  };

  domContainer.tabIndex = 0;
  domContainer.className = 'quickDialog-container';
  if (!props.disablCloseButton && !props.disableMaskClose) {
    domContainer.addEventListener('keydown', (ev) => {
      if (ev.which === 27) { // ESC
        ev.stopPropagation();
        ev.preventDefault();
        ctl.close();
      }
    }, false);

    if (!props.disableMaskClose) {
      domContainer.addEventListener('click', (ev) => {
        if (ev.target === domContainer) {
          ctl.close();
        }
      }, false);
    }
  }
  document.body.appendChild(domContainer);

  ReactDOM.render(
    <div className="quickDialog">
      <div className="quickDialog-title">
        <div className="quickDialog-title-text">{props.title}</div>
        {props.disablCloseButton || <button className="quickDialog-close" onClick={ctl.close}>X</button>}
      </div>
      <div className="quickDialog-content" style={{ width: props.width, height: props.height, flexBasis: props.height }}>
        <props.content ctl={ctl} />
      </div>
    </div>,
    domContainer,
    () => domContainer.focus(),
  );
}
