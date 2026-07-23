import { forwardRef, type AnchorHTMLAttributes } from "react"

type ExternalAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "target" | "rel"
>

const ExternalAnchor = forwardRef<HTMLAnchorElement, ExternalAnchorProps>(
  ({ children, ...props }, ref) => (
    <a ref={ref} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
)

ExternalAnchor.displayName = "ExternalAnchor"

export default ExternalAnchor
