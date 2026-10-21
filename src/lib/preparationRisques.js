// Préparation des données de la carte des risques (reprise du notebook).
import * as d3 from "d3";

export function preparerCarteRisques({ communes, pprt, etablissements, basol }) {
  const redresser = (f) => {
    if (d3.geoArea(f) <= 2 * Math.PI) return f;
    const inverser = (anneaux) => anneaux.map((a) => [...a].reverse());
    const g = f.geometry;
    return { ...f, geometry: { ...g, coordinates: g.type === "Polygon" ? inverser(g.coordinates) : g.coordinates.map(inverser) } };
  };
  const arrondir = (c) => (Array.isArray(c[0]) ? c.map(arrondir) : [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4]);
  const alleger = (f, proprietes) => ({
    type: "Feature",
    properties: proprietes(f.properties),
    geometry: { type: f.geometry.type, coordinates: arrondir(f.geometry.coordinates) },
  });

  const comm = communes.features.map(redresser);
  const dansCommune = (pt) => comm.find((c) => d3.geoContains(c, pt))?.properties.insee ?? null;
  const zones = pprt.features.map(redresser).filter((f) => {
    const sommets = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates.flatMap((p) => p[0]);
    return sommets.some((pt) => dansCommune(pt) !== null);
  });
  const dansPprt = (pt) => zones.some((z) => d3.geoContains(z, pt));
  const arr4 = (n) => Math.round(n * 1e4) / 1e4;

  return {
    communes: comm.map((f) => alleger(f, (p) => ({ nom: p.nom, insee: p.insee }))),
    pprt: zones.map((f) => alleger(f, (p) => ({ libelle: p.libelle }))),

    etablissements: etablissements
      .map((e) => {
        const [lon, lat] = e.geo_shape.geometry.coordinates;
        return { nom: String(e.libelle ?? "").trim(), lon: arr4(lon), lat: arr4(lat), dansPprt: dansPprt([lon, lat]), insee: dansCommune([lon, lat]) };
      })
      .filter((e) => e.insee !== null),
    basol: basol.features
      .map((f) => {
        const [lon, lat] = f.geometry.type === "MultiPoint" ? f.geometry.coordinates[0] : f.geometry.coordinates;
        return { nom: String(f.properties.libelle ?? "").trim(), lon: arr4(lon), lat: arr4(lat), enCours: f.properties.statut_instruction === "EN_COURS", dansPprt: dansPprt([lon, lat]), insee: dansCommune([lon, lat]) };
      })
      .filter((b) => b.insee !== null),
  };
}

// Sous-ensemble pour une commune : sa forme, ses points, les PPRT qui la touchent
export function filtrerCommune(donnees, insee) {
  const commune = donnees.communes.find((c) => c.properties.insee === insee);
  const sommets = (f) =>
    f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates.flatMap((p) => p[0]);
  const touche = (z) =>
    sommets(z).some((pt) => d3.geoContains(commune, pt)) || sommets(commune).some((pt) => d3.geoContains(z, pt));
  return {
    communes: [commune],
    pprt: donnees.pprt.filter(touche),
    etablissements: donnees.etablissements.filter((e) => e.insee === insee),
    basol: donnees.basol.filter((b) => b.insee === insee),
  };
}

// "Saint-Médard-en-Jalles" → "saint-medard-en-jalles"
export const slug = (nom) =>
  nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
