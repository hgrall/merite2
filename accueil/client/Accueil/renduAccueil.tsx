import React from "react";
import ReactDOM from "react-dom";

import { createGlobalStyle } from "styled-components";

import { Corps } from "./corps";

const GlobalStyle = createGlobalStyle`
  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    background: #FDF9F3;
  }

  body, html, #root {
    height: 100%;
    font-family: -apple-system, Ubuntu , BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;;
  }
`;

ReactDOM.render(
    <><Corps/><GlobalStyle/></>,
    document.getElementById("conteneur")
);

