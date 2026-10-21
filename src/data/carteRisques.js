// Données de la carte des risques, calculées une seule fois au build
// et partagées par la page métropole et les 28 pages communes.
import { preparerCarteRisques } from "../lib/preparationRisques.js";
import carteCommunes from "../assets/fv_commu_s.geojson?raw";
import zonesPprt from "../assets/ri_pprt_s.geojson?raw";
import basolGeo from "../assets/ri_basol_p.geojson?raw";
import etabPolluantsGeo from "../assets/ri_etab_pol_p.json";

export const donneesCarteRisques = preparerCarteRisques({
  communes: JSON.parse(carteCommunes),
  pprt: JSON.parse(zonesPprt),
  etablissements: etabPolluantsGeo,
  basol: JSON.parse(basolGeo),
});

export const listeCommunes = donneesCarteRisques.communes
  .map((c) => c.properties)
  .toSorted((a, b) => a.nom.localeCompare(b.nom, "fr"));
