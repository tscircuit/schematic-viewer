interface Props {
  text: string
}

export default ({ text }: Props) => {
  return (
    <div
      style={{
        position: "fixed",
        backgroundColor: "red",
        color: "white",
        fontSize: 14,
        fontFamily: "sans-serif",
        padding: 5,
        right: 0,
        top: 0,
        opacity: 0.75,
      }}
    >
      {text}
    </div>
  )
}
