interface InputProps extends React.HTMLAttributes<HTMLInputElement> {}

export default function Input(props: InputProps) {
  return <input type="text" {...props} />;
}
