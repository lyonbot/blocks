import React, { useState, useCallback } from 'react';
import './index.scss';

type FieldSchema<T> = {
  label?: string
  type?: 'string' | 'number' | 'boolean' | 'file' | 'readonly' | 'textarea'
  value: T
  step?: number
  domProps?: React.HTMLProps<HTMLElement> & { ref: React.Ref<any> }
}

type BaseFormSchema = Record<string, FieldSchema<any>>

type FormResultOf<SCHEMA extends BaseFormSchema> = {
  [k in keyof SCHEMA]: SCHEMA[k]['value']
} & {}

let genCounter = 0;
const genID = () => `randID-${++genCounter}`;

const FormItem = (props: {
  name: string,
  schema: FieldSchema<any>,

  value: any,
  onChange: (data: any) => void
}) => {
  const [id] = useState(genID);
  const { value, schema, onChange: commit } = props;
  const domProps = schema.domProps || {};

  const handleFile = (input: HTMLInputElement) => {
    const files = input.files!;
    if (!files.length) return; // commit(null)
    commit(files[0]);
  };

  let el: JSX.Element;
  switch (schema.type!) {
    case 'string':
      el = <input
        id={id}
        type="text"
        {...domProps}
        value={value}
        onChange={(ev) => {
          commit(ev.target.value);
        }}
      />;
      break;

    case 'textarea':
      el = <textarea
        id={id}
        {...domProps}
        value={value}
        onChange={(ev) => {
          commit(ev.target.value);
        }}
      />;
      break;

    case 'number':
      el = <input
        id={id}
        type="number" step={schema.step || 1}
        {...domProps}
        value={value}
        onChange={(ev) => {
          commit(+ev.target.value);
        }}
      />;
      break;

    case 'boolean':
      el = <input
        id={id}
        type="checkbox"
        {...domProps}
        checked={value}
        onChange={(ev) => {
          commit(ev.target.checked);
        }}
      />;
      break;

    case 'file':
      el = <input
        id={id}
        type="file"
        {...domProps}
        value=""
        onChange={(ev) => {
          handleFile(ev.target);
        }}
      />;
      break;

    default:
      el = <pre>{JSON.stringify(value, null, 2)}</pre>;
  }

  return <p className="quickFormRow">
    <label htmlFor={id}>{schema.label || props.name}</label>
    {el}
  </p>;
};

export default function makeForm<SCHEMA extends BaseFormSchema>(schema: SCHEMA) {
  const schema2 = { ...schema };
  Object.keys(schema2).forEach((key) => {
    const field = schema2[key];
    if (!field.type) {
      const { value } = field;
      field.type =        (typeof value === 'string' && 'string')
        || (typeof value === 'number' && 'number')
        || (typeof value === 'boolean' && 'boolean')
        || (value instanceof Blob && 'file')
        || 'readonly';
    }
  });

  const QuickForm = function QuickForm(props: {
    value: FormResultOf<SCHEMA>,
    onChange: (data: FormResultOf<SCHEMA>) => void
  }) {
    const commit = (key: keyof SCHEMA, val: any) => {
      props.onChange({ ...props.value, [key]: val });
    };

    return <form className="quickForm">
      {Object.keys(props.value).map((key: string & keyof SCHEMA) => <FormItem
          key={key}
          name={key}
          schema={schema[key]}
          onChange={val => commit(key, val)}
          value={props.value[key]}
        />)}
    </form>;
  };

  const extra = {
    getDefault(): FormResultOf<SCHEMA> {
      const obj = {} as FormResultOf<SCHEMA>;
      Object.keys(schema2).forEach((key: keyof SCHEMA) => {
        obj[key] = schema2[key].value;
      });
      return obj;
    },
  };

  Object.assign(QuickForm, extra);
  return QuickForm as typeof QuickForm & typeof extra;
}
