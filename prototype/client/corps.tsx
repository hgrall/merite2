import * as React from "react";

interface Etat {
  attribut : string,
}

export class Corps extends React.Component<{}, Etat> {
    constructor(props: {}) {
        super(props);
        this.state = {
            attribut: "",
        };
    }

    componentDidMount(): void {
      // TODO 
      // - poster un message de connexion (service rest, requête post)
      // - établir une connexion SSE et recevoir les avertissements de connexion
      // - afficher ces messages

    }

    render() {
      return "salut";
    }
}
