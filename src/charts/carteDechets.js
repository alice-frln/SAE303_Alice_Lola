// Carte V2 : déchets dangereux déclarés en 2025 et zones PPRT (recopiée du notebook).
// Reçoit ses données en paramètre ; `document` permet le rendu au build (JSDOM).
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

const fr = (n) => Math.round(n).toLocaleString("fr-FR");

export function carteDechets({ communes, pprt, sites }, { width = 720, nbNoms = 4, document } = {}) {
  const max = d3.max(sites, (s) => s.tonnes);
  const reperes = [{ t: 1000 }, { t: 10000 }, { t: 30000 }];
  const etiquettes = sites.slice(0, 8).filter((s, i, a) => a.findIndex((x) => x.nom === s.nom) === i).slice(0, nbNoms);
  return Plot.plot({
    document,
    width,
    height: Math.round(width * 0.95),
    margin: 10,
    title: "Un site concentre plus de la moitié des déchets dangereux de la métropole, peu sont en zone PPRT",
    subtitle:
      "Un seul site (SARP, Bassens) déclare 52 % des 72 012 t de la métropole. " +
      "Seuls 8 sites sur 67, soit 5,5 % des tonnes, sont dans une zone PPRT.",
    caption:
      "Sources : déclarations 2025 de production de déchets dangereux, localisation des établissements, " +
      "périmètres PPRT, limites communales (Bordeaux Métropole, 28 communes). Surface du cercle proportionnelle aux tonnes déclarées. " +
      "1 site sans quantité déclarée n'est pas représenté. Production déclarée ≠ pollution. Le niveau des zones PPRT n'est pas représenté.",
    ariaLabel:
      "Carte de Bordeaux Métropole montrant, par des cercles proportionnels, les tonnes de déchets dangereux déclarées en 2025 par 67 sites, " +
      "et les 6 zones de plan de prévention des risques technologiques qui touchent la métropole. " +
      "Le plus gros cercle est à Bassens (SARP, 37 149 t), très loin devant les autres, " +
      "dont deux sites Valbom à Bègles (9 478 t au total). Seuls 8 sites sont dans une zone PPRT, pour 3 977 t sur 72 012 t.",
    projection: { type: "mercator", domain: communes },
    r: { range: [2, 30], domain: [0, max] },
    color: {
      type: "categorical",
      domain: ["Hors zone PPRT", "Dans une zone PPRT"],
      range: ["#2b6cb0", "#c05621"],
      legend: true,
    },
    marks: [
      Plot.geo(communes, { fill: "#f1f1ee", stroke: "white", strokeWidth: 1 }),
      Plot.geo(pprt, { fill: "#ed8936", fillOpacity: 0.3, stroke: "#c05621", strokeWidth: 1.2 }),
      Plot.text(communes.features, Plot.centroid({
        text: (d) => d.properties.nom,
        fill: "#8a8a85",
        fontSize: 9,
        stroke: "white",
        strokeWidth: 3,
      })),
      Plot.dot(sites, {
        x: "lon", y: "lat", r: "tonnes",
        fill: (d) => (d.dansPprt ? "Dans une zone PPRT" : "Hors zone PPRT"),
        fillOpacity: 0.65, stroke: "white", strokeWidth: 0.8,
        sort: { channel: "-r" },
      }),

      Plot.text(etiquettes.slice(0, 1), {
        x: "lon", y: "lat", text: (d) => `${d.nom.split(" ")[0]} · ${fr(d.tonnes)} t`,
        dx: 34, textAnchor: "start", fontSize: 11, fontWeight: "bold", fill: "#1a202c", stroke: "white", strokeWidth: 3,
      }),
      Plot.text(etiquettes.slice(1), {
        x: "lon", y: "lat", text: (d) => `${d.nom.split(" ").slice(0, 2).join(" ")} · ${fr(d.tonnes)} t`,
        dy: -14, fontSize: 10, fontWeight: "bold", fill: "#1a202c", stroke: "white", strokeWidth: 3,
      }),
      ...reperes.flatMap((r, i) => [
        Plot.dot([r], { r: "t", frameAnchor: "bottom-left", dx: 45 + 75 * i, dy: -40, fill: "none", stroke: "#555" }),
        Plot.text([r], { frameAnchor: "bottom-left", dx: 45 + 75 * i, dy: -2, text: (d) => fr(d.t) + " t", fontSize: 9, fill: "#555" }),
      ]),
    ],
  });
}
