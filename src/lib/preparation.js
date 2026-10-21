// Préparation des données de la carte des déchets dangereux (reprise du notebook).
import * as d3 from "d3";

// Identifiant d'établissement normalisé sur 10 caractères ("0005207123")
export const idDe = (x) => String(x).trim().padStart(10, "0");

// Libellé nettoyé (retours chariot, espaces multiples)
export const texte = (x) => String(x ?? "").replace(/\s+/g, " ").trim();

// Remet les anneaux dans le sens attendu par d3 (sinon le polygone couvre le globe)
export function redresser(entite) {
  if (d3.geoArea(entite) <= 2 * Math.PI) return entite;
  const inverser = (anneaux) => anneaux.map((a) => [...a].reverse());
  const g = entite.geometry;
  return {
    ...entite,
    geometry: {
      ...g,
      coordinates: g.type === "Polygon" ? inverser(g.coordinates) : g.coordinates.map(inverser),
    },
  };
}

// Contours des 28 communes, redressés
export function preparerCommunes(carteCommunes) {
  return { type: "FeatureCollection", features: carteCommunes.features.map(redresser) };
}

// Zones PPRT dont au moins un sommet tombe dans la métropole
export function preparerPprt(zonesPprt, communes) {
  return zonesPprt.features.map(redresser).filter((f) => {
    const sommets =
      f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates.flatMap((p) => p[0]);
    return sommets.some((pt) => communes.features.some((c) => d3.geoContains(c, pt)));
  });
}

// Lignes de déclaration → { id, tonnes } ; une quantité à 0 compte comme non déclarée
export function preparerDechets(declarations) {
  return declarations.map((d) => ({
    id: idDe(d.identifiant),
    tonnes: d.quantite > 0 ? d.quantite : null,
  }));
}

// Un site par établissement localisé : tonnes cumulées, dans ou hors PPRT
export function preparerSites(localisations, dechets, communes, pprt) {
  const tonnesParId = new Map();
  for (const l of dechets) {
    if (l.tonnes === null) continue;
    tonnesParId.set(l.id, (tonnesParId.get(l.id) ?? 0) + l.tonnes);
  }
  return localisations
    .filter((s) => tonnesParId.has(idDe(s.ident)))
    .map((s) => {
      const coord = s.geo_shape.geometry.coordinates;
      return {
        id: idDe(s.ident),
        nom: texte(s.libelle),
        lon: coord[0],
        lat: coord[1],
        tonnes: tonnesParId.get(idDe(s.ident)),
        dansPprt: pprt.some((p) => d3.geoContains(p, coord)),
      };
    })
    .filter((s) => communes.features.some((c) => d3.geoContains(c, [s.lon, s.lat])))
    .toSorted((a, b) => b.tonnes - a.tonnes);
}
