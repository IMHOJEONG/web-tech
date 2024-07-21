interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {}

export default function Button(props: ButtonProps) {
  return <button {...props} />;
}
