import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MainMenu } from "./ui/main-menu";

export function render(): string {
  return renderToStaticMarkup(createElement(MainMenu));
}
