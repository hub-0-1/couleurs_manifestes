/*
 * TODO 
 * Ajouter logique de selection de la premiere oeuvre
 * Ajouter logique de selection des nouvelles oeuvres
 * Ajouter logique de selection des nouvelles dimensions
 */

import Oeuvre from "./elements/oeuvre.js";
import Accueil from "./elements/accueil.js";
import Erreur from "./elements/erreur.js";
import Interactions from "./elements/interactions.js";

require('../sass/mobile.scss');

import Vue2TouchEvents from 'vue2-touch-events'; //https://www.npmjs.com/package/vue2-touch-events
Vue.use(Vue2TouchEvents);

// Creation de l'application
function lancer_couleurs_manifestes () {
  new Vue({
    el: '#container-application',
    components: {
      'oeuvre': Oeuvre,
      'accueil': Accueil,
      'erreur': Erreur,
      'interactions': Interactions
    },
    template: `<div id="container-application">
      <transition appear name="fade" mode="out-in">
        <accueil v-if="ecran == 'accueil'" v-on:charger-application="charger_application" />
        <section v-else-if="ecran == 'oeuvre'" class="oeuvres">
          <oeuvre v-bind:infos="get_oeuvre_active_infos" v-on:set-actif="set_actif" />
          <interactions v-bind:infos="get_oeuvre_active_infos" v-on:set-actif="set_actif" v-on:partager="partager" />
        </section>
        <erreur v-else v-bind:message="message_erreur" />
      </transition>
    </div>`,
    data: {
      clef_encryption: "couleurs_manifestes",
      parcours: [],
      ecran: 'accueil',
      oeuvres: [],
      oeuvre_active: null,
      dimension_active: null,
      message_erreur: "Donnees indisponibles"
    },
    created: function () {

      // Charger les oeuvres
      this.get_oeuvres()
        .then(() => { 
          
          // Recharger le parcours
          if(window.parcours) {
            this.parcours = window.parcours.parcours;
            this.charger_application();
          }
        });
    },
    methods: {

      // Chargement
      charger_application: function (seed) {

        // Parcours actif
        if(this.parcours.length > 0) {
          let dernier_affichage = this.parcours[this.parcours.length - 1].split("#");
          this.set_actif({
            id_oeuvre: dernier_affichage[0],
            id_dimension: dernier_affichage[1],
            skip_update_parcours: true
          });
        }

        // Nouvelle utilisation
        else {
          // TODO utiliser le seed ici
          this.set_actif( { id_oeuvre: -1, skip_update_parcours: true });
          this.set_actif( { id_dimension: this.list_dimensions(this.oeuvre_active)[0] } );
        }

        this.afficher_oeuvre(); 
      },
      get_oeuvres: function () {
        return new Promise ((resolve, reject) => {
          if(this.oeuvres.length > 0) {
            resolve(this.oeuvres);
          }
          else {
            fetch("/oeuvres.json")
              .then((res) => {
                if(!res.ok){
                  console.error(response.statusText);
                  reject(response.statusText);
                }
                else {
                  return res.json();
                }
              })
              .then((oeuvres) => { 
                this.oeuvres = oeuvres;
                resolve(this.oeuvres);
              })
              .catch((err) => {
                console.error(err);
                reject(err);
              });
          }
        });
      },

      // Affichage
      afficher_oeuvre: function () {
        this.ecran = "oeuvre";
      },
      afficher_erreur: function (message) {
        if(message) { this.message_erreur = message; }
        this.ecran = "erreur";
      },
      partager: function () {

        // Sauvegarder le parcours
        fetch("/parcours", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.parcours)
        }).then((data) => { return data.json(); })

        // Charger la nouvelle page
          .then((res) => { 
            window.location.href = "/p/" + res.page_parcours; 
          });
      },

      // Comportement
      set_actif: function (opts) {

        // Oeuvre active
        if(opts.id_oeuvre) {

          // Mettre a jour l'oeuvre
          this.oeuvre_active = this.oeuvres[(opts.id_oeuvre < 0) ? (Math.floor(Math.random() * this.oeuvres.length)) : opts.id_oeuvre];

          // Mettre a jour la dimension
          let id_dim = opts.id_dimension || this.premiere_dimension(this.oeuvre_active).id;
          let index_dim = this.list_dimensions(this.oeuvre_active).findIndex((dim) => { return id_dim == dim });

          this.dimension_active = this.oeuvre_active.dimensions[index_dim >= 0 ? id_dim : this.premiere_dimension(this.oeuvre_active).id];
        }
        
        // Dimension active
        else if(opts.id_dimension) {
          this.dimension_active = this.oeuvre_active.dimensions[opts.id_dimension];
        }

        // Update parcours
        if(!opts.skip_update_parcours) this.parcours.push([this.oeuvre_active.id, this.dimension_active.id].join("#"));
      },

      // Utils
      list_dimensions: function (oeuvre) {
        return Object.keys(oeuvre.dimensions);
      },
      premiere_dimension: function (oeuvre) {
        return oeuvre.dimensions[this.list_dimensions(oeuvre)[0]];
      }
    },

    computed: {
      get_oeuvre_active_infos: function () {
        return {
          oeuvre: this.oeuvre_active,
          dimension_precedente: this.dimension_precedente,
          dimension_active: this.dimension_active,
          dimension_suivante: this.dimension_suivante
        }
      },
      dimension_precedente: function () {
        var noms_dimensions = this.list_dimensions(this.oeuvre_active);
        var index_actif = noms_dimensions.findIndex((dim) => { return dim == this.dimension_active.id; });

        return this.oeuvre_active.dimensions[noms_dimensions[(index_actif > 0) ? index_actif - 1 : noms_dimensions.length - 1]];
      },
      dimension_suivante: function () {
        var noms_dimensions = this.list_dimensions(this.oeuvre_active);
        var index_actif = noms_dimensions.findIndex((dim) => { return dim == this.dimension_active.id; });

        return this.oeuvre_active.dimensions[noms_dimensions[(index_actif < noms_dimensions.length - 1) ? index_actif + 1 : 0]];
      }
    }
  });
}

window.onload = lancer_couleurs_manifestes;
