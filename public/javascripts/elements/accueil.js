"use strict";

Vue.component('accueil', {
  props: ["passer_valeur_initiale"],
  template: "<section class=\"accueil flex\"> <img v-on:click=\"selection_initiale\" src=\"/images/logo_cm.jpg\"> </section>",
  methods: {
    selection_initiale: function selection_initiale(event) {
      this.passer_valeur_initiale(event); // TODO retourner la valeur qui lancera l'application
    }
  }
});