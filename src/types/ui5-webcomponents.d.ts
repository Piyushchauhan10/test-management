import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ui5-flexible-column-layout": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        layout?: string;
        "disable-resizing"?: boolean;
      };
    }
  }
}
